# AGENTS.md

## Scope

These instructions apply only to the `node-oauth2-server` repository, the framework-agnostic OAuth 2.0 server library
published as `@node-oauth/oauth2-server`.

The sibling `express-oauth-server` repository is outside this file’s scope. Release CI checks out the Express adapter
as an external integration-test target; it is not a runtime dependency of this package. Changes to the adapter’s code,
documentation, security policy, and release process are outside this scope.

Run package commands from the `node-oauth2-server` repository root; do not expect a parent workspace-level install or
test command. Before changing the package, check `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, and `package.json`.

## AI context exclusions

Before exploring the repository, read [`.aiignore`](./.aiignore) and apply its patterns using gitignore syntax,
relative to this repository root. Agents must follow these exclusions explicitly: exclude matching paths from routine
file listings, searches, reads, and manual edits, including when using tools that do not honor `.aiignore` themselves.
Access an excluded path only when the user’s task specifically requires it. Build, test, coverage, and documentation
commands may create or update excluded output; use the source files when making changes to generated content.

## Project priorities

- Preserve OAuth 2.0 interoperability and security. Review behavior against the relevant standards, especially RFC 6749,
  RFC 6750, RFC 7636, RFC 8252, and the threat-model guidance in RFC 6819.
- Keep `node-oauth2-server` framework-agnostic. Framework-specific behavior belongs in adapters maintained separately
  from this repository.
- Treat authentication, authorization, token, grant, PKCE, parsing, and error-handling changes as security-sensitive.
  Avoid weakening validation or disclosure of credentials and tokens in logs, errors, tests, or documentation.
- The public API includes JavaScript entry points and TypeScript declarations. Update `index.d.ts` when a public API or
  type contract changes.
- The package uses CommonJS entry points and Promise/`async`-oriented APIs. Preserve existing public behavior unless a
  change is intentional, documented, and tested.

## Repository layout

- Runtime code: `index.js` and `lib/`
- Type declarations: `index.d.ts`
- Tests: `test/` (Mocha files matching `test/**/*_test.js`)
- Test suites: `test/unit/`, `test/integration/`, and `test/compliance/`; shared fixtures/helpers: `test/helpers/`
- Mocha configuration: `.mocharc.yml`; shared Chai assertions: `test/assertions.js`
- Hand-authored documentation: `docs/guide/` and the VitePress home/configuration files
- Generated API documentation: `docs/api/`
- Formatting and linting: Biome, configured in `biome.json`
- CI and release validation: `.github/workflows/`

## Library architecture

The library implements OAuth workflows without owning HTTP routing, a database, user sessions, or a consent UI.
Applications and framework adapters supply those pieces. The main flow is: adapter creates `Request`/`Response`
instances, calls `OAuth2Server`, and sends the populated response; handlers delegate persistence and policy to the
application’s model.

- **Public facade:** `index.js` exports the `OAuth2Server` constructor, `Request`, `Response`, `AbstractGrantType`, and
  error classes. `lib/server.js` exposes `authenticate()`, `authorize()`, and `token()`. Each call merges method
  defaults, constructor options, and per-call options in that order, creates a handler, and returns its Promise.
  `index.d.ts` describes the public TypeScript contracts.
- **HTTP boundary:** `lib/request.js` wraps already-parsed headers, method, query, and body; `lib/response.js` holds
  status, headers, and body. Headers are normalized to lowercase. Handlers require these wrapper instances and mutate
  the response without sending it. The caller must handle both the resolved result or rejected error and the response
  state, including redirects and authentication headers.
- **Resource authentication:** `lib/handlers/authenticate-handler.js` extracts a bearer token, rejects conflicting
  token sources, calls `model.getAccessToken()`, checks expiry, and calls `model.verifyScope()` when scopes are
  requested. It returns the stored token object and manages scope and `WWW-Authenticate` headers.
- **Authorization endpoint:** `lib/handlers/authorize-handler.js` validates the client, redirect URI, state, and scope,
  obtains the user through a supplied `authenticateHandler` (or bearer authentication by default), and saves an
  authorization code through the model. `lib/response-types/code-response-type.js` builds the code redirect. Only the
  `code` response type is registered; `token-response-type.js` is an unimplemented placeholder.
- **Token endpoint:** `lib/handlers/token-handler.js` validates form-encoded POST requests, obtains client credentials,
  delegates client authentication to `model.getClient()`, checks the client’s allowed grants, and dispatches by
  `grant_type`. The saved token data is returned to the caller; `lib/models/token-model.js` validates and prepares it
  for `lib/token-types/bearer-token-type.js` to serialize into the OAuth response, with cache-prevention headers.
  Internal scopes are arrays; the token response converts them to a space-delimited string. Bearer is the issued token
  type; `mac-token-type.js` is an unimplemented placeholder.
- **Grant implementations:** `lib/grant-types/` contains authorization-code, client-credentials, password, and
  refresh-token workflows. `AbstractGrantType` shares token generation, expiration, and scope handling. Grants obtain
  users and credentials through the model and persist results through `saveToken()`. Custom grant constructors are
  registered through `extendedGrantTypes` and implement `handle(request, client)`; the exported base class provides
  reusable helpers. Client-specific token lifetimes override server defaults.
- **Storage and policy boundary:** `options.model` is an application-supplied object whose required methods depend on
  the selected workflow. Hooks cover client/user lookup, token/code lookup and persistence, revocation, scope policy,
  redirect validation, and optional token/code generation. Hooks may return plain values or Promises. `lib/model.js`
  documents this contract and provides throwing stubs and a `Model.from()` helper; it is not a persistence layer and
  is not exported by the package entry point. In particular, `getClient()` must enforce per-client secret policy;
  PKCE and grant-level secret-presence options do not replace confidential-client authentication.
- **Security-sensitive sequencing:** authorization-code exchange validates the stored code and client, revokes the
  code, then checks PKCE and redirect binding before issuing tokens. A failed PKCE attempt therefore consumes the code.
  Refresh exchange validates token ownership, expiry, and requested scope before revocation; scopes cannot expand,
  and refresh-token rotation is enabled by default. Preserve these orderings when modifying grant logic.
- **Shared protocol support:** `lib/pkce/pkce.js` and `lib/utils/` provide PKCE, cryptographic token generation, scope
  parsing, and date/string helpers. Default token generation uses Node’s cryptographic random bytes; model hooks may
  override it. PKCE defaults to `S256`, allows `plain` only when explicitly enabled, and can be required through
  `requirePKCE`. `lib/errors/` defines the `OAuthError` hierarchy with OAuth names and HTTP status codes; handlers
  translate errors into endpoint-specific bodies, redirects, or headers and reject the operation. Token and
  authorization handlers normalize caught programming/configuration errors to `ServerError`.

## Setup and validation

Use the lockfile and install dependencies from the repository root:

```bash
npm ci
```

Validation commands:

```bash
npm test                 # pretest runs Biome check, then Mocha runs all three test suites
npm run lint
npm run format
npm run test:coverage
npm run docs:build       # for documentation or public JSDoc changes
```

Code style is enforced by the Biome linter and formatter configured in `biome.json`. Both `npm run lint` and
`npm run format` must pass before every commit, along with `npm test`. Use `npm run lint:fix` and `npm run format:fix`
only when you intend to apply automated changes. The configured formatter uses single quotes, spaces, trailing
commas, and a 120-column line width for JavaScript.

Biome currently checks `index.js`, `lib/**/*.js`, and `test/**/*.js`. A passing Biome check does not validate Markdown,
TypeScript declarations, documentation tooling, or workflow files; review those changes separately.

Write tests with Mocha and Chai, using Chai’s `should` style assertions. Use Sinon for stubbing, and restore stubs and
fake timers after each test so they cannot affect other tests. Reuse the existing test helpers and shared assertions.

Run focused tests during iteration, but run the full package test, lint, and format commands before submitting a
change. Add or update tests for every bug fix and feature. Include regression coverage for security-sensitive
behavior and boundary cases.

For a focused run, use `npm test -- --grep 'suite or test name'`; this retains the Biome `pretest` check.

Measure test coverage with nyc (Istanbul) via `npm run test:coverage`. Strive for the highest possible test coverage
across statements, branches, functions, and lines, including error paths and boundary cases. The test workflows
currently enforce a minimum coverage of 98% using `coverage/lcov.info`. The coverage command does not run the
`pretest` hook, so it does not replace the required Biome checks.

`package.json` is the source of truth for supported Node.js versions. Follow its `engines.node` declaration when
developing, rather than prescribing a separate version policy here. If a change relies on a newer Node.js feature,
verify it against that declaration and document any intentional compatibility change. Development tools may require a
newer Node.js version than the library’s runtime minimum; check their engine requirements if setup fails without
changing the library’s support policy merely to match the local toolchain.

## Source and documentation workflow

- Add or update JSDoc for new or changed public APIs and keep `index.d.ts` in sync.
- Do not manually edit files under `docs/api/`. Update source JSDoc in `lib/`, then run `npm run docs:api` from the
  repository root.
- Edit the guide under `docs/guide/` directly. `npm run docs:setup` creates the contribution-guide link used by the docs
  build; edit the root `CONTRIBUTING.md` rather than `docs/guide/contributing.md`.
- Use the `docs:*` scripts in `package.json`; the `npm run docs` example in `CONTRIBUTING.md` is outdated.
- Keep README, API documentation, migration notes, and type declarations aligned with behavior. Do not update generated
  output without checking whether the corresponding source change is present.
- Do not edit `CHANGELOG.md` or bump release versions for ordinary feature or bug-fix pull requests; maintainers handle
  release bookkeeping.

## Contributions and Git workflow

Follow [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the established contribution process, including opening or discussing
an issue before an ordinary feature or bug-fix pull request. Follow the private reporting process below for security
issues. The branching policy below takes precedence over the guide’s outdated `development` instructions.

Use trunk-based development with `master` as the trunk. The `development` branch is deprecated. Create feature or fix
branches from `master`, keep them closely aligned with it, and target pull requests to `master`. The `master` name is
retained for historical continuity.

Use the documented commit style when applicable:

```text
<type>(<scope>): <short summary> #<issue number>
```

The type and summary are required; scope and issue number are optional. Use a lowercase, present-tense summary with
no trailing period.

Keep commits focused, avoid unrelated dependency updates, describe test/reproduction steps in pull requests, and do not
include secrets or real credentials in fixtures, examples, logs, or documentation.

## Security reporting

Never report a suspected vulnerability in a public issue, pull request, or discussion. Follow
[`SECURITY.md`](./SECURITY.md), which directs reports to GitHub private vulnerability reporting. Before releasing a
security fix, the policy requires the full test suite and dependency audits to pass.

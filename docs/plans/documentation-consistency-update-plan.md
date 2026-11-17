# Documentation consistency update plan

Reviewed on 2026-10-13 against local commit `c57d565` (package version `5.3.1`).

## Scope and approach

This is a plan only. No documentation corrections, implementation changes, regenerated API pages, or commits were made during this review.

Reviewed the guides, generated API pages, documentation navigation and generation script against `lib/`, `index.js`, `index.d.ts`, and package scripts. Findings describe the local implementation; this is not an independent standards compliance audit or a verification of external adapter maintenance. Paths below are relative to the repository root. Source symbols identify the relevant implementation even if line numbers move.

The API pages are generated from JSDoc by `docs/build-api.js`. Correct their source comments and regenerate them during implementation; do not fix generated Markdown alone. `docs/guide/contributing.md` is a symlink to `CONTRIBUTING.md`, so its source must be updated there.

## Priority 1: examples and contracts that can break integrations

### 1. Distinguish HTTP scope strings from internal scope arrays

- **Documentation:** `docs/guide/migrating-to-v5.md`, “Scope is now Array”, says requests, responses, and models all require arrays. `docs/api/grant-types/abstract-grant-type.md` instead documents string results for `getScope` and `validateScope`; `docs/api/grant-types/authorization-code-grant-type.md` documents `requestedScope` as a string.
- **Evidence:** `lib/utils/scope-util.js:parseScope` accepts strings/null/undefined and rejects arrays. Authorization and grant handlers parse HTTP scope strings into arrays. `lib/handlers/token-handler.js:updateSuccessResponse` joins arrays into the HTTP response string. `AuthenticateHandler` separately accepts a string or array for the JavaScript `options.scope` setting.
- **Proposed update:** Explain the boundary with `scope=read write` on the wire, `['read', 'write']` in model hooks, and `scope: 'read write'` in token JSON. Correct grant JSDoc argument and return types, including the Promise return from `validateScope`, and document optional scope values.
- **Acceptance:** Examples use strings in HTTP requests, arrays in models, and strings in HTTP token responses; passing an HTTP array is explicitly unsupported.

### 2. Await and use validated scopes in the extension grant example

- **Documentation:** `docs/guide/grant-types.md`, `MyCustomGrantType.saveToken`, calls `this.validateScope(user, client, scope)` without awaiting or using its result.
- **Evidence:** `lib/grant-types/abstract-grant-type.js:validateScope` is async and returns the model's validated scope or rejects. Built-in password and client credentials grants await it and use the returned scope when generating and saving tokens.
- **Proposed update:** Use `const validatedScope = await this.validateScope(...)` and pass that value to both generators and `model.saveToken`. Explain that the extension must also appear in `client.grants`: `TokenHandler.handleGrantType` enforces this unconditionally, whereas the guide currently makes approval sound conditional on custom checks.
- **Acceptance:** An asynchronously rejected scope prevents saving a token, and a reduced scope is the one persisted and returned. An unapproved extension grant is documented as rejected.

### 3. Correct authorization error handling and response responsibilities

- **Documentation:** `docs/guide/getting-started.md`, “Sending the response”, returns JSON from every authorization catch block. It also says all three server methods populate status, headers, and body. `docs/guide/compliance.md` broadly promises error bodies and response headers.
- **Evidence:** `AuthorizeHandler.handle` sets a 302 error redirect and then throws for errors inside its redirect-capable block. The guide's catch discards that redirect. Earlier client/user failures can reject without a redirect. `AuthenticateHandler.handle` sets selected headers but does not populate an error status/body; token method/content-type checks occur before its response-producing catch. Token cache headers are set on success, not by `updateErrorResponse`.
- **Proposed update:** Show authorization handling that forwards a prepared redirect on success or failure, and uses an appropriate local error response when no redirect was prepared. Explain each endpoint's response contract and the integration's responsibility to handle rejections and copy headers. Do not expose arbitrary internal exceptions through a blanket JSON error handler. Change the adapter guide's instruction to copy fields onto the framework **response**, not its request.
- **Acceptance:** An `allowed=false` request sends the prepared error redirect including state; invalid-client errors without a prepared redirect are handled locally. Authentication and early token failures do not accidentally send the wrapper's default 200 response.

### 4. Repair the model requirements and authentication fallback guidance

- **Documentation:** `docs/guide/model.md` says `getAccessToken` is required when a custom authenticate handler is used and lists `verifyScope` as required without a custom handler. It mixes optional generators with required hooks for password/refresh grants. `docs/guide/compliance.md` says a custom handler must be supplied. `docs/api/model.md:verifyScope` says the hook is never called when an `authenticateHandler` option exists.
- **Evidence:** `AuthorizeHandler` falls back to `new AuthenticateHandler(options)` only when a custom handler is absent. That fallback needs `getAccessToken`; `verifyScope` is required when authentication scope checking is configured. `OAuth2Server.authenticate` always uses `AuthenticateHandler` regardless of `authenticateHandler`. `AbstractGrantType` supplies default token generators and permits omission of `validateScope`. The refresh constructor requires `revokeToken` even when rotation is disabled, although its invocation is then skipped.
- **Proposed update:** Separate authorization endpoint requirements from code exchange requirements and classify hooks as required, conditional, or optional. Explain the built-in bearer-token fallback and when a custom user/session handler is appropriate. Limit the custom-handler bypass statement to `authorize`.
- **Acceptance:** The required-hook lists match each constructor and call path, including scoped authentication and refresh rotation disabled.

### 5. Replace non-working native Promise examples

- **Documentation:** `docs/api/model.md` examples for `saveToken`, `getAccessToken`, `getRefreshToken`, and `getAuthorizationCode` use `.spread()`. The `saveToken` example also has a semicolon before `.spread`. `docs/api/server.md`'s token example names the resolved value `code` but accesses an undefined `token`.
- **Evidence:** `lib/model.js` and `lib/server.js` contain these source examples. Runtime code uses native async/await; `package.json` has no Promise implementation providing `.spread()`.
- **Proposed update:** Rewrite source examples with async/await or `.then(([...]) => ...)`, correct the token callback variable, and make optional refresh-token storage conditional so the example works for the client credentials grant as well.
- **Acceptance:** The snippets parse and execute with native Promises and a small in-memory model, including a token without refresh fields.

### 6. Include PKCE fields in the model contract and storage examples

- **Documentation:** `docs/api/model.md` omits `codeChallenge` and `codeChallengeMethod` from `AuthorizationCodeData`, `saveAuthorizationCode` parameters, and save/load examples. The PKCE guide explicitly requires preserving them.
- **Evidence:** `AuthorizeHandler.saveAuthorizationCode` supplies both fields; `AuthorizationCodeGrantType.verifyPKCE` consumes them. The existing model examples construct new objects without copying them. `index.d.ts` already includes both fields.
- **Proposed update:** Add the optional fields to JSDoc data types and persist/restore them in examples. Explain that dropping these fields prevents a PKCE exchange from succeeding.
- **Acceptance:** A code saved and loaded using the documented mapping retains both PKCE fields and succeeds with the matching verifier.

### 7. Make client authentication guidance match the available context

- **Documentation:** `docs/api/model.md:getClient` and `docs/guide/pkce.md` instruct models to reject confidential clients when a secret is absent, without adequately distinguishing authorization requests from token requests. `docs/api/server.md` also lists `requireClientAuthentication` as `object | boolean`.
- **Evidence:** `AuthorizeHandler.getClient` always calls `model.getClient(clientId, null)`, including for confidential clients. `TokenHandler.getClientCredentials` preserves a supplied secret and permits its absence for PKCE or configured grants. The same model hook has no explicit endpoint argument. A bare `requireClientAuthentication: false` does not disable the check; a per-grant map does. `index.d.ts` already uses `Record<string, boolean>`.
- **Proposed update:** Explain both `getClient` call contexts, supplied-secret validation, and the limitation of inferring endpoint/client authentication solely from an absent secret. Preserve the requirement to authenticate confidential token requests, but do not suggest a universal absent-secret rejection that breaks authorization. Describe endpoint-aware integration/model separation if presenting a complete enforcement example. Document the option as a per-grant map and explicitly reject the interpretation of a global boolean switch.
- **Acceptance:** A confidential client can start authorization without sending its secret to that endpoint, while the illustrated token integration rejects missing/wrong confidential credentials. Examples distinguish absent from supplied secrets and use maps for authentication options. Any desired runtime API enhancement is a separate task.

## Priority 2: incorrect API descriptions and missing behavior

### 8. Correct generated public signatures and helper signatures

- **Documentation:** `docs/api/server.md` renders `authenticate()` without arguments. `docs/api/request.md` and `docs/api/response.md` show positional constructor parameters; the latter includes a method parameter that is not a dedicated constructor field. Crypto and PKCE pages also show positional calls for object-argument functions.
- **Evidence:** `OAuth2Server.authenticate(request, response, options)` takes three arguments. `Request` and `Response` destructure one options object. `createHash`, `getHashForCodeChallenge`, and `isPKCERequest` each take one object. `Request.is` returns a matching MIME string or false, not just a boolean; `Request.get` can return undefined.
- **Proposed update:** Add parent options-object JSDoc parameters with nested fields, add missing server method parameters, and correct return types. Audit the published handler/grant methods currently rendered as zero-argument methods despite requiring inputs, such as `TokenHandler.handle` and `RefreshTokenGrantType.getRefreshToken`.
- **Acceptance:** Regenerated signatures agree with callable implementations and include usable invocation examples. Source changes are comment-only.

### 9. Correct the validateScope return type

- **Documentation:** `docs/api/model.md:validateScope` declares `Promise<boolean>`, while its own examples return arrays.
- **Evidence:** `AbstractGrantType.validateScope` and `AuthorizeHandler.validateScope` pass truthy results through as scopes. Token serialization expects an array with `.join()`. `index.d.ts` already describes `Promise<string[] | Falsey>`.
- **Proposed update:** Document an accepted array of scopes or a falsy rejection, with sync and async model implementations supported. Explain that returning `true` is not a usable validated scope. Keep `verifyScope`'s boolean contract distinct.
- **Acceptance:** Model examples return arrays on acceptance and false on rejection; the generated return type agrees with that contract.

### 10. Remove claims of native generator model support

- **Documentation:** `docs/guide/getting-started.md` lists ES6 generators as supported; `docs/api/model.md` says generator model functions are supported.
- **Evidence:** Runtime hooks are called and awaited directly. Neither `Model.from` nor the handlers execute generator iterators. A generator `getAccessToken` yields an iterator object and fails the required user check.
- **Proposed update:** Describe synchronous return values, Promises, and async functions as supported model implementations. If mentioning generator-based application code, make explicit that a caller-provided runner must return a supported value/Promise. Preserve older-version behavior only as historical migration context.
- **Acceptance:** No current-version guidance implies that passing a generator function directly as a model hook works.

### 11. Correct default token/code length and alphabet

- **Documentation:** `docs/api/model.md` says all three default generators produce 40 characters in `a..z0..9`.
- **Evidence:** `lib/utils/token-util.js:generateRandomToken` uses 32 random bytes encoded as hex; the defaults in `AbstractGrantType` and `AuthorizeHandler` call it. The output is 64 characters in `0..9a..f`.
- **Proposed update:** Correct all three source descriptions and clarify the bytes-versus-characters distinction in the utility description.
- **Acceptance:** Access-token, refresh-token, and authorization-code descriptions all match the shared 64-character hexadecimal default.

### 12. Explain PKCE method defaults and repair endpoint sketches

- **Documentation:** `docs/api/pkce/pkce.md:isValidMethod` says `sha256` is an accepted method. `docs/guide/pkce.md` does not explain plain-method gating/defaults, describes body parameters while showing query parameters, and references undefined `response` and `options` variables in endpoint sketches.
- **Evidence:** `lib/pkce/pkce.js:isValidMethod` accepts `S256` or `plain`, not `sha256`. Both authorization and code exchange disallow plain unless `enablePlainPKCE` is true, defaulting to S256 otherwise. Authorization reads challenge parameters from body or query. Authorization codes are revoked before verifier and redirect verification.
- **Proposed update:** Correct the algorithm identifier, document `enablePlainPKCE` and omitted-method behavior, instantiate response wrappers and define options/imports in examples, and explain sending the populated response. State that a failed verification consumes the code and a fresh authorization is needed. Preserve the already-correct `requirePKCE` and refresh-token explanations.
- **Acceptance:** Examples are self-contained or clearly mark prerequisites, use S256, and accurately describe optional PKCE and consumed-code behavior.

### 13. Narrow error normalization and unauthenticated-user descriptions

- **Documentation:** `docs/api/errors/invalid-argument-error.md` broadly says runtime `InvalidArgumentError`s from token/authorize become `ServerError`. `docs/api/server.md` tells a custom authenticate handler to return falsy for a logged-out user without explaining the result, and uses `request.query.allow` in one error description.
- **Evidence:** `AuthorizeHandler.handle` calls client/user lookup before its normalization catch. An `InvalidArgumentError` from those hooks propagates unchanged; `AuthenticateHandler` also preserves OAuth errors. `AuthorizeHandler.getUser` turns a falsy custom-handler result into `ServerError` (default status 503), not a login challenge. Denial actually uses `allowed` in either body or query.
- **Proposed update:** Document normalization boundaries and recommend handling login before authorization or explicitly managing the custom-handler error path. Correct `allow` to `allowed` and mention body input too. Record any wish to change error behavior separately rather than promising behavior the code lacks.
- **Acceptance:** Descriptions cover early versus caught failures and the actual falsy-user behavior; no runtime changes are bundled into the documentation correction.

### 14. Qualify broad compliance and model-responsibility claims

- **Documentation:** `docs/guide/compliance.md` says request parameters are read from both query and body, a custom authenticate handler must be supplied, and redirect validation is a model responsibility; it also broadly groups token existence, ownership, and expiry checks.
- **Evidence:** Authorization generally supports both locations, but token `grant_type`, credentials, code, verifier, refresh token, and password fields are body/header based; code exchange's redirect URI is an exception. `AuthorizeHandler.validateRedirectUri` defaults to exact inclusion in `client.redirectUris` without a custom model hook. Access-token authentication checks user/expiry but does not independently bind an access token to a requesting client; refresh expiry is checked only when present. Code revocation relies on the model's successful revocation result.
- **Proposed update:** Describe parameter locations per endpoint; distinguish required registered redirect data from the optional override hook; describe validation guarantees per credential type and the model's role in durable/atomic revocation. Link to the corrected response and authentication sections rather than making blanket claims.
- **Acceptance:** Every stated library guarantee is tied to an actual handler check. Standards recommendations are clearly separate from implemented behavior; any new standards claims require a separate source verification.

## Priority 3: navigation, incomplete coverage, and contributor instructions

### 15. Repair internal navigation and legacy link syntax

- **Documentation:** The client credentials section of `docs/guide/grant-types.md` links to refresh-token model requirements. `docs/guide/adapters.md` uses literal reStructuredText-style references such as `Request </api/request>` and a nonexistent `/api/oauth2-server` route. The PKCE guide and generated model/server pages contain similar legacy references. `docs/index.md` has an “API Docs” action without a link.
- **Evidence:** The relevant pages exist at `docs/guide/model.md#client-credentials-grant` and `docs/api/server.md`. Generated API pages already provide explicit anchors such as `Model+getClient` and `OAuth2Server+token`; guide links currently rely on long generated heading slugs that are sensitive to signature changes.
- **Proposed update:** Correct the client credentials target, replace literal legacy references with Markdown/JSDoc links, give the homepage API action `/api/server`, and standardize cross-page API links on verified anchors. Also correct the extension-grant reference whose label says section 4.5 but URL points to 4.4.
- **Acceptance:** Check rendered page fragments as well as file existence after regeneration. This review did not classify every long heading-slug link as broken; verify them using the renderer before changing them.

### 16. Fill the token guide and mark unsupported internals

- **Documentation:** `docs/guide/token-types.md` consists of empty authorization-code, access-token, and refresh-token sections. API navigation presents MAC and token response classes whose pages provide no implementation-status warning.
- **Evidence:** `TokenHandler.getTokenType` always creates a bearer token; `AuthorizeHandler` registers only the code response. `MacTokenType` and `TokenResponseType` constructors throw `ServerError('Not implemented.')`. `index.js` exports only a subset of the classes shown in the API, and does not export `Model`.
- **Proposed update:** Explain each credential's actual fields, expiry expectations, response representation, and lifecycle. Describe refresh rotation (default true), the disabled-rotation response without a new refresh token, scope narrowing, and optional refresh expiry. Mark MAC/implicit response implementations as unsupported placeholders and distinguish package exports from internal reference pages, including the `Model.from` example's import context.
- **Acceptance:** Readers can identify supported token/response types and public entry points without assuming that every generated class is exported or implemented.

### 17. Align documentation tooling instructions with package scripts

- **Documentation:** The contributing guide advertises `npm run docs`; `docs/build-api.js`'s usage comment refers to `scripts/build-docs-cli.js` and defaults of `src`/`docs`.
- **Evidence:** `package.json` defines `docs:api`, `docs:dev`, `docs:build`, `docs:preview`, and `docs:setup`, but no `docs` script. The actual generator is `docs/build-api.js` with defaults `lib/` and `docs/api/`. The contributing page symlinks to `CONTRIBUTING.md`.
- **Proposed update:** Replace the obsolete command with the correct script for the stated operation and correct generator usage comments. Keep the distinction between editing guides, editing source JSDoc, generating API pages, and building the site.
- **Acceptance:** Every documented local command resolves to an existing script/path and its described effect matches the implementation.

## Implementation sequence

1. Correct Priority 1 guide examples and the associated model/server JSDoc contracts together.
2. Correct remaining JSDoc signatures, types, defaults, and behavior descriptions without altering executable logic.
3. Regenerate API Markdown, then update guide links against the resulting anchors.
4. Complete token/reference coverage, contributor instructions, and navigation fixes.
5. Validate snippets with in-memory stubs, build documentation, inspect links/fragments, and review the final diff for accidental runtime changes. Keep this plan outside public navigation; decide explicitly whether planning files should be excluded from published pages.

## Verification performed during this review

Eight focused, in-memory runtime checks passed:

- HTTP scope strings parse to arrays and HTTP scope arrays are rejected.
- The default random token is a 64-character lowercase hexadecimal string.
- A global `requireClientAuthentication: false` leaves checks enabled, whereas a per-grant false disables the corresponding presence check.
- `Request.is` returns the matching MIME string for a matching form request.
- An early token-method error leaves response status/body at their defaults.
- An authorization denial rejects while leaving a prepared 302 error redirect.
- A falsy custom authenticate-handler result rejects with a server error.
- A generator model hook is not executed as a generator and fails authentication.

Source inspection confirmed the remaining findings. No full application test suite, documentation generation, or site build was run: this task changes only the plan, and the normal docs build regenerates existing API files and a guide symlink. Future implementation should run the snippet checks and docs build above in a suitable working copy. External links, current standards wording, and external adapter maintenance were not independently audited.

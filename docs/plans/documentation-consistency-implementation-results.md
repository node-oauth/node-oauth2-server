# Documentation consistency implementation results and history

Implemented on 2026-10-14 against `c57d565` (package version `5.3.1`).
Source plan: [documentation-consistency-update-plan.md](./documentation-consistency-update-plan.md).

All 17 plan items are implemented. Changes are uncommitted. The original plan
was preserved, including its pre-existing untracked status. No library behavior,
package exports, dependency declarations, or TypeScript contracts were changed.

## Results by plan item

| Item | Implementation result |
| --- | --- |
| 1. Scope boundary | Migration and token guides distinguish HTTP strings from model arrays, reject HTTP arrays, and explain omitted scope. Grant JSDoc now describes arrays and asynchronous validation. Authentication options accept strings or arrays. |
| 2. Extension grant | The example awaits validation and uses the returned scope for both generators and storage. Documentation makes `client.grants` approval mandatory. |
| 3. Response handling | Getting-started and PKCE authorization examples forward prepared redirects after rejection. Early failures use a local error response with fixed public descriptions. Authentication, token, and authorization response responsibilities are separated; adapters copy fields to the framework response. |
| 4. Model requirements | The model guide separates authorization from code exchange and required, conditional, and optional hooks. It explains bearer fallback, scoped authentication options, and the required refresh revocation hook even when rotation is disabled. Custom authentication bypass is limited to authorization. |
| 5. Native Promise examples | Model examples use native Promise destructuring and async/await. Refresh storage is conditional; lookup examples handle absent records. The server token example uses its resolved `token` variable. |
| 6. PKCE storage | Authorization-code types, parameters, and save/load mappings preserve `codeChallenge` and `codeChallengeMethod`. |
| 7. Client authentication | Model/server documentation distinguishes null-secret authorization lookup from token authentication. The PKCE guide supplies separate endpoint model wrappers that validate supplied secrets and reject missing confidential token credentials. The option is documented as a per-grant map. |
| 8. Signatures | Request/Response constructors and crypto/PKCE object arguments have parent options parameters. `authenticate` has request, response, and options parameters. Published handler/grant methods have their missing inputs documented. Request helper return types and wrapper examples are corrected. |
| 9. Scope validation result | `validateScope` documents an accepted array or falsy rejection, permits synchronous values, handles omitted scope in examples, and distinguishes `verifyScope`'s boolean result. |
| 10. Generators | Current guidance supports synchronous values, native Promises, and async functions. Direct generator hooks are explicitly unsupported without an application-provided runner. |
| 11. Random defaults | All three default generators document 32 random bytes encoded as 64 lowercase hexadecimal characters. |
| 12. PKCE workflow | Documentation uses S256, explains plain gating and omitted-method defaults, defines endpoint prerequisites/wrappers/options, and explains that failed verification after revocation consumes the code. Existing `requirePKCE` and refresh explanations are retained. |
| 13. Error boundaries | Error and server JSDoc distinguish early failures from normalization inside catch blocks, explain the 503 falsy-user result, and use `allowed` in body or query. |
| 14. Compliance boundaries | The compliance guide ties validation guarantees and parameter sources to individual endpoints. It distinguishes exact registered-redirect matching from the optional override, conditional refresh expiry, access-token authentication checks, and model-owned atomic revocation. |
| 15. Navigation | Fixed grant model targets, extension-grant RFC section target, legacy link notation, homepage API action, and cross-page API anchors. Added rendered anchor compatibility in VitePress after verification exposed fragment normalization mismatches. |
| 16. Token/reference coverage | The token guide describes credential fields, expiry, wire representation, lifecycle, refresh rotation and narrowing, and optional refresh expiry. Unsupported MAC/implicit classes are labeled in source JSDoc. Public exports and internal references, including `Model.from`, are distinguished. |
| 17. Contributor tooling | `CONTRIBUTING.md` uses `docs:api`; generator usage comments now name the actual script and defaults. The contributing-page symlink remains intact. |

All affected API Markdown was regenerated from source JSDoc, not patched directly.

## Implementation history

1. Read the plan, package scripts, guides, source comments, exports, and relevant
   handler/grant implementations. Confirmed the working repository was the nested
   `node-oauth2-server` checkout and that its existing untracked content was the
   planning directory.
2. Updated the integration examples and model contracts together. Filled the
   token guide and repaired the remaining signatures, defaults, and behavior
   descriptions in source comments.
3. Regenerated the API and built the site. Inspection caught a JSDoc parsing
   issue where descriptive text after `@constructor` became a class name; moved
   that text before the tag and regenerated the corrected signatures.
4. Added reproducible, in-memory checks that extract and run the actual examples.
   Checks covered reduced/rejected scopes, native Promises, PKCE storage/exchange,
   consumed codes, redirects and local failures, client authentication, refresh
   rotation, generator rejection, and error normalization.
5. Audited rendered HTML links. VitePress normalized fragments such as
   `Model+getClient` to `model-getclient`, while JSDoc's raw named anchors retained
   their original spelling. Added a Markdown renderer hook that supplies matching
   IDs for JSDoc anchors while retaining the original names. The first renderer
   attempt matched a complete anchor; inspection showed inline opening and closing
   tags are separate tokens, so the final hook matches the opening tag.
6. Explicitly excluded `plans/**` from published pages. The plan, this history,
   and the verification script remain repository artifacts outside public navigation.
7. Ran the existing tests, completed the final API/site build and acceptance
   checks, and compared parsed executable syntax against HEAD to confirm all
   library and generator edits are comment-only. No commit was created.

## Verification

Commands run from the repository root:

```sh
npm test
npm run docs:build
node docs/plans/documentation-consistency-checks.cjs
git diff --check -- . ':!docs/api'
```

- `npm test`: passed its Biome pretest check and all **464 tests**.
- `npm run docs:build`: regenerated the API, maintained the contributing symlink,
  and successfully built/rendered the site.
- [documentation-consistency-checks.cjs](./documentation-consistency-checks.cjs):
  **22 checks passed**, including actual guide and generated API examples,
  unchanged executable ASTs for modified library files and the API generator,
  and **2,991 local rendered page/fragment links**. No planning pages were published.
- Hand-edited tracked files passed the whitespace diff check. A full
  `git diff --check` reports the generator's existing Markdown trailing-space and
  blank-line conventions in regenerated output; these were retained so generated
  files remain reproducible from JSDoc.
- Final inspection confirmed corrected generated constructor/method signatures,
  removal of `.spread()` and obsolete documentation claims in the targeted files,
  and preservation of `docs/guide/contributing.md -> ../../CONTRIBUTING.md`.

The initial sandboxed generation/check runs could not complete subprocess calls
(`spawnSync ... EPERM`). They were rerun successfully with subprocess permissions.
Build output also included the existing npm `min-release-age` warning and JSDoc
module-tag warnings; runtime checks emitted Node's existing `url.parse()`
deprecation warning. None prevented final validation.

## Scope limits and deferred behavior changes

This implements documentation corrections, documentation rendering/navigation,
and verification only. No new standards claims or external adapter-maintenance
claims were independently verified, and external links were not audited.

Potential runtime enhancements remain separate work: endpoint/client-type context
in `getClient`, login-challenge behavior for a falsy custom user, broader error
normalization, or altered response preparation. The documentation describes the
current behavior without promising those changes.

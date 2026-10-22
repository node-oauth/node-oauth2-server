# Model Overview

[OAuth2Server](../api/server.md) accepts a plain object of storage and validation
hooks. Hooks may return synchronous values, native Promises, or use async/await.
Direct generator functions are unsupported; application generator code needs a
runner that returns a supported value or Promise. Callback support ended in v5.

## Request Authentication

`authenticate` requires [getAccessToken](../api/model.md#Model+getAccessToken).
[verifyScope](../api/model.md#Model+verifyScope) is required only when
`options.scope` configures scope checking. A custom `authenticateHandler` does
not replace `OAuth2Server.authenticate`.

## Grant Types

Required hooks must be provided even when a particular request does not reach
them. Optional generators have built-in defaults: 32 random bytes encoded as
64 lowercase hexadecimal characters. Scope validation is optional; without a
validator, requested scopes are accepted.

### Authorization Code Grant

Authorization endpoint requirements:

- Required: [getClient](../api/model.md#Model+getClient) and
  [saveAuthorizationCode](../api/model.md#Model+saveAuthorizationCode).
- Conditional: without a custom `authenticateHandler`, the built-in bearer
  authentication requires `getAccessToken`; scoped authentication also requires
  `verifyScope` and explicit `addAcceptedScopesHeader` and
  `addAuthorizedScopesHeader` options (each may be true or false).
- Optional: [generateAuthorizationCode](../api/model.md#Model+generateAuthorizationCode),
  [validateScope](../api/model.md#Model+validateScope), and
  [validateRedirectUri](../api/model.md#Model+validateRedirectUri).
  Registered `client.redirectUris` are required; the default validator checks exact inclusion.

For session-based login, supply a handler returning the logged-in user. Handle
login before calling `authorize`: a falsy user causes a `ServerError` (503),
not a login challenge. The bearer fallback uses the authenticated token's user.

Code exchange requirements:

- Required: `getClient`, [getAuthorizationCode](../api/model.md#Model+getAuthorizationCode),
  [revokeAuthorizationCode](../api/model.md#Model+revokeAuthorizationCode), and
  [saveToken](../api/model.md#Model+saveToken).
- Optional: `generateAccessToken`, `generateRefreshToken`, and `validateScope`.

Preserve `codeChallenge` and `codeChallengeMethod` when saving and loading codes.
See [PKCE](./pkce.md) for endpoint-specific client authentication.

### Client Credentials Grant

Required: `getClient`, `saveToken`, and
[getUserFromClient](../api/model.md#Model+getUserFromClient).
Optional: `generateAccessToken` and `validateScope`. No refresh token is issued.

### Refresh Token Grant

Required: `getClient`, `saveToken`,
[getRefreshToken](../api/model.md#Model+getRefreshToken), and
[revokeToken](../api/model.md#Model+revokeToken).
The constructor requires `revokeToken` even with
`alwaysIssueNewRefreshToken: false`, although it is not called in that mode.

Optional: `generateAccessToken` and `generateRefreshToken`.
Scope narrowing is checked against the stored token; `validateScope` is not called.

### Password Grant

Required: `getClient`, [getUser](../api/model.md#Model+getUser), and `saveToken`.
Optional: `generateAccessToken`, `generateRefreshToken`, and `validateScope`.
See the [password grant warning](./grant-types.md#password-grant-type).

### Extension Grants

See [extension grants](./grant-types.md#extension-grants) for custom hook requirements.

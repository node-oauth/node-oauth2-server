# OAuth 2.0 Token and Code Types

HTTP scope values are space-delimited strings; stored/model scope values are
arrays of strings or absent. See [scope migration](./migrating-to-v5.md#scope-arrays-inside-the-library).

## Authorization Code

A code is a single-use credential exchanged at the token endpoint. The model
stores `authorizationCode`, `expiresAt` (a Date), `redirectUri`, optional
`scope`, `client`, and `user`. PKCE adds `codeChallenge` and
`codeChallengeMethod`, both of which must survive storage.

The default lifetime is 300 seconds. The authorization response is a redirect
with `code` and, when supplied, `state`; PKCE fields are not sent back.
Exchange checks client ownership and expiry, then revokes the code before
checking PKCE and the redirect URI. Failed verification after revocation consumes
the code. The model must implement durable, atomic single-use revocation.

## Access Token

The model stores `accessToken`, `accessTokenExpiresAt` (a Date), optional
`scope`, `client`, and `user`. The default lifetime is 3600 seconds, with
a possible client-specific override. Authentication requires a user and a valid
expiry Date; scope checks run when configured.

The token endpoint sends JSON containing `access_token`, `token_type: 'Bearer'`,
`expires_in` (remaining seconds when available), optional `refresh_token`,
and optional `scope` as a string. Send the response wrapper's body, not the
internal model object. Bearer is the only implemented token type.

## Refresh Token

The model stores `refreshToken`, optional `refreshTokenExpiresAt` (a Date),
optional `scope`, `client`, and `user`. Generated tokens default to a
1209600-second lifetime; loaded refresh tokens are checked for expiry only when
that field exists. The client credentials grant does not issue refresh tokens.

By default, refresh exchange revokes the old token and issues a new refresh token
(`alwaysIssueNewRefreshToken: true`). With rotation disabled, the old token is
not revoked and the response contains no new refresh token; clients retain the
existing one. The `revokeToken` hook is still required by the constructor.

An omitted scope retains the original scope. A requested scope must be a subset
of the original; adding scopes is rejected before revocation. PKCE is not checked
during refresh; client authentication still applies.

## Public exports and internal references

The package exports `OAuth2Server` as its default CommonJS value, with
`Request`, `Response`, `AbstractGrantType`, and the error classes as properties.
Generated API pages also describe internal handlers, utilities, model classes,
and response/token classes; their presence does not make them package exports.

`Model` is an internal reference interface, not a package export. Applications
normally supply a plain object. `Model.from` examples use a repository-internal
import. `MacTokenType` and `TokenResponseType` (implicit response) are unsupported
placeholders whose constructors throw `ServerError('Not implemented.')`.
Only the `code` authorization response is registered.

# Model Overview

[OAuth2Server](../api/oauth2-server.md) requires a model object through which some aspects of storage, 
retrieval and custom validation are abstracted.

## Migration Notes

**Version \>=5.x:** Callback support has been removed! Each model function supports either sync or async
(`Promise` or `async function`) return values.

**Version \<=4.x:** Each model function supports *promises*, *Node-style callbacks*, *ES6 generators* 
and *async*/*await* (using [Babel](https://babeljs.io)). Note that promise support implies support for returning plain
values where asynchronism is not required.

------------------------------------------------------------------------

## Grant Types

`6749` describes a number of grants for a client application to acquire an access token.

The following grant types are supported by *oauth2-server*:

------------------------------------------------------------------------

### Authorization Code Grant

See `Section 4.1 of RFC 6749 <6749#section-4.1>`.

An authorization code is a credential representing the resource owner's authorization (to access its protected resources) which is used by the client to obtain an access token.

Model functions used by the authorization code grant:

- `Model#generateAccessToken`
- `Model#generateRefreshToken`
- `Model#generateAuthorizationCode`
- `Model#getAuthorizationCode`
- `Model#getClient`
- `Model#saveToken`
- `Model#saveAuthorizationCode`
- `Model#revokeAuthorizationCode`
- `Model#validateScope`
- `Model#validateRedirectUri`

------------------------------------------------------------------------

### Client Credentials Grant

See `Section 4.4 of RFC 6749 <6749#section-4.4>`.

The client can request an access token using only its client credentials (or other supported means of authentication) when requesting access to the protected resources under its control.

<div class="note">

<div class="title">

Note

</div>

The client credentials grant type **must** only be used by confidential clients.

</div>

Model functions used by the client credentials grant:

- `Model#generateAccessToken`
- `Model#getClient`
- `Model#getUserFromClient`
- `Model#saveToken`
- `Model#validateScope`

------------------------------------------------------------------------

### Refresh Token Grant

See `Section 6 of RFC 6749 <6749#section-6>`.

If the authorization server issued a refresh token to the client, the client can request a refresh of their authorization token.

Model functions used by the refresh token grant:

- `Model#generateRefreshToken`
- `Model#getRefreshToken`
- `Model#getClient`
- `Model#saveToken`
- `Model#revokeToken`

------------------------------------------------------------------------

### Password Grant

See `Section 4.3 of RFC 6749 <6749#section-4.3>`.

The password grant is suitable for clients capable of obtaining the resource owner's credentials (username and password, typically using an interactive form).

Model functions used by the password grant:

- `Model#generateAccessToken`
- `Model#generateRefreshToken`
- `Model#getClient`
- `Model#getUser`
- `Model#saveToken`
- `Model#validateScope`

------------------------------------------------------------------------

### Extension Grants

See `Section 4.5 of RFC 6749 <6749#section-4.5>`.

The authorization server may also implement custom grant types to issue access (and optionally refresh) tokens.

See `/misc/extension-grants`.

------------------------------------------------------------------------

## Request Authentication

See `Section 2 of RFC 6750 <6750#section-2>`.

The authorization server authenticates requests sent to the resource server by verifying the included bearer token.

Model functions used during request authentication:

- `Model#getAccessToken`
- `Model#verifyScope`

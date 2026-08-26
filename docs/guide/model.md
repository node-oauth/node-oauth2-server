# Model Overview

[OAuth2Server](../api/server.md) requires a model object through which some aspects of storage, 
retrieval and custom validation are abstracted.

## Migration Notes

**Version \>=5.x:** Callback support has been removed! Each model function supports either sync or async
(`Promise` or `async function`) return values.

**Version \<=4.x:** Each model function supports *promises*, *Node-style callbacks*, *ES6 generators* 
and *async*/*await* (using [Babel](https://babeljs.io)). Note that promise support implies support for returning plain
values where asynchronism is not required.

## Request Authentication

See [Section 2 of RFC 6750](https://www.rfc-editor.org/rfc/rfc6750#section-2)

The authorization server authenticates requests that are 
sent to the resource server by verifying the included bearer token.

Model functions used during request authentication:

- [getAccessToken](../api/model.md#modelgetaccesstokenaccesstoken--code-promiseaccesstokendata-code)
- [verifyScope](../api/model.md#modelverifyscopeaccesstoken-scope--codepromisebooleancode)


## Client Authentication

See the [client authentication guide](./client-authentication.md) for how clients authenticate at the
token endpoint (`client_secret_basic`, `client_secret_post`, public clients and JWT client assertions).

- [getClient](../api/model.md#modelgetclientclientid-clientsecret--code-promiseclientdata-code) — resolves the client. Called **without** a secret for public (`none`) and JWT clients, so only verify `clientSecret` when it is supplied.

**Optional (single-use replay protection for JWT client assertions):**
- `isClientAssertionJtiUsed` — checks whether a `jti` has been used
- `saveClientAssertionJti` — records a used `jti`

The client returned by `getClient` may also carry `tokenEndpointAuthMethod`, `secret`, `jwks` or `jwksUri`
(see [`ClientData`](../api/model.md)).


## Grant Types

For each [grant type](./grant-types.md) there are different model required, optional or unused.
The following sections describe the grant types and the model functions, required for
the grants.

### Authorization Code Grant

Model functions required by the [authorization code grant](./grant-types.md#authorization-code-grant-type):

- [getClient](../api/model.md#modelgetclientclientid-clientsecret--code-promiseclientdata-code)
- [saveToken](../api/model.md#modelsavetokentoken-client-user--codepromiseobjectcode)
- [getAuthorizationCode](../api/model.md#modelgetauthorizationcodeauthorizationcode--code-promiseauthorizationcodedata-code)
- [saveAuthorizationCode](../api/model.md#modelsaveauthorizationcodecode-client-user--codepromiseobjectcode)
- [revokeAuthorizationCode](../api/model.md#modelrevokeauthorizationcodecode--codepromisebooleancode)

Required if no custom authenticate handler used:
- [verifyScope](../api/model.md#modelverifyscopeaccesstoken-scope--codepromisebooleancode)

Required if custom authenticate handler used:
- [getAccessToken](../api/model.md#modelgetaccesstokenaccesstoken--code-promiseaccesstokendata-code)

**Optional, but recommended:**
- [generateAccessToken](../api/model.md#modelgenerateaccesstokenclient-user-scope--codepromisestringcode)
- [generateRefreshToken](../api/model.md#modelgeneraterefreshtokenclient-user-scope--codepromisestringcode)
- [generateAuthorizationCode](../api/model.md#modelgenerateauthorizationcodeclient-user-scope--codepromisestringcode)
- [validateScope](../api/model.md#modelvalidatescopeuser-client-scope--codepromisebooleancode)
- [validateRedirectUri](../api/model.md#modelvalidateredirecturiredirecturi-client--codepromisebooleancode)

### Client Credentials Grant

Model functions used by the [client credentials grant](grant-types.md#client-credentials-grant-type):

- [getClient](../api/model.md#modelgetclientclientid-clientsecret--code-promiseclientdata-code)
- [saveToken](../api/model.md#modelsavetokentoken-client-user--codepromiseobjectcode)
- [getUserFromClient](../api/model.md#modelgetuserfromclientclient--codepromiseobjectcode)

**Optional, but recommended:**
- [generateAccessToken](../api/model.md#modelgenerateaccesstokenclient-user-scope--codepromisestringcode)
- [validateScope](../api/model.md#modelvalidatescopeuser-client-scope--codepromisebooleancode)

### Refresh Token Grant

Model functions used by the [refresh token grant](grant-types.md#refresh-token-grant-type):

- [generateRefreshToken](../api/model.md#modelgeneraterefreshtokenclient-user-scope--codepromisestringcode)
- [getRefreshToken](../api/model.md#modelgetrefreshtokenrefreshtoken--code-promiserefreshtokendata-code)
- [getClient](../api/model.md#modelgetclientclientid-clientsecret--code-promiseclientdata-code)
- [saveToken](../api/model.md#modelsavetokentoken-client-user--codepromiseobjectcode)
- [revokeToken](../api/model.md#modelrevoketokentoken--codepromisebooleancode)


### Password Grant

Model functions used by the [password grant](grant-types.md#password-grant-type):

- [generateAccessToken](../api/model.md#modelgenerateaccesstokenclient-user-scope--codepromisestringcode)
- [generateRefreshToken](../api/model.md#modelgeneraterefreshtokenclient-user-scope--codepromisestringcode)
- [getClient](../api/model.md#modelgetclientclientid-clientsecret--code-promiseclientdata-code)
- [getUser](../api/model.md#modelgetuserusername-password-client--codepromiseobjectnullundefinedfalse0code)
- [saveToken](../api/model.md#modelsavetokentoken-client-user--codepromiseobjectcode)
- [validateScope](../api/model.md#modelvalidatescopeuser-client-scope--codepromisebooleancode)

### JWT Bearer Grant

Model functions used by the [JWT bearer authorization grant](grant-types.md#jwt-bearer-grant-type)
(`JwtBearerGrantType`, registered via `extendedGrantTypes`):

- [getClient](../api/model.md#modelgetclientclientid-clientsecret--code-promiseclientdata-code)
- [saveToken](../api/model.md#modelsavetokentoken-client-user--codepromiseobjectcode)
- `getJWTBearerIssuer` — resolve a trusted issuer's verification keys and expected audience
- `getJWTBearerUser` — resolve and authorize the assertion subject (and optionally enforce `jti` single-use)

### Extension Grants

The authorization server may also implement custom grant types to issue access (and optionally refresh) tokens.

See [extension grants](./grant-types.md#extension-grants)


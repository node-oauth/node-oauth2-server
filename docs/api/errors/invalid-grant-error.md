# InvalidGrantError

The provided authorization grant (e.g., authorization code, resource owner credentials) or refresh token is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client. See `Section 5.2 of RFC 6749 <6749#section-5.2>`.

    const InvalidGrantError = require('@node-oauth/oauth2-server/lib/errors/invalid-grant-error');

------------------------------------------------------------------------

## `new InvalidGrantError(message, properties)`

Instantiates an `InvalidGrantError`.

**Arguments:**

| Name                                | Type          | Description                                                 |
|-------------------------------------|---------------|-------------------------------------------------------------|
| \[message=undefined\]               | String\|Error | See `OAuthError#constructor`.                               |
| \[properties={}\]                   | Object        | See `OAuthError#constructor`.                               |
| \[properties.code=400\]             | Object        | See `OAuthError#constructor`.                               |
| \[properties.name='invalid_grant'\] | String        | The error name used in responses generated from this error. |

**Return value:**

A new instance of `InvalidGrantError`.

**Remarks:**

    const err = new InvalidGrantError();
    // err.message === 'Bad Request'
    // err.code === 400
    // err.name === 'invalid_grant'

------------------------------------------------------------------------

## `message`

See `OAuthError#message <OAuthError#message>`.

------------------------------------------------------------------------

## `code`

Typically `400`. See `OAuthError#code <OAuthError#code>`.

------------------------------------------------------------------------

## `inner`

See `OAuthError#inner <OAuthError#inner>`.

------------------------------------------------------------------------

## `name`

Typically `'invalid_grant'`. See `OAuthError#name <OAuthError#name>`.

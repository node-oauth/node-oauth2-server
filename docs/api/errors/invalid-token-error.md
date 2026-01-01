# InvalidTokenError

The access token provided is expired, revoked, malformed, or invalid for other reasons. See `Section 3.1 of RFC 6750 <6750#section-3.1>`.

    const InvalidTokenError = require('@node-oauth/oauth2-server/lib/errors/invalid-token-error');

------------------------------------------------------------------------

## `new InvalidTokenError(message, properties)`

Instantiates an `InvalidTokenError`.

**Arguments:**

| Name                                | Type          | Description                                                 |
|-------------------------------------|---------------|-------------------------------------------------------------|
| \[message=undefined\]               | String\|Error | See `OAuthError#constructor`.                               |
| \[properties={}\]                   | Object        | See `OAuthError#constructor`.                               |
| \[properties.code=401\]             | Object        | See `OAuthError#constructor`.                               |
| \[properties.name='invalid_token'\] | String        | The error name used in responses generated from this error. |

**Return value:**

A new instance of `InvalidTokenError`.

**Remarks:**

    const err = new InvalidTokenError();
    // err.message === 'Unauthorized'
    // err.code === 401
    // err.name === 'invalid_token'

------------------------------------------------------------------------

## `message`

See `OAuthError#message <OAuthError#message>`.

------------------------------------------------------------------------

## `code`

Typically `401`. See `OAuthError#code <OAuthError#code>`.

------------------------------------------------------------------------

## `inner`

See `OAuthError#inner <OAuthError#inner>`.

------------------------------------------------------------------------

## `name`

Typically `'invalid_token'`. See `OAuthError#name <OAuthError#name>`.

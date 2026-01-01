# InvalidClientError

Client authentication failed (e.g., unknown client, no client authentication included, or unsupported authentication method). See `Section 5.2 of RFC 6749 <6749#section-5.2>`.

    const InvalidClientError = require('@node-oauth/oauth2-server/lib/errors/invalid-client-error');

------------------------------------------------------------------------

## `new InvalidClientError(message, properties)`

Instantiates an `InvalidClientError`.

**Arguments:**

| Name                                 | Type          | Description                                                 |
|--------------------------------------|---------------|-------------------------------------------------------------|
| \[message=undefined\]                | String\|Error | See `OAuthError#constructor`.                               |
| \[properties={}\]                    | Object        | See `OAuthError#constructor`.                               |
| \[properties.code=400\]              | Object        | See `OAuthError#constructor`.                               |
| \[properties.name='invalid_client'\] | String        | The error name used in responses generated from this error. |

**Return value:**

A new instance of `InvalidClientError`.

**Remarks:**

    const err = new InvalidClientError();
    // err.message === 'Bad Request'
    // err.code === 400
    // err.name === 'invalid_client'

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

Typically `'invalid_client'`. See `OAuthError#name <OAuthError#name>`.

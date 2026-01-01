# ServerError

The authorization server encountered an unexpected condition that prevented it from fulfilling the request. See `Section 4.1.2.1 of RFC 6749 <6749#section-4.1.2.1>`.

    const ServerError = require('@node-oauth/oauth2-server/lib/errors/server-error');

`ServerError` is used to wrap unknown exceptions encountered during request processing.

------------------------------------------------------------------------

## `new ServerError(message, properties)`

Instantiates an `ServerError`.

**Arguments:**

| Name                               | Type          | Description                                                 |
|------------------------------------|---------------|-------------------------------------------------------------|
| \[message=undefined\]              | String\|Error | See `OAuthError#constructor`.                               |
| \[properties={}\]                  | Object        | See `OAuthError#constructor`.                               |
| \[properties.code=503\]            | Object        | See `OAuthError#constructor`.                               |
| \[properties.name='server_error'\] | String        | The error name used in responses generated from this error. |

**Return value:**

A new instance of `ServerError`.

**Remarks:**

    const err = new ServerError();
    // err.message === 'Service Unavailable Error'
    // err.code === 503
    // err.name === 'server_error'

------------------------------------------------------------------------

## `message`

See `OAuthError#message <OAuthError#message>`.

------------------------------------------------------------------------

## `code`

Typically `503`. See `OAuthError#code <OAuthError#code>`.

------------------------------------------------------------------------

## `inner`

See `OAuthError#inner <OAuthError#inner>`.

------------------------------------------------------------------------

## `name`

Typically `'server_error'`. See `OAuthError#name <OAuthError#name>`.

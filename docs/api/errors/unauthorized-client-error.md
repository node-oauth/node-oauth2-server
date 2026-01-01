# UnauthorizedClientError

The authenticated client is not authorized to use this authorization grant type. See `Section 4.1.2.1 of RFC 6749 <6749#section-4.1.2.1>`.

    const UnauthorizedClientError = require('@node-oauth/oauth2-server/lib/errors/unauthorized-client-error');

------------------------------------------------------------------------

## `new UnauthorizedClientError(message, properties)`

Instantiates an `UnauthorizedClientError`.

**Arguments:**

| Name                                      | Type          | Description                                                 |
|-------------------------------------------|---------------|-------------------------------------------------------------|
| \[message=undefined\]                     | String\|Error | See `OAuthError#constructor`.                               |
| \[properties={}\]                         | Object        | See `OAuthError#constructor`.                               |
| \[properties.code=400\]                   | Object        | See `OAuthError#constructor`.                               |
| \[properties.name='unauthorized_client'\] | String        | The error name used in responses generated from this error. |

**Return value:**

A new instance of `UnauthorizedClientError`.

**Remarks:**

    const err = new UnauthorizedClientError();
    // err.message === 'Bad Request'
    // err.code === 400
    // err.name === 'unauthorized_client'

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

Typically `'unauthorized_client'`. See `OAuthError#name <OAuthError#name>`.

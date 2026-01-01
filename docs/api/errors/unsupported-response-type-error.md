# UnsupportedResponseTypeError

The authorization server does not supported obtaining an authorization code using this method. See `Section 4.1.2.1 of RFC 6749 <6749#section-4.1.2.1>`.

    const UnsupportedResponseTypeError = require('@node-oauth/oauth2-server/lib/errors/unsupported-response-type-error');

------------------------------------------------------------------------

## `new UnsupportedResponseTypeError(message, properties)`

Instantiates an `UnsupportedResponseTypeError`.

**Arguments:**

| Name                                            | Type          | Description                                                 |
|-------------------------------------------------|---------------|-------------------------------------------------------------|
| \[message=undefined\]                           | String\|Error | See `OAuthError#constructor`.                               |
| \[properties={}\]                               | Object        | See `OAuthError#constructor`.                               |
| \[properties.code=400\]                         | Object        | See `OAuthError#constructor`.                               |
| \[properties.name='unsupported_response_type'\] | String        | The error name used in responses generated from this error. |

**Return value:**

A new instance of `UnsupportedResponseTypeError`.

**Remarks:**

    const err = new UnsupportedResponseTypeError();
    // err.message === 'Bad Request'
    // err.code === 400
    // err.name === 'unsupported_response_type'

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

Typically `'unsupported_response_type'`. See `OAuthError#name <OAuthError#name>`.

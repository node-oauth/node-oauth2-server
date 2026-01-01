# UnsupportedGrantTypeError

The authorization grant type is not supported by the authorization server. See `Section 4.1.2.1 of RFC 6749 <6749#section-4.1.2.1>`.

    const UnsupportedGrantTypeError = require('@node-oauth/oauth2-server/lib/errors/unsupported-grant-type-error');

------------------------------------------------------------------------

## `new UnsupportedGrantTypeError(message, properties)`

Instantiates an `UnsupportedGrantTypeError`.

**Arguments:**

| Name                                         | Type          | Description                                                 |
|----------------------------------------------|---------------|-------------------------------------------------------------|
| \[message=undefined\]                        | String\|Error | See `OAuthError#constructor`.                               |
| \[properties={}\]                            | Object        | See `OAuthError#constructor`.                               |
| \[properties.code=400\]                      | Object        | See `OAuthError#constructor`.                               |
| \[properties.name='unsupported_grant_type'\] | String        | The error name used in responses generated from this error. |

**Return value:**

A new instance of `UnsupportedGrantTypeError`.

**Remarks:**

    const err = new UnsupportedGrantTypeError();
    // err.message === 'Bad Request'
    // err.code === 400
    // err.name === 'unsupported_grant_type'

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

Typically `'unsupported_grant_type'`. See `OAuthError#name <OAuthError#name>`.

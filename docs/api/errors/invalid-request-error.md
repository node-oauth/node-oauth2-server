# InvalidRequestError

The request is missing a required parameter, includes an invalid parameter value, includes a parameter more than once, or is otherwise malformed. See `Section 4.2.2.1 of RFC 6749 <6749#section-4.2.2.1>`.

    const InvalidRequestError = require('@node-oauth/oauth2-server/lib/errors/invalid-request-error');

------------------------------------------------------------------------

## `new InvalidRequestError(message, properties)`

Instantiates an `InvalidRequestError`.

**Arguments:**

| Name                                  | Type          | Description                                                 |
|---------------------------------------|---------------|-------------------------------------------------------------|
| \[message=undefined\]                 | String\|Error | See `OAuthError#constructor`.                               |
| \[properties={}\]                     | Object        | See `OAuthError#constructor`.                               |
| \[properties.code=400\]               | Object        | See `OAuthError#constructor`.                               |
| \[properties.name='invalid_request'\] | String        | The error name used in responses generated from this error. |

**Return value:**

A new instance of `InvalidRequestError`.

**Remarks:**

    const err = new InvalidRequestError();
    // err.message === 'Bad Request'
    // err.code === 400
    // err.name === 'invalid_request'

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

Typically `'invalid_request'`. See `OAuthError#name <OAuthError#name>`.

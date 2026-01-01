# AccessDeniedError

The resource owner or authorization server denied the request. See `Section 4.1.2.1 of RFC 6749 <6749#section-4.1.2.1>`.

    const AccessDeniedError = require('@node-oauth/oauth2-server/lib/errors/access-denied-error');

------------------------------------------------------------------------

## `new AccessDeniedError(message, properties)`

Instantiates an `AccessDeniedError`.

**Arguments:**

| Name                                | Type          | Description                                                 |
|-------------------------------------|---------------|-------------------------------------------------------------|
| \[message=undefined\]               | String\|Error | See `OAuthError#constructor`.                               |
| \[properties={}\]                   | Object        | See `OAuthError#constructor`.                               |
| \[properties.code=400\]             | Object        | See `OAuthError#constructor`.                               |
| \[properties.name='access_denied'\] | String        | The error name used in responses generated from this error. |

**Return value:**

A new instance of `AccessDeniedError`.

**Remarks:**

    const err = new AccessDeniedError();
    // err.message === 'Bad Request'
    // err.code === 400
    // err.name === 'access_denied'

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

Typically `'access_denied'`. See `OAuthError#name <OAuthError#name>`.

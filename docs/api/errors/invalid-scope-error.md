# InvalidScopeError

The requested scope is invalid, unknown, or malformed. See `Section 4.1.2.1 of RFC 6749 <6749#section-4.1.2.1>`.

    const InvalidScopeError = require('@node-oauth/oauth2-server/lib/errors/invalid-scope-error');

------------------------------------------------------------------------

## `new InvalidScopeError(message, properties)`

Instantiates an `InvalidScopeError`.

**Arguments:**

| Name                                | Type          | Description                                                 |
|-------------------------------------|---------------|-------------------------------------------------------------|
| \[message=undefined\]               | String\|Error | See `OAuthError#constructor`.                               |
| \[properties={}\]                   | Object        | See `OAuthError#constructor`.                               |
| \[properties.code=400\]             | Object        | See `OAuthError#constructor`.                               |
| \[properties.name='invalid_scope'\] | String        | The error name used in responses generated from this error. |

**Return value:**

A new instance of `InvalidScopeError`.

**Remarks:**

    const err = new InvalidScopeError();
    // err.message === 'Bad Request'
    // err.code === 400
    // err.name === 'invalid_scope'

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

Typically `'invalid_scope'`. See `OAuthError#name <OAuthError#name>`.

# InsufficientScopeError

The request requires higher privileges than provided by the access token. See `Section 3.1 of RFC 6750 <6750#section-3.1>`.

    const InsufficientScopeError = require('@node-oauth/oauth2-server/lib/errors/insufficient-scope-error');

------------------------------------------------------------------------

## `new InsufficientScopeError(message, properties)`

Instantiates an `InsufficientScopeError`.

**Arguments:**

| Name                                     | Type          | Description                                                 |
|------------------------------------------|---------------|-------------------------------------------------------------|
| \[message=undefined\]                    | String\|Error | See `OAuthError#constructor`.                               |
| \[properties={}\]                        | Object        | See `OAuthError#constructor`.                               |
| \[properties.code=403\]                  | Object        | See `OAuthError#constructor`.                               |
| \[properties.name='insufficient_scope'\] | String        | The error name used in responses generated from this error. |

**Return value:**

A new instance of `InsufficientScopeError`.

**Remarks:**

    const err = new InsufficientScopeError();
    // err.message === 'Forbidden'
    // err.code === 403
    // err.name === 'insufficient_scope'

------------------------------------------------------------------------

## `message`

See `OAuthError#message <OAuthError#message>`.

------------------------------------------------------------------------

## `code`

Typically `403`. See `OAuthError#code <OAuthError#code>`.

------------------------------------------------------------------------

## `inner`

See `OAuthError#inner <OAuthError#inner>`.

------------------------------------------------------------------------

## `name`

Typically `'insufficient_scope'`. See `OAuthError#name <OAuthError#name>`.

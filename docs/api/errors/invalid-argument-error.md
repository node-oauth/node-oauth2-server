# InvalidArgumentError

An invalid argument was encountered.

    const InvalidArgumentError = require('@node-oauth/oauth2-server/lib/errors/invalid-argument-error');

<div class="note">

<div class="title">

Note

</div>

This error indicates that the module is used incorrectly (i.e., there is a programming error) and should never be seen because of external errors (like invalid data sent by a client).

</div>

------------------------------------------------------------------------

## `new InvalidArgumentError(message, properties)`

Instantiates an `InvalidArgumentError`.

**Arguments:**

| Name                                   | Type          | Description                                                 |
|----------------------------------------|---------------|-------------------------------------------------------------|
| \[message=undefined\]                  | String\|Error | See `OAuthError#constructor`.                               |
| \[properties={}\]                      | Object        | See `OAuthError#constructor`.                               |
| \[properties.code=500\]                | Object        | See `OAuthError#constructor`.                               |
| \[properties.name='invalid_argument'\] | String        | The error name used in responses generated from this error. |

**Return value:**

A new instance of `InvalidArgumentError`.

**Remarks:**

    const err = new InvalidArgumentError();
    // err.message === 'Internal Server Error'
    // err.code === 500
    // err.name === 'invalid_argument'

------------------------------------------------------------------------

## `message`

See `OAuthError#message <OAuthError#message>`.

------------------------------------------------------------------------

## `code`

Typically `500`. See `OAuthError#code <OAuthError#code>`.

------------------------------------------------------------------------

## `inner`

See `OAuthError#inner <OAuthError#inner>`.

------------------------------------------------------------------------

## `name`

Typically `'invalid_argument'`. See `OAuthError#name <OAuthError#name>`.

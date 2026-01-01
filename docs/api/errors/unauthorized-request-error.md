# UnauthorizedRequestError

The request lacked any authentication information or the client attempted to use an unsupported authentication method.

    const UnauthorizedRequestError = require('@node-oauth/oauth2-server/lib/errors/unauthorized-request-error');

According to `Section 3.1 of RFC 6750 <6750#section-3.1>` you should just fail the request with `401 Unauthorized` and not send any error information in the body if this error occurs:

> If the request lacks any authentication information (e.g., the client
> was unaware that authentication is necessary or attempted using an
> unsupported authentication method), the resource server SHOULD NOT
> include an error code or other error information.

------------------------------------------------------------------------

## `new UnauthorizedRequestError(message, properties)`

Instantiates an `UnauthorizedRequestError`.

**Arguments:**

| Name                                       | Type          | Description                                                 |
|--------------------------------------------|---------------|-------------------------------------------------------------|
| \[message=undefined\]                      | String\|Error | See `OAuthError#constructor`.                               |
| \[properties={}\]                          | Object        | See `OAuthError#constructor`.                               |
| \[properties.code=401\]                    | Object        | See `OAuthError#constructor`.                               |
| \[properties.name='unauthorized_request'\] | String        | The error name used in responses generated from this error. |

**Return value:**

A new instance of `UnauthorizedRequestError`.

**Remarks:**

    const err = new UnauthorizedRequestError();
    // err.message === 'Unauthorized'
    // err.code === 401
    // err.name === 'unauthorized_request'

------------------------------------------------------------------------

## `message`

See `OAuthError#message <OAuthError#message>`.

------------------------------------------------------------------------

## `code`

Typically `401`. See `OAuthError#code <OAuthError#code>`.

------------------------------------------------------------------------

## `inner`

See `OAuthError#inner <OAuthError#inner>`.

------------------------------------------------------------------------

## `name`

Typically `'unauthorized_request'`. See `OAuthError#name <OAuthError#name>`.

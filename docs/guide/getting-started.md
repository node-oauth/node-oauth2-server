# Getting started with @node-oauth/oauth2-server

## Preface
This library implements the OAuth 2.0 standard but leaves
room to custom implementation details where the standard
is either vague or explicitly states, if a detail is up to the implementation.

Therefore, getting familiar with the several RFCs is fundamental for
understanding the standard and for a correct implementation.

We highly encourage you to read the following
resources, before starting to operate your own authorization server:

- [RFC 6749 - The OAuth 2.0 Authorization Framework](https://www.rfc-editor.org/rfc/rfc6749)
- [RFC 6750 - Bearer Tokens](https://www.rfc-editor.org/rfc/rfc6750)
- [RFC 6819 - Threat Model and Security Considerations](https://www.rfc-editor.org/rfc/rfc6819)
- [RFC 7009 - Token Revocation](https://www.rfc-editor.org/rfc/rfc7009)
- [RFC 7636 - Proof Key for Code Exchange (PKCE)](https://www.rfc-editor.org/rfc/rfc7636)
- [RFC 9700 - Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700)
- [OWASP OAuth2 cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html)

## Features

- Supports `authorization code`, `client credentials`,
  `refresh token` and `password` (deprecated) grant, as well as
  `extension grants`, with scopes.
- Model hooks support synchronous values, native Promises and async/await.
- Implements OAuth 2.0 flows with [integration responsibilities](./compliance.md).
- Implicitly supports any form of storage, e.g. *PostgreSQL*, *MySQL*, *MongoDB*, *Redis*, etc.
- Complete [test suite](https://github.com/node-oauth/node-oauth2-server/tree/master/test).

## Installation

This module is developed for Node.js and you can install this package using
npm via

```shell
npm install --save @node-oauth/oauth2-server
```

Please note, that we still provide this library in "classic" commonjs
format with a pretty low node version requirement for maximum backwards
compatibility.
[A future esm release is planned.](https://github.com/node-oauth/node-oauth2-server/discussions/279)
We also highly encourage you to use supported/maintained Node.js versions.

## Usage

The *@node-oauth/oauth2-server* module is framework-agnostic but there are several officially supported adapters
available for popular HTTP server frameworks such
as [Express](https://www.npmjs.com/package/@node-oauth/express-oauth-server)
and [Koa](https://npmjs.org/package/koa-oauth-server). If you're using one of those frameworks it is strongly
recommended to use the respective adapter module instead of rolling your own.

Consider the following minimal example, which you can use as a foundation for
further development:

```js
const OAuth2Server = require('@node-oauth/oauth2-server');
const Request = OAuth2Server.Request;
const Response = OAuth2Server.Response;
const model = require('./model');
const oauth = new OAuth2Server({model});

let request = new Request({
    method: 'GET',
    query: {},
    headers: {Authorization: 'Bearer foobar'}
});

let response = new Response({
    headers: {}
});

oauth.authenticate(request, response)
    .then((token) => {
        // The request was successfully authenticated.
    })
    .catch((err) => {
        // The request failed authentication.
    });
```

### Sending the response

The library does not send HTTP responses. Copy the wrapper's headers to your
framework response and handle each endpoint's contract:

- `authorize` prepares a 302 redirect on success and on errors inside its
  redirect-capable block, then rejects on error. Forward a prepared redirect even
  after rejection. Earlier client/user failures may leave no redirect.
- `token` populates the token JSON on success and error JSON for failures inside
  its catch block. Method/content-type checks occur before that block and can
  leave the default 200/empty body. Success sets cache-control headers; error
  handling does not set them.
- `authenticate` returns the token and sets selected scope or challenge headers.
  It does not set an error status/body. On success, continue to your protected
  resource; on rejection, your integration must select the error response.

The following Express example assumes `app`, `oauth`, `Request`, and
`Response` from the setup above, plus login middleware that populates
`req.session.user` before this route. Complete login before calling authorization.

```js
const authenticateHandler = {
    handle(request) {
        return request.session.user;
    }
};

// Use fixed public messages, never arbitrary exception text.
function sendLocalError(res, err, response) {
    const publicErrors = {
        invalid_client: [400, 'Invalid client'],
        invalid_request: [400, 'Invalid request'],
        invalid_grant: [400, 'Invalid grant'],
        unauthorized_client: [400, 'Unauthorized client'],
        unsupported_grant_type: [400, 'Unsupported grant type'],
        invalid_scope: [400, 'Invalid scope'],
        invalid_token: [401, 'Invalid token'],
        unauthorized_request: [401, 'Authentication required'],
        insufficient_scope: [403, 'Insufficient scope'],
        access_denied: [400, 'Access denied']
    };
    const known = err instanceof OAuth2Server.OAuthError && publicErrors[err.name];
    const [status, description] = known || [500, 'Internal server error'];
    res.set(response.headers);
    return res.status(known && err.code === 401 ? 401 : status).json({
        error: known ? err.name : 'server_error',
        error_description: description
    });
}

app.get('/authorize', async (req, res) => {
    const request = new Request(req);
    const response = new Response();

    try {
        await oauth.authorize(request, response, { authenticateHandler });
    } catch (err) {
        if (response.status !== 302 || !response.get('location')) {
            return sendLocalError(res, err, response);
        }
    }

    // Includes denial redirects (allowed=false) and their state parameter.
    res.set(response.headers);
    return res.status(response.status).end();
});
```

For a token route, await `oauth.token(request, response)` in a try/catch.
On success send `res.set(response.headers).status(response.status).json(response.body)`.
On rejection use a local handler such as `sendLocalError`; do not send the
wrapper's default 200. Your integration can add token endpoint cache headers to
both success and error responses. For authentication failures, also copy the
wrapper's challenge headers before sending the selected local error response.

> **Do not reassign your framework's `req`/`res`** to the library's objects
> (e.g. `res = new Response(res)`). Doing so discards framework methods such as
> `res.redirect()`, and is a common cause of a request appearing to "hang".

If you use Express or Koa, prefer the official adapters
([express-oauth-server](https://www.npmjs.com/package/@node-oauth/express-oauth-server),
[koa-oauth-server](https://npmjs.org/package/koa-oauth-server)), which take care of
all of this for you.

The most crucial part in this setup is the `model`.
It acts as the bridge between the OAuth2 server library and your system.

> As a rule of thumb, the library handles the overall OAuth2 workflows,
while you can leverage the `model` to implement storage locations (In-Memory,
DB, Caching) and client management.

Note, that different workflows require different models.
Read the [model overview](./model.md) of what is required for the model in context of specific grant types.

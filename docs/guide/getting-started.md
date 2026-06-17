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
- Can be used with *promises*, *ES6 generators* and *async*/*await*.
- Fully `6749` and `6750` compliant.
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

This library is **framework-agnostic and does not send the HTTP response for you**.
`authenticate()`, `authorize()` and `token()` resolve with their result *and*
populate the `Response` object you passed in — setting `response.status`,
`response.headers` and `response.body`. It is up to you to copy those onto your
framework's real response and send it. For `authorize()` this is how the redirect
happens: the `location` header is set on the `Response`, but you still have to
issue it.

A minimal Express example for the authorization endpoint:

```js
app.get('/authorize', async (req, res) => {
    // Wrap the framework objects in NEW variables — see the warning below.
    const request = new Request(req);
    const response = new Response(res);

    try {
        await oauth.authorize(request, response, { authenticateHandler });
    } catch (err) {
        return res.status(err.code || 500).json({ error: err.name, error_description: err.message });
    }

    // The library populated `response`; now you send it. For authorize that is a redirect:
    res.set(response.headers);                // includes the `location` header
    return res.status(response.status).end(); // 302 -> the browser follows `location`
});
```

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

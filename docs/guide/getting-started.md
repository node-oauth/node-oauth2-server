# Getting started with @node-oauth/oauth2-server

OAuth2 is a well-defined authorization protocol.
Getting familiar with the several RFCs is crucial for
understanding the standard and for correct implementation.
Therefore, we highly encourage you to read the following
resources, before starting to operate your own authorization server:

- [RFC 6749 - The OAuth 2.0 Authorization Framework](https://www.rfc-editor.org/rfc/rfc6749)
- [RFC 6750 - Bearer Tokens](https://www.rfc-editor.org/rfc/rfc6750)
- [RFC 6819 - Threat Model and Security Considerations](https://www.rfc-editor.org/rfc/rfc6819)
- [RFC 7009 - Token Revocation](https://www.rfc-editor.org/rfc/rfc7009)
- [RFC 7636 - Proof Key for Code Exchange (PKCE)](https://www.rfc-editor.org/rfc/rfc7636)
- [OWASP OAuth2 cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html)

## Features

- Supports `authorization code <AuthorizationCodeGrant>`, `client credentials <ClientCredentialsGrant>`, `refresh token <RefreshTokenGrant>` and `password <PasswordGrant>` grant, as well as `extension grants <ExtensionGrants>`, with scopes.
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

The *@node-oauth/oauth2-server* module is framework-agnostic but there are several officially supported adapters available for popular HTTP server frameworks such as [Express](https://www.npmjs.com/package/@node-oauth/express-oauth-server) and [Koa](https://npmjs.org/package/koa-oauth-server). If you're using one of those frameworks it is strongly recommended to use the respective adapter module instead of rolling your own.



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

The crucial part in this setup is the `model`, which acts as the bridge
between the OAuth2 server library and your system.

As a rule of thumb, the library handles the overall OAuth2 workflows,
while you can leverage the `model` to implement storage locations (In-Memory,
DB, Caching) and client management.

Note, that different workflows require different models.
See the [model specs](./model/spec.md) of what is required from the model passed to the
[oauth2-server instance](./api/oauth2-server.md).

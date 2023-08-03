=================
 Getting Started
=================

.. _installation:

Installation
============

oauth2-server_ is available via npm_.

.. _oauth2-server: https://www.npmjs.com/package/@node-oauth/oauth2-server
.. _npm: https://npmjs.org

.. code-block:: sh

  $ npm install oauth2-server

.. note:: The *oauth2-server* module is framework-agnostic but there are several officially supported adapters available for popular HTTP server frameworks such as Express_ and Koa_ (maintainer wanted!). If you're using one of those frameworks it is strongly recommended to use the respective adapter module instead of rolling your own.

.. _Express: https://www.npmjs.com/package/@node-oauth/express-oauth-server
.. _Koa: https://npmjs.org/package/koa-oauth-server


.. _features:

Features
========

- Supports :ref:`authorization code <AuthorizationCodeGrant>`, :ref:`client credentials <ClientCredentialsGrant>`, :ref:`refresh token <RefreshTokenGrant>` and :ref:`password <PasswordGrant>` grant, as well as :ref:`extension grants <ExtensionGrants>`, with scopes.
- Can be used with *promises*, *Node-style callbacks*, *ES6 generators* and *async*/*await* (using Babel_).
- From version 5.0.0 fully native async/await implemented
- Fully :rfc:`6749` and :rfc:`6750` compliant.
- Supports PKCE (:rfc:`7636`)
- Implicitly supports any form of storage, e.g. *PostgreSQL*, *MySQL*, *MongoDB*, *Redis*, etc.
- Complete `test suite`_.

.. _Babel: https://babeljs.io
.. _test suite: https://github.com/node-oauth/node-oauth2-server/tree/master/test


.. _quick-start:

Quick Start
===========

:doc:`/api/oauth2-server`

::

  const OAuth2Server = require('@node-oauth/oauth2-server');

  const oauth = new OAuth2Server({
    model: require('./model')
  });

:doc:`/api/request` and :doc:`/api/response`

::

  const Request = OAuth2Server.Request;
  const Response = OAuth2Server.Response;

  let request = new Request({/*...*/});
  let response = new Response({/*...*/});

:ref:`OAuth2Server#authenticate() <OAuth2Server#authenticate>`

::

  oauth.authenticate(request, response)
    .then((token) => {
      // The request was successfully authenticated.
    })
    .catch((err) => {
      // The request failed authentication.
    });

:ref:`OAuth2Server#authorize() <OAuth2Server#authorize>`

::

  const AccessDeniedError = require('@node-oauth/oauth2-server/lib/errors/access-denied-error');

  oauth.authorize(request, response)
    .then((code) => {
      // The resource owner granted the access request.
    })
    .catch((err) => {
      if (err instanceof AccessDeniedError) {
        // The resource owner denied the access request.
      } else {
        // Access was not granted due to some other error condition.
      }
    });

:ref:`OAuth2Server#token() <OAuth2Server#token>`

::

  oauth.token(request, response)
    .then((token) => {
      // The resource owner granted the access request.
    })
    .catch((err) => {
      // The request was invalid or not authorized.
    });


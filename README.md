
# @node-oauth/oauth2-server

Complete, compliant and well tested module for implementing an OAuth2 server in [Node.js](https://nodejs.org).

[![Tests](https://github.com/node-oauth/node-oauth2-server/actions/workflows/tests.yml/badge.svg)](https://github.com/node-oauth/node-oauth2-server/actions/workflows/tests.yml)
[![CodeQL Semantic Analysis](https://github.com/node-oauth/node-oauth2-server/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/node-oauth/node-oauth2-server/actions/workflows/codeql-analysis.yml)
[![Tests for Release](https://github.com/node-oauth/node-oauth2-server/actions/workflows/tests-release.yml/badge.svg)](https://github.com/node-oauth/node-oauth2-server/actions/workflows/tests-release.yml)
[![Documentation Status](https://readthedocs.org/projects/node-oauthoauth2-server/badge/?version=latest)](https://node-oauthoauth2-server.readthedocs.io/en/latest/?badge=latest)
[![Project Status: Active – The project has reached a stable, usable state and is being actively developed.](https://www.repostatus.org/badges/latest/active.svg)](https://www.repostatus.org/#active)
![npm Version](https://img.shields.io/npm/v/@node-oauth/oauth2-server?label=version)
![npm Downloads/Week](https://img.shields.io/npm/dw/@node-oauth/oauth2-server)
![GitHub License](https://img.shields.io/github/license/node-oauth/node-oauth2-server)

NOTE: This project has been forked from [oauthjs/node-oauth2-server](https://github.com/oauthjs/node-oauth2-server) and is a continuation due to the project appearing to be abandoned. Please see [our issue board](https://github.com/node-oauth/node-oauth2-server/issues) to talk about next steps and the future of this project.

## Installation

```bash
npm install @node-oauth/oauth2-server
```

The `@node-oauth/oauth2-server` module is framework-agnostic but there are several officially supported wrappers available for popular HTTP server frameworks such as [Express](https://www.npmjs.com/package/@node-oauth/express-oauth-server) and [Koa (not maintained by us)](https://npmjs.org/package/koa-oauth-server).
If you're using one of those frameworks it is strongly recommended to use the respective wrapper module instead of rolling your own.


## Features

- Supports `authorization_code`, `client_credentials`, `refresh_token` and `password` grant, as well as *extension grants*, with scopes.
- Can be used with *promises*, *Node-style callbacks*, *ES6 generators* and *async*/*await* (using [Babel](https://babeljs.io)).
- Fully [RFC 6749](https://tools.ietf.org/html/rfc6749.html) and [RFC 6750](https://tools.ietf.org/html/rfc6750.html) compliant.
- Implicitly supports any form of storage, e.g. *PostgreSQL*, *MySQL*, *MongoDB*, *Redis*, etc.
- Support for PKCE
- Complete [test suite](https://github.com/node-oauth/node-oauth2-server/tree/master/test).

## Documentation

[Documentation](https://node-oauthoauth2-server.readthedocs.io/en/latest/) is hosted on Read the Docs.
Please leave an issue if something is confusing or missing in the docs.

## Examples

Most users should refer to our [Express (active)](https://github.com/node-oauth/express-oauth-server) or 
[Koa (not maintained by us)](https://github.com/oauthjs/koa-oauth-server/tree/master/examples) examples.

More examples can be found here: https://github.com/14gasher/oauth-example

## Version 5 notes

Beginning with version `5.x` we removed dual support for callbacks and promises.
With this version there is only support for Promises / async/await.

With this version we also bumped the `engine` to Node 16 as 14 is now deprecated.

## Migrating from OAuthJs and 3.x

Version 4.x should not be hard-breaking, however, there were many improvements and fixes that may
be incompatible with specific behaviour in <= 3.x

For more info, please read the [changelog](./CHANGELOG.md) or open an issue, if you think something
is unexpectedly not working.

## Supported NodeJs versions

This project supports the node versions along the
[NodeJS LTS releases](https://nodejs.org/en/about/releases/), focusing on

- Maintenance LTS
- Active LTS
- Current

## Contributing to this project

Please read our [contribution guide](./CONTRIBUTING.md) before taking actions.
In any case, please open an issue before opening a pull request to find out whether your intended contribution will actually have a chance to be merged.

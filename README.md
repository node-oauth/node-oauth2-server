# @node-oauth/oauth2-server

[![Project Status: Active – The project has reached a stable, usable state and is being actively developed.](https://www.repostatus.org/badges/latest/active.svg)](https://www.repostatus.org/#active)
[![npm Version](https://img.shields.io/npm/v/@node-oauth/oauth2-server?label=version)](https://www.npmjs.com/package/@node-oauth/oauth2-server)
[![npm Downloads/Week](https://img.shields.io/npm/dw/@node-oauth/oauth2-server)](https://www.npmjs.com/package/@node-oauth/oauth2-server)
[![GitHub License](https://img.shields.io/github/license/node-oauth/node-oauth2-server)](https://github.com/node-oauth/node-oauth2-server/blob/master/LICENSE)
[![Tests](https://github.com/node-oauth/node-oauth2-server/actions/workflows/tests.yml/badge.svg)](https://github.com/node-oauth/node-oauth2-server/actions/workflows/tests.yml)
[![Formatted with Biome](https://img.shields.io/badge/Formatted_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev/)
[![CodeQL Semantic Analysis](https://github.com/node-oauth/node-oauth2-server/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/node-oauth/node-oauth2-server/actions/workflows/codeql-analysis.yml)
[![Deploy VitePress site to Pages](https://github.com/node-oauth/node-oauth2-server/actions/workflows/deploy_docs.yml/badge.svg)](https://github.com/node-oauth/node-oauth2-server/actions/workflows/deploy_docs.yml)

Complete, compliant and well tested module for implementing an OAuth2 server in [Node.js](https://nodejs.org).
This project is a continuation of the
abandoned [oauthjs/node-oauth2-server](https://github.com/oauthjs/node-oauth2-server).

> [!NOTE]
> 🛡️ If you intend to submit a security issue or vulnerability, please read
> our [security policy](https://github.com/node-oauth/node-oauth2-server/security/policy) first.

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Features](#features)
- [Installation and Usage](#installation-and-usage)
  - [Express and Koa users](#express-and-koa-users)
  - [Installation](#installation)
  - [Usage Guide](#usage-guide)
  - [Examples](#examples)
- [Migration Notes](#migration-notes)
  - [Version 5 notes](#version-5-notes)
  - [Migrating from oauthjs/node-oauth2-server and 3.x](#migrating-from-oauthjsnode-oauth2-server-and-3x)
  - [Supported NodeJs versions](#supported-nodejs-versions)
- [Contributing to this project](#contributing-to-this-project)
  - [Reporting Security Vulnerabilities](#reporting-security-vulnerabilities)
  - [Development, Issues, and Pull Requests](#development-issues-and-pull-requests)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Features

- Supports `authorization_code`, `client_credentials`, `refresh_token` and `password` grant, as well as *extension
  grants*, with scopes.
- Can be used with *promises*, *ES6 generators* and *async*/*await*.
- Fully [RFC 6749](https://tools.ietf.org/html/rfc6749.html) and [RFC 6750](https://tools.ietf.org/html/rfc6750.html)
  compliant.
- Storage agnostic: implicitly supports any form of storage, e.g. *PostgreSQL*, *MySQL*, *MongoDB*, *Redis*, etc.
- Support for [PKCE](https://node-oauth.github.io/node-oauth2-server/guide/pkce.html).
- Complete [test suite](https://github.com/node-oauth/node-oauth2-server/tree/master/test).

## Installation and Usage

### Express and Koa users

The `@node-oauth/oauth2-server` module is framework-agnostic.
Most users should refer to our [Express (active, maintained by us)](https://github.com/node-oauth/express-oauth-server)
or
[Koa (not maintained by us)](https://github.com/oauthjs/koa-oauth-server/tree/master/examples) adapters.
These are specifically provided to integrate with the library.

> [!TIP]
> If you're using one of those frameworks it is strongly recommended to use the respective wrapper module instead of
> rolling your own.

### Installation

The base installation is intended for users, who want to fully customize the integration
of this library into their stack.

```bash
npm install @node-oauth/oauth2-server
```

### Usage Guide

Documentation is hosted on GitHub docs: https://node-oauth.github.io/node-oauth2-server/

Please leave an issue if something is confusing or missing in the docs.

### Examples

More examples can be found in our examples repository: https://github.com/node-oauth/node-oauth2-server-examples

## Migration Notes

### Version 5 notes

Beginning with version `5.x` we removed dual support for callbacks and promises.
With this version there is only support for Promises / async/await.

With this version we also bumped the `engine` to Node 16 as 14 is now deprecated.

### Migrating from [oauthjs/node-oauth2-server](https://github.com/oauthjs/node-oauth2-server) and 3.x

Version 4.x should not be hard-breaking, however, there were many improvements and fixes that may
be incompatible with specific behaviour in <= 3.x

### Supported NodeJs versions

We aim to be backwards-compatible as possible in terms of the supported Node versions.
If our Node version is way below the current LTS or supported Node then it is not a sign of deprecation but a result of
this backwards compatibility.
By doing so, we intend to provide a stable OAuth2 server to legacy systems with the same set of features as modern
systems receive.

## Contributing to this project

### Reporting Security Vulnerabilities

If you intend to submit a security issue or vulnerability, please read
our [security policy](https://github.com/node-oauth/node-oauth2-server/security/policy) first.

The policy is also locally available in [SECURITY.md](./SECURITY.md).

### Development, Issues, and Pull Requests
Please read our [contribution guide](./CONTRIBUTING.md) before taking actions.
In any case, please open an issue before opening a pull request to find out whether your intended contribution will
actually have a chance to be merged.

## License

This library is MIT licenses, see the [LICENSE file](./LICENSE).

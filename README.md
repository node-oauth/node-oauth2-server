# @node-oauth/oauth2-server

[![Project Status: Active – The project has reached a stable, usable state and is being actively developed.](https://www.repostatus.org/badges/latest/active.svg)](https://www.repostatus.org/#active)
[![npm Version](https://img.shields.io/npm/v/@node-oauth/oauth2-server?label=version)](https://www.npmjs.com/package/@node-oauth/oauth2-server)
[![npm Downloads/Week](https://img.shields.io/npm/dw/@node-oauth/oauth2-server)](https://www.npmjs.com/package/@node-oauth/oauth2-server)
[![GitHub License](https://img.shields.io/github/license/node-oauth/node-oauth2-server)](https://github.com/node-oauth/node-oauth2-server/blob/master/LICENSE)
[![Tests](https://github.com/node-oauth/node-oauth2-server/actions/workflows/tests.yml/badge.svg)](https://github.com/node-oauth/node-oauth2-server/actions/workflows/tests.yml)
[![Formatted with Biome](https://img.shields.io/badge/Formatted_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev/)
[![CodeQL Semantic Analysis](https://github.com/node-oauth/node-oauth2-server/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/node-oauth/node-oauth2-server/actions/workflows/codeql-analysis.yml)
[![Deploy VitePress site to Pages](https://github.com/node-oauth/node-oauth2-server/actions/workflows/deploy_docs.yml/badge.svg)](https://github.com/node-oauth/node-oauth2-server/actions/workflows/deploy_docs.yml)

A complete, compliant, and well-tested module for implementing an OAuth 2.0 server in [Node.js](https://nodejs.org).
This project is a continuation of the
abandoned [oauthjs/node-oauth2-server](https://github.com/oauthjs/node-oauth2-server) project.

> [!NOTE]
> 🛡️ If you intend to submit a security issue or vulnerability, please read
> our [security policy](https://github.com/node-oauth/node-oauth2-server/security/policy) first.

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Features](#features)
- [Installation and Usage](#installation-and-usage)
  - [Express and Koa Users](#express-and-koa-users)
  - [Installation](#installation)
  - [Usage Guide](#usage-guide)
  - [Examples](#examples)
- [Migration Notes](#migration-notes)
  - [Version 5 Notes](#version-5-notes)
  - [Migrating from oauthjs/node-oauth2-server and 3.x](#migrating-from-oauthjsnode-oauth2-server-and-3x)
  - [Supported Node.js Versions](#supported-nodejs-versions)
- [Contributing to This Project](#contributing-to-this-project)
  - [Reporting Security Vulnerabilities](#reporting-security-vulnerabilities)
  - [Development, Issues, and Pull Requests](#development-issues-and-pull-requests)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Features

- Supports the `authorization_code`, `client_credentials`, `refresh_token`, and `password` grants, as well as *extension
  grants*, with scopes.
- Can be used with *promises*, *ES6 generators*, and *async*/*await*.
- Fully [RFC 6749](https://tools.ietf.org/html/rfc6749.html) and [RFC 6750](https://tools.ietf.org/html/rfc6750.html)
  compliant.
- Storage-agnostic: supports any form of storage, including *PostgreSQL*, *MySQL*, *MongoDB*, and *Redis*.
- Supports [PKCE](https://node-oauth.github.io/node-oauth2-server/guide/pkce.html).
- Complete [test suite](https://github.com/node-oauth/node-oauth2-server/tree/master/test).

## Installation and Usage

### Express and Koa Users

The `@node-oauth/oauth2-server` module is framework-agnostic.
Most users should refer to our [Express (active, maintained by us)](https://github.com/node-oauth/express-oauth-server)
or
[Koa (not maintained by us)](https://github.com/oauthjs/koa-oauth-server/tree/master/examples) adapters.
These adapters integrate the library with their respective frameworks.

> [!TIP]
> If you're using one of these frameworks, we strongly recommend using the corresponding wrapper module instead of
> writing your own integration.

### Installation

The base installation is intended for users who want to fully customize the integration
of this library into their stack.

```bash
npm install @node-oauth/oauth2-server
```

### Usage Guide

Documentation is available at https://node-oauth.github.io/node-oauth2-server/.

Please open an issue if something is confusing or missing in the documentation.

### Examples

More examples can be found in our examples repository: https://github.com/node-oauth/node-oauth2-server-examples

## Migration Notes

### Version 5 Notes

Starting with version `5.x`, we removed support for callbacks.
This version supports only promises and async/await.

In this version, we also raised the minimum required Node.js version to 16, as Node.js 14 was deprecated.

### Migrating from [oauthjs/node-oauth2-server](https://github.com/oauthjs/node-oauth2-server) and 3.x

Version 4.x should not introduce major breaking changes. However, it includes many improvements and fixes that may
be incompatible with specific behavior in version 3.x and earlier.

### Supported Node.js Versions

We aim to maintain compatibility with older Node.js versions wherever possible.
If our minimum supported Node.js version predates the currently supported or LTS releases, this reflects our
commitment to backward compatibility and does not mean that this library is deprecated.
This approach lets us provide a stable OAuth 2.0 server for legacy systems with the same features available to modern
systems.

## Contributing to This Project

### Reporting Security Vulnerabilities

If you intend to submit a security issue or vulnerability, please read
our [security policy](https://github.com/node-oauth/node-oauth2-server/security/policy) first.

The policy is also available locally in [SECURITY.md](./SECURITY.md).

### Development, Issues, and Pull Requests

Please read our [contribution guide](./CONTRIBUTING.md) before contributing.
Please open an issue before submitting a pull request to discuss whether your proposed contribution is suitable for
the project.

## License

This library is licensed under the MIT License. See the [LICENSE file](./LICENSE).

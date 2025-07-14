========================
About Node OAuth2 Server
========================

Please read this section carefully to understand the purpose and scope of the Node OAuth2 Server library.

Scope
=====

The scope of this library is to provide a headless implementation of an OAuth2 server that can be used in a variety of applications.
It is designed to be flexible and extensible, allowing developers to implement their own models and customize the behavior of the server.


Headless
========

By headless we mean that the library does not provide a user interface or any specific implementation details for handling user interactions.
It is purely a backend library that can be integrated into any Node.js application or framework.

The core library is also designed to be framework-agnostic, meaning it does not depend on any specific web framework like Express or Koa.
For these frameworks, we provide separate adapter libraries that can be used to integrate the OAuth2 server into your application.

Workflows
=========

The library intends to cover the core OAuth2 workflows, including:
- Authorization Code Grant
- Client Credentials Grant
- Password Grant
- Refresh Token Grant

While we provide documentation and examples for these workflows,
it is crucial for developers to understand the OAuth2 specification and how to implement these workflows correctly in their applications.
This is especially important for security reasons, as OAuth2 is a complex protocol with many potential pitfalls.

We do provide links to standards and readings that can help developers understand the OAuth2 specification and how to implement it securely.

Examples
========

We provide generic examples which you can use as foundation.
However, please make sure you understand the OAuth2 specification and how to implement it correctly in your application.

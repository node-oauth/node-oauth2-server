# Adapters

The *@node-oauth/oauth2-server* module is typically not used directly but through one of the available adapters, converting the interface to a suitable one for the HTTP server framework in use.

- [express-oauth-server](https://www.npmjs.com/package/@node-oauth/express-oauth-server) for [Express](https://npmjs.org/package/express)
- [koa-oauth-server](https://npmjs.org/package/koa-oauth-server) for [Koa](https://npmjs.org/package/koa)

## Writing Adapters

Adapters typically do the following:

- Inherit from `OAuth2Server </api/oauth2-server>`.

- Override `authenticate() <OAuth2Server#authenticate>`, `authorize() <OAuth2Server#authorize>` and `token() <OAuth2Server#token>`.

  Each of these functions should:

  - Create `Request </api/request>` and `Response </api/response>` objects from their framework-specific counterparts.
  - Call the original function.
  - Copy all fields from the `Response </api/response>` back to the framework-specific request object and send it.

Adapters should preserve functionality provided by *@node-oauth/oauth2-server* but are free to add additional features that make sense for the respective HTTP server framework.

# Compliance & your responsibilities

`@node-oauth/oauth2-server` implements the OAuth 2.0 *protocol logic* — the grant
flows, authorization-code and token validation, scope checks, PKCE verification,
and RFC-compliant success/error responses. It is deliberately **framework-agnostic
and transport-agnostic**: it never touches the network, your HTTP framework, or
your storage directly.

That means full [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749) /
[RFC 6750](https://www.rfc-editor.org/rfc/rfc6750) conformance is a shared
responsibility. This page lists the requirements that fall on **you** — the
integration (Express / Koa / Fastify / …) and deployment layers — so you can build
your own conformance checklist. If you use an official adapter such as
[express-oauth-server](https://www.npmjs.com/package/@node-oauth/express-oauth-server),
some of these are handled for you.

## What the library already handles

So you know where the boundary sits, the library takes care of:

- The `authorization_code`, `client_credentials`, `refresh_token` and `password`
  grant flows, plus extension grants.
- Validating authorization codes, refresh tokens and access tokens (existence,
  ownership and expiry), and enforcing single use of authorization codes.
- Scope parsing/validation and PKCE verification (see [PKCE](./pkce.md)).
- Reading request parameters from **both** the query string and the request body.
- Requiring the token endpoint to use `POST` with
  `Content-Type: application/x-www-form-urlencoded`.
- RFC-compliant responses: the `error` / `error_description` body on failures
  ([§5.2](https://www.rfc-editor.org/rfc/rfc6749#section-5.2)),
  `Cache-Control: no-store` and `Pragma: no-cache` on token responses
  ([§5.1](https://www.rfc-editor.org/rfc/rfc6749#section-5.1)), and the
  `WWW-Authenticate` header on `401` responses.

## What you must handle

### Transport security (TLS)

> The authorization server MUST require the use of TLS […]
>
> — [RFC 6749 §1.6](https://www.rfc-editor.org/rfc/rfc6749#section-1.6), [§2.3.1](https://www.rfc-editor.org/rfc/rfc6749#section-2.3.1)

The library does not — and cannot — enforce transport security. Serve every
endpoint over HTTPS (terminate TLS at your server or reverse proxy) and reject
plaintext requests.

### Support `GET` on the authorization endpoint

> The authorization server MUST support the use of the HTTP "GET" method
> [RFC2616] for the authorization endpoint and MAY support the use of the "POST"
> method as well.
>
> — [RFC 6749 §3.1](https://www.rfc-editor.org/rfc/rfc6749#section-3.1)

The library reads the authorization request from both the query string and the
body, so it works with either method — but **your router must expose the
authorization endpoint over `GET`** (and may also accept `POST`). The token
endpoint, by contrast, MUST be `POST`, which the library enforces.

### Send the response and perform redirects

The library *populates* the `Response` object; it does not send it. You must copy
the status, headers and body onto your framework's real response object and, for
the authorization endpoint, issue the redirect (the `location` header is set for
you). Do not reassign your framework's `req`/`res` to the library's
`Request`/`Response` — wrap them in new variables, or you will lose framework
methods such as `res.redirect()`.

### Brute-force protection / rate limiting

> Since this client authentication method involves a password, the authorization
> server MUST protect any endpoint utilizing it against brute force attacks.
>
> — [RFC 6749 §2.3.1](https://www.rfc-editor.org/rfc/rfc6749#section-2.3.1)

Add rate limiting / throttling at the integration or deployment layer (middleware
or gateway) for the token and authorization endpoints, especially when
`client_secret` authentication or the (deprecated) `password` grant is in use.

### CSRF protection and `state`

The library requires the `state` parameter by default (unless `allowEmptyState`
is set), validates it, and reflects it back on the authorization response. What
it can't do for you is the CSRF protection itself: guarding your login / consent
UI against CSRF, and having the *client* verify that the `state` returned on the
redirect matches the value it sent, remain your responsibility
([RFC 6749 §10.12](https://www.rfc-editor.org/rfc/rfc6749#section-10.12)).

### Authenticate the resource owner

For the authorization endpoint you must supply an `authenticateHandler` that
returns the logged-in user (see [Getting started](./getting-started.md)). The
library does not implement user login or session management.

### Secure storage in your model

Your [model](./model.md) is responsible for handling secrets and tokens safely:
hash and compare `client_secret`s, store authorization codes and tokens securely
and honour their expiry, and validate `redirect_uri`s against the registered set
(`validateRedirectUri`) — see
[RFC 6749 §3.1.2](https://www.rfc-editor.org/rfc/rfc6749#section-3.1.2) and
[§10](https://www.rfc-editor.org/rfc/rfc6749#section-10).

## Conformance checklist

- [ ] All endpoints served over **TLS**.
- [ ] Authorization endpoint reachable via **`GET`** (and optionally `POST`).
- [ ] Framework response sent and redirects issued (see [Sending the response](./getting-started.md#sending-the-response)).
- [ ] **Rate limiting / brute-force** protection on the token and authorization endpoints.
- [ ] **CSRF** protection on the login/consent UI; `state` validated by clients.
- [ ] Resource owner authenticated via an `authenticateHandler`.
- [ ] Model stores secrets/codes/tokens securely and validates `redirect_uri`.
- [ ] **PKCE** used for the authorization code grant (see [PKCE](./pkce.md)).

See also [RFC 6749 §10 (Security Considerations)](https://www.rfc-editor.org/rfc/rfc6749#section-10)
and [RFC 9700 (OAuth 2.0 Security Best Current Practice)](https://www.rfc-editor.org/rfc/rfc9700).

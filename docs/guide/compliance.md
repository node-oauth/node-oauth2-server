# Compliance & your responsibilities

`@node-oauth/oauth2-server` implements the OAuth 2.0 *protocol logic* — the grant
flows, authorization-code and token validation, scope checks, PKCE verification,
and response preparation. It is deliberately **framework-agnostic
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
- Authorization-code existence, client ownership, required expiry Date and expiry,
  followed by model revocation. Single use depends on durable, atomic revocation.
- Refresh-token existence, client ownership and user presence; refresh expiry is
  checked only when present and must then be a Date.
- Access-token existence, user presence and required expiry Date. Authentication
  does not independently bind the token to a requesting client.
- Scope parsing, configured scope checks and PKCE verification (see [PKCE](./pkce.md)).
- Authorization parameters generally from body or query. Token grant type,
  code, verifier, refresh token and password credentials come from the body;
  client credentials come from HTTP Basic or the body. Code exchange also
  accepts `redirect_uri` in the query.
- Token requests must use `POST` and `application/x-www-form-urlencoded`.
- Successful token responses have `Cache-Control: no-store` and `Pragma: no-cache`.
  Caught token failures get error bodies, but early failures do not. Authentication
  sets challenge headers for selected errors, not a complete error response.
  See [response responsibilities](./getting-started.md#sending-the-response).

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

Response preparation varies by endpoint and failure stage; see
[Sending the response](./getting-started.md#sending-the-response). The library does not send it. You must copy
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

Authorization uses built-in bearer authentication when no custom
`authenticateHandler` is supplied. For session-based login, provide a handler
returning the logged-in user and handle login first. A falsy handler result is a
server error, not a login challenge. See [model requirements](./model.md#authorization-code-grant).
The library does not implement login or session management.

### Secure storage in your model

Your [model](./model.md) is responsible for handling secrets and tokens safely:
hash and compare `client_secret`s, store authorization codes and tokens securely
and provide registered `client.redirectUris`. The library defaults to exact
inclusion checks; `validateRedirectUri` is an optional override. Implement atomic
code/token revocation and enforce client authentication in the appropriate endpoint
context (see [PKCE client authentication](./pkce.md#pkce-client-authentication-and-refresh-tokens)) — see
[RFC 6749 §3.1.2](https://www.rfc-editor.org/rfc/rfc6749#section-3.1.2) and
[§10](https://www.rfc-editor.org/rfc/rfc6749#section-10).

## Conformance checklist

- [ ] All endpoints served over **TLS**.
- [ ] Authorization endpoint reachable via **`GET`** (and optionally `POST`).
- [ ] Framework response sent and redirects issued (see [Sending the response](./getting-started.md#sending-the-response)).
- [ ] **Rate limiting / brute-force** protection on the token and authorization endpoints.
- [ ] **CSRF** protection on the login/consent UI; `state` validated by clients.
- [ ] Resource owner authenticated via bearer fallback or a custom `authenticateHandler`.
- [ ] Model stores secrets/codes/tokens securely and validates `redirect_uri`.
- [ ] **PKCE** used for the authorization code grant (see [PKCE](./pkce.md)).

See also [RFC 6749 §10 (Security Considerations)](https://www.rfc-editor.org/rfc/rfc6749#section-10)
and [RFC 9700 (OAuth 2.0 Security Best Current Practice)](https://www.rfc-editor.org/rfc/rfc9700).

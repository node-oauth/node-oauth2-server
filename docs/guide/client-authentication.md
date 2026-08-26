# Client Authentication

When a client requests a token from the [token endpoint](../api/handlers/token-handler.md), it
authenticates itself to the authorization server. The method it uses is its
`token_endpoint_auth_method`.

Client authentication is **pluggable**: each method is a small adapter, and the token endpoint
selects the one that matches the incoming request. The following methods are built in and enabled
by default:

| Method | Credentials | Model lookup |
| --- | --- | --- |
| `client_secret_basic` | HTTP `Authorization: Basic` header | `getClient(clientId, clientSecret)` |
| `client_secret_post` | `client_id` + `client_secret` in the request body | `getClient(clientId, clientSecret)` |
| `none` | `client_id` only (public client) | `getClient(clientId)` |

A public (`none`) client is only accepted for a [PKCE](./pkce.md) request, or when
`requireClientAuthentication` is disabled for the grant (see
[`OAuth2Server#token`](../api/server.md)).

> [!IMPORTANT]
> A request **MUST NOT** present more than one authentication mechanism
> ([RFC 6749 §2.3](https://datatracker.ietf.org/doc/html/rfc6749#section-2.3)). A request that
> carries, for example, both a Basic `Authorization` header and a body `client_secret` is rejected
> with `invalid_request`.

## The model contract

The secret-based methods verify the client through your model's
[`getClient`](../api/model.md#modelgetclientclientid-clientsecret--code-promiseclientdata-code):

```js
const model = {
  async getClient (clientId, clientSecret) {
    const client = await db.findClient(clientId)
    if (!client) {
      return false
    }
    // `clientSecret` is only supplied for the secret-based methods; it is
    // `undefined` for public (`none`) and JWT clients, so only verify it when present.
    if (clientSecret != null && client.secret !== clientSecret) {
      return false
    }
    return client // must include `grants`; may include `tokenEndpointAuthMethod`, `jwks`, ...
  }
  // ...other model functions
}
```

## JWT client authentication

The library can authenticate clients with a signed JWT *client assertion*
([RFC 7521 §4.2](https://datatracker.ietf.org/doc/html/rfc7521#section-4.2),
[RFC 7523 §2.2/§3](https://datatracker.ietf.org/doc/html/rfc7523#section-2.2),
[OpenID Connect Core §9](https://openid.net/specs/openid-connect-core-1_0.html#ClientAuthentication)).
Two methods are covered, distinguished by the JWS algorithm of the assertion:

- **`private_key_jwt`** — asymmetric (`RS*`/`PS*`/`ES*`/`EdDSA`), verified against the client's
  registered public keys.
- **`client_secret_jwt`** — HMAC (`HS*`), verified with the client secret.

JWT authentication is **opt-in** because it needs per-deployment configuration. Enable it by adding
a `JwtBearerClientAuthentication` instance through the `extendedClientAuthentication` option (the
key is just a label, the same way [`extendedGrantTypes`](./grant-types.md#extension-grants) works):

```js
const OAuth2Server = require('@node-oauth/oauth2-server')
const { JwtBearerClientAuthentication } = OAuth2Server

const server = new OAuth2Server({
  model,
  extendedClientAuthentication: {
    jwt: new JwtBearerClientAuthentication({
      // REQUIRED: the value(s) the assertion's `aud` claim must contain —
      // your token endpoint URL and/or this server's issuer identifier.
      audience: 'https://as.example.com/oauth/token'
    })
  }
})
```

### Options

| Option | Default | Description |
| --- | --- | --- |
| `audience` *(required)* | — | The value(s) the assertion's `aud` claim must contain. Matched exactly. |
| `maxTokenAge` | _off_ | Maximum assertion age in seconds, measured from `iat`. Enabling it makes `iat` mandatory. |
| `clockTolerance` | `0` | Clock-skew tolerance in seconds. |
| `algorithms` | all `HS*`/`RS*`/`PS*`/`ES*`/`EdDSA` | Override the accepted JWS algorithms. Set to an asymmetric-only list to forbid `client_secret_jwt` globally. |
| `getKey` | reads `client.secret` / `client.jwks` / `client.jwksUri` | `(client, header) => key` — override key resolution. |

### Required claims

The assertion must be a single, signed JWT whose claims satisfy
[RFC 7523 §3](https://datatracker.ietf.org/doc/html/rfc7523#section-3):

- `iss` — **must** equal the `client_id`
- `sub` — **must** equal the `client_id`
- `aud` — **must** contain this server (per the configured `audience`)
- `exp` — the assertion must not be expired

`iss`/`sub` are bound to the resolved client **after** the signature is verified; `nbf`, `iat` and
`jti` are optional unless you enable `maxTokenAge` (needs `iat`) or replay protection (needs `jti`).

### Where the keys come from

The default key resolution reads the verification material straight off the client object returned
by `getClient(clientId)` (called without a secret):

- **`client_secret_jwt`** → `client.secret` (the same secret used for `client_secret_basic`/`post`).
- **`private_key_jwt`** → `client.jwks` (an inline [JWK Set](https://datatracker.ietf.org/doc/html/rfc7517))
  **or** `client.jwksUri` (a URL the server fetches and caches).

```js
const model = {
  async getClient (clientId, clientSecret) {
    return {
      id: clientId,
      grants: ['client_credentials'],
      // for private_key_jwt:
      jwks: { keys: [/* the client's public JWK(s) */] },
      // or: jwksUri: 'https://client.example.com/jwks.json',
      // for client_secret_jwt: the existing `secret` is reused as the HMAC key
    }
  }
}
```

> [!WARNING]
> `jwksUri` is fetched by the server. Validate it at registration time (HTTPS only, no
> link-local/internal hosts) to avoid SSRF, exactly as you would any client-supplied URL.

Pass `getKey` if your keys live elsewhere (a database, a KMS, a remote registry).

### Replay protection

[OpenID Connect Core §9](https://openid.net/specs/openid-connect-core-1_0.html#ClientAuthentication)
requires client assertions to be single-use. This is **opt-in** and only active when your model
implements **both** of these functions (implementing only one is rejected as a misconfiguration).
They receive a stable assertion **id** — the `jti` claim when present, otherwise a fingerprint of the
assertion's signing input — so single-use is enforced even for assertions that omit `jti`:

```js
const model = {
  async isClientAssertionJtiUsed (id) {
    return db.clientAssertionIdExists(id)
  },
  async saveClientAssertionJti (id, exp) {
    // store with a TTL until `exp` so the record self-expires
    await db.saveClientAssertionId(id, exp)
  }
}
```

### Pinning a client to one method

A client may declare its registered `tokenEndpointAuthMethod`. When set, the token endpoint rejects
any other method — so a client registered for `private_key_jwt` cannot fall back to
`client_secret_jwt` (or a shared secret) even if it holds one:

```js
return { id: clientId, grants: [...], jwks, tokenEndpointAuthMethod: 'private_key_jwt' }
```

Clients that do not declare a method are unconstrained.

### Example request

The client sends its normal grant request, swapping `client_secret`/Basic for the assertion. Note
that `scope` (and every other grant parameter) stays a **normal body parameter** — it is not read
from the assertion:

```
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&scope=read
&client_assertion_type=urn%3Aietf%3Aparams%3Aoauth%3Aclient-assertion-type%3Ajwt-bearer
&client_assertion=eyJhbGciOiJSUzI1Ni...
```

A client can build the assertion with [`jose`](https://github.com/panva/jose):

```js
const { SignJWT } = require('jose')
const { randomUUID } = require('crypto')

const clientAssertion = await new SignJWT({})
  .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
  .setIssuer(clientId)
  .setSubject(clientId)
  .setAudience('https://as.example.com/oauth/token')
  .setIssuedAt()
  .setExpirationTime('60s')
  .setJti(randomUUID())
  .sign(privateKey)
```

## Writing a custom method

Implement the [`AbstractClientAuthentication`](../api/client-authentication/abstract-client-authentication) port and register it through
`extendedClientAuthentication`. For example, a minimal `tls_client_auth` (mTLS) adapter:

```js
const OAuth2Server = require('@node-oauth/oauth2-server')
const { AbstractClientAuthentication } = OAuth2Server

class TlsClientAuthentication extends AbstractClientAuthentication {
  // `true` for a credentialed method, `false` for a public client.
  get requiresCredentials () { return true }

  // Cheap, side-effect-free: does this request use this method?
  matches (request) { return !!request.get('x-ssl-client-cert') }

  // The `token_endpoint_auth_method` this request presents (for pinning).
  presentedMethod (request) { return 'tls_client_auth' }

  // Verify the credentials and resolve the client (throw InvalidClientError on failure).
  async authenticate (request, { model }) {
    const client = await model.getClient(request.body.client_id)
    // ...verify the presented client certificate against the client's registration
    return client
  }
}

const server = new OAuth2Server({
  model,
  extendedClientAuthentication: {
    tls_client_auth: new TlsClientAuthentication()
  }
})
```

The orchestrator owns method selection and exclusivity, so a new method needs no changes elsewhere.

## Security notes

- The token endpoint **must** be served over TLS
  ([RFC 6749 §3.2](https://datatracker.ietf.org/doc/html/rfc6749#section-3.2)); this is what
  protects the request body, including `scope`.
- `alg: none` and algorithm-confusion (verifying an `HS*` token against an RSA public key) are
  rejected: the HMAC key is always the client secret, and the accepted algorithm family is pinned
  to the key type.
- For OpenID Connect conformance, wire up the `jti` replay functions.

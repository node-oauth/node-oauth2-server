# OAuth 2.0 Grant Types

[`RFC 6749`](https://www.rfc-editor.org/rfc/rfc6749) describes a number of "grants"
for a client application to acquire an access token.
You can consider a grant similar to a "workflow" that is targeted for a specific
scenario of use cases.

## Authorization Code Grant Type

**Defined in:** [Section 4.1 of RFC 6749](https://www.rfc-editor.org/rfc/rfc6749#section-4.1).

**Model requirements:** [Model for Authorization Code Grant](./model#authorization-code-grant)

An authorization code is a credential representing the resource owner's authorization
(to access its protected resources) which is used by the client to obtain an access token.

## Refresh Token Grant Type

**Defined in:** [Section 6 of RFC 6749](https://www.rfc-editor.org/rfc/rfc6749#section-6).

**Model requirements:** [Model for Refresh Code Grant](./model.md#refresh-token-grant)

If the authorization server issued a refresh token to the client,
the client can request a refresh of their authorization token.

## Password Grant Type

::: warning
Password grant type is deprecated and should not be used at all.
Use this type only for legacy support and consider it inherently unsafe.
Read more in the following resources:

- [RFC9700](https://www.ietf.org/rfc/rfc9700.html#name-resource-owner-password-cre)
- [OWASP OAuth2 cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html)
  :::

**Defined in:** [Section 4.3 of RFC 6749](https://www.rfc-editor.org/rfc/rfc6749#section-4.3).

**Model requirements:** [Model for Password Grant](./model.md#password-grant)

The password grant is suitable for clients capable of obtaining the resource owner's credentials (
username and password, typically using an interactive form).

## Client Credentials Grant Type

**Defined in:** [Section 4.4 of RFC 6749](https://www.rfc-editor.org/rfc/rfc6749#section-4.4).

**Model requirements:** [Model for Refresh Token Code Grant](./model.md#refresh-token-grant)

The client can request an access token using only its client credentials (or other supported means of authentication)
when requesting access to the protected resources under its control.
The client credentials grant type **must** only be used by confidential clients.

## JWT Bearer Grant Type

**Defined in:** [RFC 7523 §2.1](https://datatracker.ietf.org/doc/html/rfc7523#section-2.1) (a profile of the [assertion framework, RFC 7521](https://datatracker.ietf.org/doc/html/rfc7521)).

A signed JWT *is* the authorization grant: the assertion's `iss` identifies a trusted issuer
and `sub` the principal the access token is issued for. This is the flow used for service-account
and trusted-IdP token exchange. It ships as an opt-in extension grant, `JwtBearerGrantType`,
registered through `extendedGrantTypes`:

``` js
const OAuth2Server = require('@node-oauth/oauth2-server');
const { JwtBearerGrantType } = OAuth2Server;

const server = new OAuth2Server({
  model,
  extendedGrantTypes: {
    'urn:ietf:params:oauth:grant-type:jwt-bearer': JwtBearerGrantType
  },
  // the requester MUST be identified by a registered `client_id` (see note below):
  requireClientAuthentication: { 'urn:ietf:params:oauth:grant-type:jwt-bearer': false }
});
```

The client sends the assertion as a normal token request; `scope` is a body parameter (it is not
read from the assertion):

```
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer
&assertion=eyJhbGciOiJSUzI1Ni...
&client_id=client-1
&scope=read
```

**Model requirements:** in addition to `getClient` and `saveToken`, the model must implement:

- `getJWTBearerIssuer(issuer)` — resolve a trusted issuer's verification key material and expected
  audience (`{ audience, jwks | jwksUri | secret }`); return a falsy value to reject an untrusted issuer.
- `getJWTBearerUser({ issuer, subject, client, scope, jti, assertionId, exp })` — resolve and
  authorize the principal the token is for; return a falsy value to deny. Enforce single-use replay
  protection here if required, keyed on `assertionId` (the `jti`, or a signing-input fingerprint when
  the assertion has no `jti`).

``` js
const model = {
  async getJWTBearerIssuer (issuer) {
    const trusted = await db.findTrustedIssuer(issuer)
    if (!trusted) return false
    return { audience: 'https://as.example.com/oauth/token', jwks: trusted.jwks }
  },
  async getJWTBearerUser ({ issuer, subject, assertionId, exp }) {
    // MUST verify this issuer is permitted to assert this subject, otherwise any
    // trusted issuer could obtain a token for any user:
    if (!await db.issuerMayAssert(issuer, subject)) return false
    // Enforce single-use to prevent replay. `assertionId` is the `jti`, or a
    // signing-input fingerprint when the assertion carries no `jti`:
    if (await db.assertionIdUsed(assertionId)) return false
    await db.saveAssertionId(assertionId, exp)
    return db.findUser(subject)
  }
}
```

The assertion is verified per [RFC 7523 §3](https://datatracker.ietf.org/doc/html/rfc7523#section-3)
(signature against the issuer's key, required `iss`/`sub`/`aud`/`exp`, audience and algorithm
checks); a failed assertion is rejected with `invalid_grant`. No refresh token is issued
([RFC 7521 §5.2](https://datatracker.ietf.org/doc/html/rfc7521#section-5.2)).

> [!WARNING]
> **Replay:** the library does not track used assertions itself. Unless `getJWTBearerUser` enforces
> single-use on `assertionId` (and/or you keep `exp` short), a captured assertion is replayable
> until it expires — and each replay yields a fresh access token. `assertionId` is stable whether or
> not the assertion carries a `jti`, so track it and prefer short-lived assertions.

> [!WARNING]
> **Issuer/subject authorization:** `getJWTBearerUser` MUST verify that the `issuer` is permitted to
> assert the given `subject`. If it merely resolves the subject to a user, any trusted issuer can
> obtain a token for any user.

> [!NOTE]
> This grant requires a registered `client_id` (resolved via `getClient`); it does not support the
> assertion-only request (no `client_id`) used by some providers, because the client is resolved
> before the grant runs. It asserts *who is authorized* and is distinct from
> [JWT client authentication](./client-authentication.md#jwt-client-authentication), where the JWT
> proves the *client's own* identity (`iss == sub == client_id`). The two are separable and may be
> combined.

## Extension Grants

**Defined in:** [Section 4.5 of RFC 6749](https://www.rfc-editor.org/rfc/rfc6749#section-4.4).

Create a subclass of `AbstractGrantType` and create methods <span class="title-ref">handle</span>
and <span class="title-ref">saveToken</span> along with other required methods according to your needs:

``` js
const OAuth2Server = require('@node-oauth/oauth2-server');
const {
  AbstractGrantType,
  InvalidArgumentError,
  InvalidRequestError
} = OAuth2Server;

class MyCustomGrantType extends AbstractGrantType {
    constructor(opts) {
        super(opts);
    }

    async handle(request, client) {
        if (!request) throw new InvalidArgumentError('Missing `request`');
        if (!client) throw new InvalidArgumentError('Missing `client`');

        let scope = this.getScope(request);
        let user = await this.getUserBySomething(request);

        return this.saveToken(user, client, scope);
    }

    async saveToken(user, client, scope) {
        this.validateScope(user, client, scope);

        let token = {
            accessToken: await this.generateAccessToken(client, user, scope),
            accessTokenExpiresAt: this.getAccessTokenExpiresAt(),
            refreshToken: await this.generateRefreshToken(client, user, scope),
            refreshTokenExpiresAt: this.getRefreshTokenExpiresAt(),
            scope: scope
        };

        return this.model.saveToken(token, client, user);
    }

    async getUserBySomething(request) {
        //Get user's data by corresponding data (FB User ID, Google, etc.), etc.
    }
}

module.exports = MyCustomGrantType;
```

Extension grants are registered
through [OAuth2Server#token](../api/server.md#oauth2servertokenrequest-response-options--codepromiseobjectcode) (
`options.extendedGrantTypes`).

This might require you to approve the new `grant_type` for a particular `client` if you do checks on valid grant types.

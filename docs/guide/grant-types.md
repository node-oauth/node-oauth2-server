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

TODO: overview of the workflow with functions involved

## Refresh Token Grant Type

**Defined in:** [Section 6 of RFC 6749](https://www.rfc-editor.org/rfc/rfc6749#section-6).

**Model requirements:** [Model for Refresh Code Grant](./model.md#refresh-token-grant)

If the authorization server issued a refresh token to the client,
the client can request a refresh of their authorization token.

TODO: overview of the workflow with functions involved

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

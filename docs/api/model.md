## Classes

<dl>
<dt><a href="#Model">Model</a></dt>
<dd><p>The Model implements the interface through
which some aspects of storage, retrieval and custom
validation are abstracted.</p>
<p>Each model function is resolved async by default.
This implies that async and sync model functions,
as well as generators, are supported.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#AccessTokenData">AccessTokenData</a></dt>
<dd><p>An <code>Object</code> representing the access token and associated data. <code>token.client</code> and <code>token.user</code> can carry additional properties that will be ignored by <em>oauth2-server</em>.</p>
</dd>
<dt><a href="#RefreshTokenData">RefreshTokenData</a></dt>
<dd><p>An <code>Object</code> representing the refresh token and associated data. <code>token.client</code> and <code>token.user</code> can carry additional properties that will be ignored by <em>oauth2-server</em>.</p>
</dd>
<dt><a href="#AuthorizationCodeData">AuthorizationCodeData</a></dt>
<dd><p>An <code>Object</code> representing the authorization code and associated data. <code>code.client</code> and <code>code.user</code> can carry additional properties that will be ignored by <em>oauth2-server</em>.</p>
</dd>
<dt><a href="#ClientData">ClientData</a></dt>
<dd><p>An <code>Object</code> representing the client and associated data.</p>
</dd>
</dl>

<a name="Model"></a>

## Model
The Model implements the interface through
which some aspects of storage, retrieval and custom
validation are abstracted.

Each model function is resolved async by default.
This implies that async and sync model functions,
as well as generators, are supported.

**Kind**: global class  

* [Model](#Model)
    * [new Model()](#new_Model_new)
    * _instance_
        * [.getClient(clientId, clientSecret)](#Model+getClient) ⇒ [<code>Promise.&lt;ClientData&gt;</code>](#ClientData)
        * [.saveToken(token, client, user)](#Model+saveToken) ⇒ <code>Promise.&lt;object&gt;</code>
        * ~~[.getUser(username, password, [client])](#Model+getUser) ⇒ <code>Promise.&lt;(object\|null\|undefined\|false\|0)&gt;</code>~~
        * [.getUserFromClient(client)](#Model+getUserFromClient) ⇒ <code>Promise.&lt;object&gt;</code>
        * [.getAccessToken(accessToken)](#Model+getAccessToken) ⇒ [<code>Promise.&lt;AccessTokenData&gt;</code>](#AccessTokenData)
        * [.getRefreshToken(refreshToken)](#Model+getRefreshToken) ⇒ [<code>Promise.&lt;RefreshTokenData&gt;</code>](#RefreshTokenData)
        * [.getAuthorizationCode(authorizationCode)](#Model+getAuthorizationCode) ⇒ [<code>Promise.&lt;AuthorizationCodeData&gt;</code>](#AuthorizationCodeData)
        * [.saveAuthorizationCode(code, client, user)](#Model+saveAuthorizationCode) ⇒ <code>Promise.&lt;object&gt;</code>
        * [.revokeToken(token)](#Model+revokeToken) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [.revokeAuthorizationCode(code)](#Model+revokeAuthorizationCode) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [.verifyScope(accessToken, scope)](#Model+verifyScope) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [.generateAccessToken(client, user, scope)](#Model+generateAccessToken) ⇒ <code>Promise.&lt;string&gt;</code>
        * [.generateRefreshToken(client, user, scope)](#Model+generateRefreshToken) ⇒ <code>Promise.&lt;string&gt;</code>
        * [.generateAuthorizationCode(client, user, scope)](#Model+generateAuthorizationCode) ⇒ <code>Promise.&lt;string&gt;</code>
        * [.validateScope(user, client, scope)](#Model+validateScope) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [.validateRedirectUri(redirectUri, client)](#Model+validateRedirectUri) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * _static_
        * [.from(impl)](#Model.from) ⇒ [<code>Model</code>](#Model)

<a name="new_Model_new"></a>

### new Model()
**Example**  
```js
const model = Model.from({
    getClient: () => { ... }
})
```
<a name="Model+getClient"></a>

### model.getClient(clientId, clientSecret) ⇒ [<code>Promise.&lt;ClientData&gt;</code>](#ClientData)
Invoked to retrieve a client using a client id or a client id/client secret combination, depending on the grant type.
This model function is **required** for all grant types.
**Invoked during:**

- `authorization_code` grant
- `client_credentials` grant
- `refresh_token` grant
- `password` grant

**Kind**: instance method of [<code>Model</code>](#Model)  
**Fulfil**: [<code>ClientData</code>](#ClientData) - An `Object` representing the client and associated data, or a falsy value if no such client could be found.  
**Reject**: <code>Error</code> - An Error type  

| Param | Type | Description |
| --- | --- | --- |
| clientId | <code>string</code> | The client id of the client to retrieve. |
| clientSecret | <code>string</code> | The client secret of the client to retrieve. Can be `null`. |

<a name="Model+saveToken"></a>

### model.saveToken(token, client, user) ⇒ <code>Promise.&lt;object&gt;</code>
Invoked to save an access token and optionally a refresh token, depending on the grant type.
This model function is **required** for all grant types.

**Invoked during:**
- `authorization_code` grant
- `client_credentials` grant
- `refresh_token` grant
- `password` grant

If the `allowExtendedTokenAttributes` server option is enabled (see `OAuth2Server#token() <OAuth2Server#token>`) any additional attributes set on the result are copied to the token response sent to the client.

**Kind**: instance method of [<code>Model</code>](#Model)  
**Fulfil**: <code>{accessToken:string,accessTokenExpiresAt:Date,refreshToken: string,refreshTokenExpiresAt: Date,scope: string[],client: ClientData,user: object</code>} An `Object` representing the token(s) and associated data.  

| Param | Type | Description |
| --- | --- | --- |
| token | <code>object</code> | The token(s) to be saved. |
| token.accessToken | <code>string</code> | The access token to be saved. |
| token.accessTokenExpiresAt | <code>Date</code> | The expiry time of the access token. |
| token.refreshToken | <code>string</code> | The refresh token to be saved. |
| token.refreshTokenExpiresAt | <code>Date</code> | The expiry time of the refresh token. |
| token.scope | <code>Array.&lt;string&gt;</code> | The authorized scope of the token(s) |
| client | [<code>ClientData</code>](#ClientData) | The client associated with the token(s). |
| user | <code>object</code> | The user associated with the token(s). |

**Example**  
```js
function saveToken(token, client, user) {
  // imaginary DB queries
  let fns = [
    db.saveAccessToken({
      access_token: token.accessToken,
      expires_at: token.accessTokenExpiresAt,
      scope: token.scope,
      client_id: client.id,
      user_id: user.id
    }),
    db.saveRefreshToken({
      refresh_token: token.refreshToken,
      expires_at: token.refreshTokenExpiresAt,
      scope: token.scope,
      client_id: client.id,
      user_id: user.id
    })
  ];
  return Promise.all(fns);
    .spread(function(accessToken, refreshToken) {
      return {
        accessToken: accessToken.access_token,
        accessTokenExpiresAt: accessToken.expires_at,
        refreshToken: refreshToken.refresh_token,
        refreshTokenExpiresAt: refreshToken.expires_at,
        scope: accessToken.scope,
        client: {id: accessToken.client_id},
        user: {id: accessToken.user_id}
      };
    });
}
```
<a name="Model+getUser"></a>

### ~~model.getUser(username, password, [client]) ⇒ <code>Promise.&lt;(object\|null\|undefined\|false\|0)&gt;</code>~~
***Deprecated***

Invoked to retrieve a user using a username/password combination.
This model function is **required** if the `password` grant is used.
Please note, that password grant is considered unsafe.
It is still supported but marked deprecated.

**Invoked during:**
- `password` grant

**Kind**: instance method of [<code>Model</code>](#Model)  
**Returns**: <code>Promise.&lt;(object\|null\|undefined\|false\|0)&gt;</code> - An `Object` representing the user, or a falsy value if no such user could be found. The user object is completely transparent to *oauth2-server* and is simply used as input to other model functions.  

| Param | Type | Description |
| --- | --- | --- |
| username | <code>string</code> | The username of the user to retrieve. |
| password | <code>string</code> | The user's password. |
| [client] | [<code>ClientData</code>](#ClientData) | The client. |

**Example**  
```js
function getUser(username, password) {
  // imaginary DB query
  return db.queryUser({username: username, password: password});
}
```
<a name="Model+getUserFromClient"></a>

### model.getUserFromClient(client) ⇒ <code>Promise.&lt;object&gt;</code>
Invoked to retrieve the user associated with the specified client.
This model function is **required** if the `client_credentials` grant is used.

**Invoked during:**
- `client_credentials` grant

**Remarks:**

`client` is the object previously obtained through `Model#getClient() <Model#getClient>`.

**Kind**: instance method of [<code>Model</code>](#Model)  
**Returns**: <code>Promise.&lt;object&gt;</code> - An `Object` representing the user, or a falsy value if the client does not have an associated user. The user object is completely transparent to *oauth2-server* and is simply used as input to other model functions.  

| Param | Type | Description |
| --- | --- | --- |
| client | [<code>ClientData</code>](#ClientData) | The client to retrieve the associated user for. |

**Example**  
```js
function getUserFromClient(client) {
  // imaginary DB query
  return db.queryUser({id: client.user_id});
}
```
<a name="Model+getAccessToken"></a>

### model.getAccessToken(accessToken) ⇒ [<code>Promise.&lt;AccessTokenData&gt;</code>](#AccessTokenData)
Invoked to retrieve an existing access token, including associated data, that has previously been saved through `Model#saveToken() <Model#saveToken>`.
This model function is **required** if `OAuth2Server#authenticate() <OAuth2Server#authenticate>` is used.

**Invoked during:**
- request authentication

**Kind**: instance method of [<code>Model</code>](#Model)  
**Returns**: [<code>Promise.&lt;AccessTokenData&gt;</code>](#AccessTokenData) - the object, containing the data, stored with the access token  

| Param | Type | Description |
| --- | --- | --- |
| accessToken | <code>string</code> | The access token to retrieve. |

**Example**  
```js
function getAccessToken(accessToken) {
  // imaginary DB queries
  return db.queryAccessToken({access_token: accessToken})
    .then(function(token) {
      return Promise.all([
        token,
        db.queryClient({id: token.client_id}),
        db.queryUser({id: token.user_id})
      ]);
    })
    .spread(function(token, client, user) {
      return {
        accessToken: token.access_token,
        accessTokenExpiresAt: token.expires_at,
        scope: token.scope,
        client: client, // with 'id' property
        user: user
      };
    });
}
```
<a name="Model+getRefreshToken"></a>

### model.getRefreshToken(refreshToken) ⇒ [<code>Promise.&lt;RefreshTokenData&gt;</code>](#RefreshTokenData)
Invoked to retrieve an existing refresh token previously saved through `Model#saveToken() <Model#saveToken>`.
This model function is **required** if the `refresh_token` grant is used.
**Invoked during:**
- `refresh_token` grant

**Kind**: instance method of [<code>Model</code>](#Model)  
**Returns**: [<code>Promise.&lt;RefreshTokenData&gt;</code>](#RefreshTokenData) - An `Object` representing the refresh token and associated data.  

| Param | Type | Description |
| --- | --- | --- |
| refreshToken | <code>string</code> | The access token to retrieve. |

**Example**  
```js
function getRefreshToken(refreshToken) {
  // imaginary DB queries
  return db.queryRefreshToken({refresh_token: refreshToken})
    .then(function(token) {
      return Promise.all([
        token,
        db.queryClient({id: token.client_id}),
        db.queryUser({id: token.user_id})
      ]);
    })
    .spread(function(token, client, user) {
      return {
        refreshToken: token.refresh_token,
        refreshTokenExpiresAt: token.expires_at,
        scope: token.scope,
        client: client, // with 'id' property
        user: user
      };
    });
}
```
<a name="Model+getAuthorizationCode"></a>

### model.getAuthorizationCode(authorizationCode) ⇒ [<code>Promise.&lt;AuthorizationCodeData&gt;</code>](#AuthorizationCodeData)
Invoked to retrieve an existing authorization code previously saved through `Model#saveAuthorizationCode() <Model#saveAuthorizationCode>`.
This model function is **required** if the `authorization_code` grant is used.
**Invoked during:**
- `authorization_code` grant

**Kind**: instance method of [<code>Model</code>](#Model)  
**Returns**: [<code>Promise.&lt;AuthorizationCodeData&gt;</code>](#AuthorizationCodeData) - An `Object` representing the authorization code and associated data.  

| Param | Type | Description |
| --- | --- | --- |
| authorizationCode | <code>string</code> | The authorization code to retrieve. |

**Example**  
```js
function getAuthorizationCode(authorizationCode) {
  // imaginary DB queries
  return db.queryAuthorizationCode({authorization_code: authorizationCode})
    .then(function(code) {
      return Promise.all([
        code,
        db.queryClient({id: code.client_id}),
        db.queryUser({id: code.user_id})
      ]);
    })
    .spread(function(code, client, user) {
      return {
        authorizationCode: code.authorization_code,
        expiresAt: code.expires_at,
        redirectUri: code.redirect_uri,
        scope: code.scope,
        client: client, // with 'id' property
        user: user
      };
    });
}
```
<a name="Model+saveAuthorizationCode"></a>

### model.saveAuthorizationCode(code, client, user) ⇒ <code>Promise.&lt;object&gt;</code>
Invoked to save an authorization code.
This model function is **required** if the `authorization_code` grant is used.

**Invoked during:**
- `authorization_code` grant

**Kind**: instance method of [<code>Model</code>](#Model)  
**Fulfil**: <code>{ authorizationCode: string, expiresAt: Date, redirectUri: string,scope: string[],client: ClientData,user: object</code>} An `Object` representing the authorization code and associated data. `code.client` and `code.user` can carry additional properties that will be ignored by *oauth2-server*.  

| Param | Type | Description |
| --- | --- | --- |
| code | <code>object</code> | The code to be saved. |
| code.authorizationCode | <code>string</code> | The authorization code to be saved. |
| code.expiresAt | <code>Date</code> | The expiry time of the authorization code. |
| code.redirectUri | <code>string</code> | The redirect URI associated with the authorization code. |
| code.scope | <code>Array.&lt;string&gt;</code> | The authorized scope of the authorization code. |
| client | [<code>ClientData</code>](#ClientData) | The client associated with the authorization code. |
| user | <code>object</code> | The user associated with the authorization code. |

**Example**  
```js
function saveAuthorizationCode(code, client, user) {
  // imaginary DB queries
  let authCode = {
    authorization_code: code.authorizationCode,
    expires_at: code.expiresAt,
    redirect_uri: code.redirectUri,
    scope: code.scope,
    client_id: client.id,
    user_id: user.id
  };
  return db.saveAuthorizationCode(authCode)
    .then(function(authorizationCode) {
      return {
        authorizationCode: authorizationCode.authorization_code,
        expiresAt: authorizationCode.expires_at,
        redirectUri: authorizationCode.redirect_uri,
        scope: authorizationCode.scope,
        client: {id: authorizationCode.client_id},
        user: {id: authorizationCode.user_id}
      };
    });
}
```
<a name="Model+revokeToken"></a>

### model.revokeToken(token) ⇒ <code>Promise.&lt;boolean&gt;</code>
Invoked to revoke a refresh token.
This model function is **required** if the `refresh_token` grant is used.
**Invoked during:**
- `refresh_token` grant

**Remarks:**
`token` is the refresh token object previously obtained through `Model#getRefreshToken() <Model#getRefreshToken>`.

**Kind**: instance method of [<code>Model</code>](#Model)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - Return `true` if the revocation was successful or `false` if the refresh token could not be found.  

| Param | Type |
| --- | --- |
| token | [<code>RefreshTokenData</code>](#RefreshTokenData) | 

**Example**  
```js
function revokeToken(token) {
  // imaginary DB queries
  return db.deleteRefreshToken({refresh_token: token.refreshToken})
    .then(function(refreshToken) {
      return !!refreshToken;
    });
}
```
<a name="Model+revokeAuthorizationCode"></a>

### model.revokeAuthorizationCode(code) ⇒ <code>Promise.&lt;boolean&gt;</code>
Invoked to revoke an authorization code.
This model function is **required** if the `authorization_code` grant is used.

**Invoked during:**
- `authorization_code` grant

**Remarks:**
`code` is the authorization code object previously obtained through [getAuthorizationCode](#Model+getAuthorizationCode).

**Kind**: instance method of [<code>Model</code>](#Model)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - Return `true` if the revocation was successful or `false` if the authorization code could not be found.  

| Param | Type |
| --- | --- |
| code | [<code>AuthorizationCodeData</code>](#AuthorizationCodeData) | 

<a name="Model+verifyScope"></a>

### model.verifyScope(accessToken, scope) ⇒ <code>Promise.&lt;boolean&gt;</code>
Invoked during request authentication to check if the provided access token was authorized the requested scopes.

This model function is **required** if scopes are used with `OAuth2Server#authenticate() <OAuth2Server#authenticate>`
but it's never called, if you provide your own `authenticateHandler` to the options.

**Invoked during:**
- request authentication

**Remarks:**
- `token` is the access token object previously obtained through `Model#getAccessToken() <Model#getAccessToken>`.
- `scope` is the required scope as given to `OAuth2Server#authenticate() <OAuth2Server#authenticate>` as `options.scope`.

**Kind**: instance method of [<code>Model</code>](#Model)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - Returns `true` if the access token passes, `false` otherwise.  

| Param | Type | Description |
| --- | --- | --- |
| accessToken | [<code>AccessTokenData</code>](#AccessTokenData) |  |
| scope | <code>Array.&lt;string&gt;</code> | The required scopes. |

**Example**  
```js
function verifyScope(token, requestedScopes) {
  if (!token.scope) {
    return false;
  }
  let authorizedScopes = token.scope;
  return requestedScopes.every(s => authorizedScopes.includes(s));
}
```
<a name="Model+generateAccessToken"></a>

### model.generateAccessToken(client, user, scope) ⇒ <code>Promise.&lt;string&gt;</code>
Invoked to generate a new access token.
This model function is **optional**.

If not implemented, a default handler is used that generates access tokens consisting of 40 characters in the range of `a..z0..9`.
[RFC 6749 Appendix A.12](https://www.rfc-editor.org/rfc/rfc6749#appendix-A.12>) specifies that access tokens must consist of characters inside the range `0x20..0x7E` (i.e. only printable US-ASCII characters).

**Invoked during:**
- `authorization_code` grant
- `client_credentials` grant
- `refresh_token` grant
- `password` grant

**Remarks:**
- `client` is the object previously obtained through `Model#getClient() <Model#getClient>`.
- `user` is the user object previously obtained through `Model#getAuthorizationCode() <Model#getAuthorizationCode>` (`code.user`; authorization code grant), `Model#getUserFromClient() <Model#getUserFromClient>` (client credentials grant), `Model#getRefreshToken() <Model#getRefreshToken>` (`token.user`; refresh token grant) or `Model#getUser() <Model#getUser>` (password grant).

**Kind**: instance method of [<code>Model</code>](#Model)  
**Returns**: <code>Promise.&lt;string&gt;</code> - A `String` to be used as access token.  

| Param | Type | Description |
| --- | --- | --- |
| client | <code>object</code> | The client the access token is generated for |
| user | <code>object</code> | The user the access token is generated for. |
| scope | <code>Array.&lt;string&gt;</code> | The scopes associated with the token. Can be `null` |

<a name="Model+generateRefreshToken"></a>

### model.generateRefreshToken(client, user, scope) ⇒ <code>Promise.&lt;string&gt;</code>
Invoked to generate a new refresh token.

This model function is **optional**. If not implemented, a default handler is used that generates refresh tokens consisting of 40 characters in the range of `a..z0..9`.
[RFC 6749 Appendix A.17](https://www.rfc-editor.org/6749#appendix-A.17) specifies that refresh tokens must consist of characters inside the range `0x20..0x7E` (i.e. only printable US-ASCII characters).

**Invoked during:**

- `authorization_code` grant
- `refresh_token` grant
- `password` grant

**Remarks:**

`client` is the object previously obtained through `Model#getClient() <Model#getClient>`.

`user` is the user object previously obtained through `Model#getAuthorizationCode() <Model#getAuthorizationCode>` (`code.user`; authorization code grant), `Model#getRefreshToken() <Model#getRefreshToken>` (`token.user`; refresh token grant) or `Model#getUser() <Model#getUser>` (password grant).

**Kind**: instance method of [<code>Model</code>](#Model)  
**Returns**: <code>Promise.&lt;string&gt;</code> - A `String` to be used as refresh token.  

| Param | Type | Description |
| --- | --- | --- |
| client | <code>object</code> | The client the refresh token is generated for |
| user | <code>object</code> | The user the refresh token is generated for. |
| scope | <code>Array.&lt;string&gt;</code> | The scopes associated with the refresh token. Can be `null` |

<a name="Model+generateAuthorizationCode"></a>

### model.generateAuthorizationCode(client, user, scope) ⇒ <code>Promise.&lt;string&gt;</code>
Invoked to generate a new authorization code.
This model function is **optional**. If not implemented, a default handler is used that generates authorization codes consisting of 40 characters in the range of `a..z0..9`.
[RFC 6749 Appendix A.11](https://www.rfc-editor.org/6749#appendix-A.11) specifies that authorization codes must consist of characters inside the range `0x20..0x7E` (i.e. only printable US-ASCII characters).

**Invoked during:**
- `authorization_code` grant
>`

**Kind**: instance method of [<code>Model</code>](#Model)  
**Returns**: <code>Promise.&lt;string&gt;</code> - A `String` to be used as authorization code.  

| Param | Type | Description |
| --- | --- | --- |
| client | <code>object</code> | The client the authorization code is generated for. |
| user | <code>object</code> | The user the authorization code is generated for. |
| scope | <code>Array.&lt;string&gt;</code> | The scopes associated with the authorization code. Can be `null`. |

<a name="Model+validateScope"></a>

### model.validateScope(user, client, scope) ⇒ <code>Promise.&lt;boolean&gt;</code>
Invoked to check if the requested `scope` is valid for a particular `client`/`user` combination.

This model function is **optional**. If not implemented, any scope is accepted.

**Invoked during:**

- `authorization_code` grant
- `client_credentials` grant
- `password` grant

**Remarks:**

`user` is the user object previously obtained through `Model#getAuthorizationCode() <Model#getAuthorizationCode>` (`code.user`; authorization code grant), `Model#getUserFromClient() <Model#getUserFromClient>` (client credentials grant) or `Model#getUser() <Model#getUser>` (password grant).

`client` is the object previously obtained through `Model#getClient <Model#getClient>` (all grants).

You can decide yourself whether you want to reject or accept partially valid scopes by simply filtering out invalid scopes and returning only the valid ones.

**Kind**: instance method of [<code>Model</code>](#Model)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - Validated scopes to be used or a falsy value to reject the requested scopes.  

| Param | Type | Description |
| --- | --- | --- |
| user | <code>object</code> | The associated user. |
| client | [<code>ClientData</code>](#ClientData) | The associated client. |
| scope | <code>Array.&lt;string&gt;</code> | The scopes to validate. |

**Example**  
```js
// To reject invalid or only partially valid scopes:
const VALID_SCOPES = ['read', 'write'];
function validateScope(user, client, scope) {
  if (!scope.every(s => VALID_SCOPES.indexOf(s) >= 0)) {
    return false;
  }
  return scope;
}
```
**Example**  
```js
// To accept partially valid scopes:
const VALID_SCOPES = ['read', 'write'];
function validateScope(user, client, scope) {
  return scope.filter(s => VALID_SCOPES.indexOf(s) >= 0);
}
```
<a name="Model+validateRedirectUri"></a>

### model.validateRedirectUri(redirectUri, client) ⇒ <code>Promise.&lt;boolean&gt;</code>
Invoked to check if the provided `redirectUri` is valid for a particular `client`.
This model function is **optional**. If not implemented, the `redirectUri` should be included in the provided `redirectUris` of the client.

**Invoked during:**
- `authorization_code` grant

**Remarks:**
When implementing this method you should take care of possible security risks related to `redirectUri`.
See: https://datatracker.ietf.org/doc/html/rfc6819
(Section-5.2.3.5 is implemented by default).

**Kind**: instance method of [<code>Model</code>](#Model)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - Returns `true` if the `redirectUri` is valid, `false` otherwise.  

| Param | Type | Description |
| --- | --- | --- |
| redirectUri | <code>string</code> | The redirect URI to validate |
| client | <code>object</code> | The associated client. |

<a name="Model.from"></a>

### Model.from(impl) ⇒ [<code>Model</code>](#Model)
Factory function to create a model form your implementation.

**Kind**: static method of [<code>Model</code>](#Model)  
**Returns**: [<code>Model</code>](#Model) - the model instance.  

| Param | Type | Description |
| --- | --- | --- |
| impl | <code>object</code> | an object containing your model function implementations |

<a name="AccessTokenData"></a>

## AccessTokenData
An `Object` representing the access token and associated data. `token.client` and `token.user` can carry additional properties that will be ignored by *oauth2-server*.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| accessToken | <code>string</code> | The access token passed to `getAccessToken()` |
| accessTokenExpiresAt | <code>Date</code> | The expiry time of the access token. |
| scope | <code>Array.&lt;string&gt;</code> | The authorized scope of the access token. |
| client | <code>object</code> | The client associated with the access token. |
| client.id | <code>string</code> | A unique string identifying the client. |
| user | <code>object</code> | The user associated with the access token. |

<a name="RefreshTokenData"></a>

## RefreshTokenData
An `Object` representing the refresh token and associated data. `token.client` and `token.user` can carry additional properties that will be ignored by *oauth2-server*.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| refreshToken | <code>string</code> | The refresh token passed to `getRefreshToken()` |
| refreshTokenExpiresAt | <code>Date</code> | The expiry time of the refresh token. |
| scope | <code>Array.&lt;string&gt;</code> | The authorized scope of the refresh token. |
| client | [<code>ClientData</code>](#ClientData) | The client associated with the refresh token. |
| user | <code>object</code> | The user associated with the access token. |

<a name="AuthorizationCodeData"></a>

## AuthorizationCodeData
An `Object` representing the authorization code and associated data. `code.client` and `code.user` can carry additional properties that will be ignored by *oauth2-server*.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| code | <code>string</code> | The authorization code passed to `getAuthorizationCode()`. |
| expiresAt | <code>Date</code> | The expiry time of the authorization code. |
| redirectUri | <code>string</code> | The redirect URI of the authorization code. |
| scope | <code>Array.&lt;string&gt;</code> | The authorized scope of the authorization code. |
| client | [<code>ClientData</code>](#ClientData) | The client associated with the authorization code. |
| user | <code>object</code> | The user associated with the access token. |

<a name="ClientData"></a>

## ClientData
An `Object` representing the client and associated data.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | The authorization code passed to `getAuthorizationCode()`. |
| redirectUris | <code>Array.&lt;string&gt;</code> | Redirect URIs allowed for the client. Required for the `authorization_code` grant. |
| grants | <code>Array.&lt;string&gt;</code> | Grant types allowed for the client. |
| accessTokenLifetime | <code>number</code> | Client-specific lifetime of generated access tokens in seconds. |
| refreshTokenLifetime | <code>number</code> | Client-specific lifetime of generated refresh tokens in seconds. |


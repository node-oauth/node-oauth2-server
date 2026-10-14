'use strict';

/*
 * Module dependencies
 */
const ServerError = require('./errors/server-error');

/**
 * @typedef AccessTokenData
 * @description An `Object` representing the access token and associated data. `token.client` and `token.user` can carry additional properties that will be ignored by *oauth2-server*.
 * @property accessToken {string} The access token passed to `getAccessToken()`
 * @property accessTokenExpiresAt {Date} The expiry time of the access token.
 * @property [scope] {string[]} The authorized scope of the access token.
 * @property client {object} The client associated with the access token.
 * @property client.id {string} A unique string identifying the client.
 * @property user {object} The user associated with the access token.
 */

/**
 * @typedef RefreshTokenData
 * @description An `Object` representing the refresh token and associated data. `token.client` and `token.user` can carry additional properties that will be ignored by *oauth2-server*.
 * @property refreshToken {string} The refresh token passed to `getRefreshToken()`
 * @property [refreshTokenExpiresAt] {Date} The expiry time of the refresh token.
 * @property [scope] {string[]} The authorized scope of the refresh token.
 * @property client {ClientData} The client associated with the refresh token.
 * @property user {object} The user associated with the access token.
 */

/**
 * @typedef AuthorizationCodeData
 * @description An `Object` representing the authorization code and associated data. `code.client` and `code.user` can carry additional properties that will be ignored by *oauth2-server*.
 * @property [codeChallenge] {string} Stored PKCE challenge; preserve during save/load.
 * @property [codeChallengeMethod] {string} Stored PKCE method (S256 or plain).
 * @property authorizationCode {string} The authorization code passed to `getAuthorizationCode()`.
 * @property expiresAt {Date} The expiry time of the authorization code.
 * @property redirectUri {string} The redirect URI of the authorization code.
 * @property [scope] {string[]} The authorized scope of the authorization code.
 * @property client {ClientData} The client associated with the authorization code.
 * @property user {object} The user associated with the access token.
 */

/**
 * @typedef ClientData
 * @alias ClientData
 * @description An `Object` representing the client and associated data.
 * @property id {string} A unique string identifying the client.
 * @property redirectUris {string[]} Redirect URIs allowed for the client. Required for the `authorization_code` grant.
 * @property grants {string[]} Grant types allowed for the client.
 * @property [accessTokenLifetime] {number} Client-specific lifetime of generated access tokens in seconds.
 * @property [refreshTokenLifetime] {number} Client-specific lifetime of generated refresh tokens in seconds.
 */

/**
 * @class
 * @classdesc The Model implements the interface through
 * which some aspects of storage, retrieval and custom
 * validation are abstracted.
 *
 * Each model function is resolved async by default.
 * This implies that async and sync model functions,
 * returning values or native Promises are supported. Direct generator hooks are not run.
 * Promise return types below also permit the corresponding synchronous value.
 * This class is an internal reference, not exported by the package entry point;
 * applications normally pass a plain object of hooks.
 *
 * @example
 * // Repository-internal import, not a public package export:
 * const Model = require('./lib/model');
 * const model = Model.from({
 *     getClient: async (id) => db.queryClient({ id })
 * })
 */
class Model {
  /**
   * Factory function to create a model form your implementation.
   * @static
   * @param impl {object} an object containing your model function implementations
   * @return {Model} the model instance.
   */
  static from(impl) {
    const m = new Model();
    const nullFns = {};
    Object.getOwnPropertyNames(Model.prototype).forEach((key) => {
      nullFns[key] = null;
    });
    Object.assign(m, nullFns, impl);
    return m;
  }

  /*-------------------------------------------------------------------------
   | ALWAYS REQUIRED
   *-------------------------------------------------------------------------
   | The following functions are required by every workflow / grant type.
   */

  /**
   * Invoked to retrieve a client using a client id or a client id/client secret combination, depending on the grant type.
   * This model function is **required** for all grant types.
   * **Invoked during:**
   *
   * - `authorization_code` grant
   * - `client_credentials` grant
   * - `refresh_token` grant
   * - `password` grant
   *
   * **Remarks:**
   * Authorization always calls `getClient(clientId, null)`, including for confidential
   * clients. Token requests pass the supplied secret; PKCE or a per-grant option
   * can permit its absence. Always validate supplied secrets. An absent secret
   * alone cannot identify the endpoint or distinguish public/confidential clients.
   * Confidential token requests still require authentication: use endpoint-specific
   * model wrappers as shown in the [PKCE guide](../guide/pkce.md#pkce-client-authentication-and-refresh-tokens).
   * Universally rejecting missing secrets here breaks confidential-client authorization.
   *
   * @async
   * @param clientId {string} The client id of the client to retrieve.
   * @param clientSecret {string?} The client secret of the client to retrieve. Can be `null`.
   * @returns {Promise.<ClientData>}
   * @fulfil {ClientData} - An `Object` representing the client and associated data, or a falsy value if no such client could be found.
   * @reject {Error} - An Error type
   */
  async getClient(clientId, clientSecret) {
    throw new ServerError('getClient not implemented');
  }

  /**
   * Invoked to save an access token and optionally a refresh token, depending on the grant type.
   * This model function is **required** for all grant types.
   *
   * **Invoked during:**
   * - `authorization_code` grant
   * - `client_credentials` grant
   * - `refresh_token` grant
   * - `password` grant
   *
   * If the `allowExtendedTokenAttributes` server option is enabled (see [OAuth2Server#token](server.md#OAuth2Server+token)) any additional attributes set on the result are copied to the token response sent to the client.
   *
   * @async
   * @instance
   * @param token {object} The token(s) to be saved.
   * @param token.accessToken {string} The access token to be saved.
   * @param token.accessTokenExpiresAt {Date} The expiry time of the access token.
   * @param [token.refreshToken] {string} The refresh token to be saved.
   * @param [token.refreshTokenExpiresAt] {Date} The expiry time of the refresh token.
   * @param [token.scope] {string[]} The authorized scope of the token(s)
   * @param client {ClientData} The client associated with the token(s).
   * @param user {object} The user associated with the token(s).
   * @return {Promise<object>}
   * @fulfil {{accessToken:string,accessTokenExpiresAt:Date,refreshToken: string,refreshTokenExpiresAt: Date,scope: string[],client: ClientData,user: object}} An `Object` representing the token(s) and associated data.
   * @example
   * async function saveToken(token, client, user) {
   *   // Imaginary DB methods return native Promises. Use a transaction if needed.
   *   await db.saveAccessToken({
   *     access_token: token.accessToken,
   *     expires_at: token.accessTokenExpiresAt,
   *     scope: token.scope,
   *     client_id: client.id,
   *     user_id: user.id
   *   });
   *   if (token.refreshToken) {
   *     await db.saveRefreshToken({
   *       refresh_token: token.refreshToken,
   *       expires_at: token.refreshTokenExpiresAt,
   *       scope: token.scope,
   *       client_id: client.id,
   *       user_id: user.id
   *     });
   *   }
   *   return { ...token, client, user };
   * }
   */
  async saveToken(token, client, user) {
    throw new ServerError('saveToken not implemented');
  }

  /*-------------------------------------------------------------------------
   | PARTIALLY REQUIRED
   *-------------------------------------------------------------------------
   | The following functions are required by specific grant types or under
   | specific conditions.
   */

  /**
   * Invoked to retrieve a user using a username/password combination.
   * This model function is **required** if the `password` grant is used.
   * Please note, that password grant is considered unsafe.
   * It is still supported but marked deprecated.
   *
   * **Invoked during:**
   * - `password` grant
   *
   * @deprecated
   * @async
   * @param username {string} The username of the user to retrieve.
   * @param password {string} The user's password.
   * @param client {ClientData=} The client.
   * @return {Promise<object|null|undefined|false|0>} An `Object` representing the user, or a falsy value if no such user could be found. The user object is completely transparent to *oauth2-server* and is simply used as input to other model functions.
   * @example
   * function getUser(username, password) {
   *   // imaginary DB query
   *   return db.queryUser({username: username, password: password});
   * }
   */
  async getUser(username, password, client) {
    throw new ServerError('getUser not implemented');
  }

  /**
   * Invoked to retrieve the user associated with the specified client.
   * This model function is **required** if the `client_credentials` grant is used.
   *
   * **Invoked during:**
   * - `client_credentials` grant
   *
   * **Remarks:**
   *
   * `client` is the object previously obtained through [Model#getClient](model.md#Model+getClient).
   *
   * @async
   * @instance
   * @param client {ClientData}  The client to retrieve the associated user for.
   * @return {Promise<object>} An `Object` representing the user, or a falsy value if the client does not have an associated user. The user object is completely transparent to *oauth2-server* and is simply used as input to other model functions.
   * @example
   * function getUserFromClient(client) {
   *   // imaginary DB query
   *   return db.queryUser({id: client.user_id});
   * }
   */
  async getUserFromClient(client) {
    throw new ServerError('getUserFromClient not implemented');
  }

  /**
     * Invoked to retrieve an existing access token, including associated data, that has previously been saved through [Model#saveToken](model.md#Model+saveToken).
     * This model function is **required** if [OAuth2Server#authenticate](server.md#OAuth2Server+authenticate) is used.
     *
     * **Invoked during:**
     * - request authentication
     *
     * @async
     
   * @instance
     * @param accessToken {string} The access token to retrieve.
     * @return {Promise<AccessTokenData>} the object, containing the data, stored with the access token
     * @example
     * function getAccessToken(accessToken) {
     *   // imaginary DB queries
     *   return db.queryAccessToken({access_token: accessToken})
     *     .then(function(token) {
     *       if (!token) return [null];
     *       return Promise.all([
     *         token,
     *         db.queryClient({id: token.client_id}),
     *         db.queryUser({id: token.user_id})
     *       ]);
     *     })
     *     .then(function([token, client, user]) {
     *       if (!token) return false;
     *       return {
     *         accessToken: token.access_token,
     *         accessTokenExpiresAt: token.expires_at,
     *         scope: token.scope,
     *         client: client, // with 'id' property
     *         user: user
     *       };
     *     });
     * }
     */
  async getAccessToken(accessToken) {
    throw new ServerError('getAccessToken not implemented');
  }

  /**
     * Invoked to retrieve an existing refresh token previously saved through [Model#saveToken](model.md#Model+saveToken).
     * This model function is **required** if the `refresh_token` grant is used.
     * **Invoked during:**
     * - `refresh_token` grant
     *
     * @async
     
   * @instance
     * @param refreshToken {string} The refresh token to retrieve.
     * @return {Promise<RefreshTokenData>} An `Object` representing the refresh token and associated data.
     * @example
     * function getRefreshToken(refreshToken) {
     *   // imaginary DB queries
     *   return db.queryRefreshToken({refresh_token: refreshToken})
     *     .then(function(token) {
     *       if (!token) return [null];
     *       return Promise.all([
     *         token,
     *         db.queryClient({id: token.client_id}),
     *         db.queryUser({id: token.user_id})
     *       ]);
     *     })
     *     .then(function([token, client, user]) {
     *       if (!token) return false;
     *       return {
     *         refreshToken: token.refresh_token,
     *         refreshTokenExpiresAt: token.expires_at,
     *         scope: token.scope,
     *         client: client, // with 'id' property
     *         user: user
     *       };
     *     });
     * }
     */
  async getRefreshToken(refreshToken) {
    throw new ServerError('getRefreshToken not implemented');
  }

  /**
     * Invoked to retrieve an existing authorization code previously saved through [Model#saveAuthorizationCode](model.md#Model+saveAuthorizationCode).
     * This model function is **required** if the `authorization_code` grant is used.
     * **Invoked during:**
     * - `authorization_code` grant
     *
     *
     * @async
     
   * @instance
     * @param authorizationCode {string} The authorization code to retrieve.
     * @return {Promise<AuthorizationCodeData>} An `Object` representing the authorization code and associated data.
     * @example
     * function getAuthorizationCode(authorizationCode) {
     *   // imaginary DB queries
     *   return db.queryAuthorizationCode({authorization_code: authorizationCode})
     *     .then(function(code) {
     *       if (!code) return [null];
     *       return Promise.all([
     *         code,
     *         db.queryClient({id: code.client_id}),
     *         db.queryUser({id: code.user_id})
     *       ]);
     *     })
     *     .then(function([code, client, user]) {
     *       if (!code) return false;
     *       return {
     *         authorizationCode: code.authorization_code,
     *         expiresAt: code.expires_at,
     *         redirectUri: code.redirect_uri,
     *         codeChallenge: code.code_challenge,
     *         codeChallengeMethod: code.code_challenge_method,
     *         scope: code.scope,
     *         client: client, // with 'id' property
     *         user: user
     *       };
     *     });
     * }
     */
  async getAuthorizationCode(authorizationCode) {
    throw new ServerError('getAuthorizationCode not implemented');
  }

  /**
     * Invoked to save an authorization code.
     * This model function is **required** if the `authorization_code` grant is used.
     *
     * **Invoked during:**
     * - `authorization_code` grant
     *
     * @async
     
   * @instance
     * @param code {object} The code to be saved.
     * @param code.authorizationCode {string} The authorization code to be saved.
     * @param code.expiresAt {Date} The expiry time of the authorization code.
     * @param code.redirectUri {string} The redirect URI associated with the authorization code.
     * @param [code.codeChallenge] {string} PKCE challenge; dropping it prevents PKCE exchange.
     * @param [code.codeChallengeMethod] {string} PKCE method; preserve when loading.
     * @param [code.scope] {string[]} The authorized scope of the authorization code.
     * @param client {ClientData} The client associated with the authorization code.
     * @param user {object} The user associated with the authorization code.
     * @return {Promise.<object>}
   * @fulfil {{ authorizationCode: string, expiresAt: Date, redirectUri: string,scope: string[],client: ClientData,user: object}} An `Object` representing the authorization code and associated data. `code.client` and `code.user` can carry additional properties that will be ignored by *oauth2-server*.
     * @example
     * function saveAuthorizationCode(code, client, user) {
     *   // imaginary DB queries
     *   let authCode = {
     *     authorization_code: code.authorizationCode,
     *     expires_at: code.expiresAt,
     *     redirect_uri: code.redirectUri,
     *     code_challenge: code.codeChallenge,
     *     code_challenge_method: code.codeChallengeMethod,
     *     scope: code.scope,
     *     client_id: client.id,
     *     user_id: user.id
     *   };
     *   return db.saveAuthorizationCode(authCode)
     *     .then(function(authorizationCode) {
     *       return {
     *         authorizationCode: authorizationCode.authorization_code,
     *         expiresAt: authorizationCode.expires_at,
     *         redirectUri: authorizationCode.redirect_uri,
     *         codeChallenge: authorizationCode.code_challenge,
     *         codeChallengeMethod: authorizationCode.code_challenge_method,
     *         scope: authorizationCode.scope,
     *         client: {id: authorizationCode.client_id},
     *         user: {id: authorizationCode.user_id}
     *       };
     *     });
     * }
     */
  async saveAuthorizationCode(code, client, user) {
    throw new ServerError('saveAuthorizationCode not implemented');
  }

  /**
     * Invoked to revoke a refresh token.
     * This model function is **required** if the `refresh_token` grant is used.
     * **Invoked during:**
     * - `refresh_token` grant (hook required even when rotation is disabled; invocation is skipped then)
     *
     * **Remarks:**
     * `token` is the refresh token object previously obtained through [Model#getRefreshToken](model.md#Model+getRefreshToken).
     *
     * @async
     
     * @param token {RefreshTokenData}
     * @return {Promise<boolean>} Return `true` if the revocation was successful or `false` if the refresh token could not be found.
     * @example
     * function revokeToken(token) {
     *   // imaginary DB queries
     *   return db.deleteRefreshToken({refresh_token: token.refreshToken})
     *     .then(function(refreshToken) {
     *       return !!refreshToken;
     *     });
     * }
     */
  async revokeToken(token) {
    throw new ServerError('revokeToken not implemented');
  }

  /**
   * Invoked to revoke an authorization code.
   * This model function is **required** if the `authorization_code` grant is used.
   *
   * **Invoked during:**
   * - `authorization_code` grant
   *
   * **Remarks:**
   * `code` is the authorization code object previously obtained through {@link Model#getAuthorizationCode}.
   *
   * @async
   * @method
   * @param code {AuthorizationCodeData}
   * @return {Promise<boolean>} Return `true` if the revocation was successful or `false` if the authorization code could not be found.
   */
  async revokeAuthorizationCode(code) {
    throw new ServerError('revokeAuthorizationCode not implemented');
  }

  /**
     * Invoked during request authentication to check if the provided access token was authorized the requested scopes.
     *
     * This model function is **required** if scopes are used with [OAuth2Server#authenticate](server.md#OAuth2Server+authenticate)
     * A custom `authenticateHandler` bypasses this hook only for `authorize`.
     * `OAuth2Server.authenticate` always uses built-in authentication.
     *
     * **Invoked during:**
     * - request authentication
     *
     * **Remarks:**
     * - `token` is the access token object previously obtained through [Model#getAccessToken](model.md#Model+getAccessToken).
     * - `scope` is the required scope as given to [OAuth2Server#authenticate](server.md#OAuth2Server+authenticate) as `options.scope`.
     *
     * @async
     
     * @param accessToken {AccessTokenData}
     * @param scope {string[]} The required scopes.
     * @return {Promise<boolean>} Returns `true` if the access token passes, `false` otherwise.
     * @example
     * function verifyScope(token, requestedScopes) {
     *   if (!token.scope) {
     *     return false;
     *   }
     *   let authorizedScopes = token.scope;
     *   return requestedScopes.every(s => authorizedScopes.includes(s));
     * }
     */
  async verifyScope(accessToken, scope) {
    throw new ServerError('verifyScope not implemented');
  }

  /*-------------------------------------------------------------------------
   | OPTIONAL
   *-------------------------------------------------------------------------
   | The following functions are entirely optional
   */

  /**
     * Invoked to generate a new access token.
     * This model function is **optional**.
     *
     * If not implemented, a default handler is used that generates access tokens consisting of 64 lowercase hexadecimal characters (`0..9a..f`), encoding 32 random bytes.
     * [RFC 6749 Appendix A.12](https://www.rfc-editor.org/rfc/rfc6749#appendix-A.12>) specifies that access tokens must consist of characters inside the range `0x20..0x7E` (i.e. only printable US-ASCII characters).
     *
     * **Invoked during:**
     * - `authorization_code` grant
     * - `client_credentials` grant
     * - `refresh_token` grant
     * - `password` grant
     *
     * **Remarks:**
     * - `client` is the object previously obtained through [Model#getClient](model.md#Model+getClient).
     * - `user` is the user object previously obtained through [Model#getAuthorizationCode](model.md#Model+getAuthorizationCode) (`code.user`; authorization code grant), [Model#getUserFromClient](model.md#Model+getUserFromClient) (client credentials grant), [Model#getRefreshToken](model.md#Model+getRefreshToken) (`token.user`; refresh token grant) or [Model#getUser](model.md#Model+getUser) (password grant).
     *
     * @async
     
     * @param client {object} The client the access token is generated for
     * @param user {object} The user the access token is generated for.
     * @param scope {string[]?} The scopes associated with the token. Can be `null`
     * @return {Promise.<string>} A `String` to be used as access token.
     */
  async generateAccessToken(client, user, scope) {
    throw new ServerError('generateAccessToken not implemented');
  }

  /**
     * Invoked to generate a new refresh token.
     *
     * This model function is **optional**. If not implemented, a default handler is used that generates refresh tokens consisting of 64 lowercase hexadecimal characters (`0..9a..f`), encoding 32 random bytes.
     * [RFC 6749 Appendix A.17](https://www.rfc-editor.org/6749#appendix-A.17) specifies that refresh tokens must consist of characters inside the range `0x20..0x7E` (i.e. only printable US-ASCII characters).
     *
     * **Invoked during:**
     *
     * - `authorization_code` grant
     * - `refresh_token` grant
     * - `password` grant
     *
     * **Remarks:**
     *
     * `client` is the object previously obtained through [Model#getClient](model.md#Model+getClient).
     *
     * `user` is the user object previously obtained through [Model#getAuthorizationCode](model.md#Model+getAuthorizationCode) (`code.user`; authorization code grant), [Model#getRefreshToken](model.md#Model+getRefreshToken) (`token.user`; refresh token grant) or [Model#getUser](model.md#Model+getUser) (password grant).
     *
     * @async
     
     * @param client {object} The client the refresh token is generated for
     * @param user {object} The user the refresh token is generated for.
     * @param scope {string[]?} The scopes associated with the refresh token. Can be `null`
     * @return {Promise<string>} A `String` to be used as refresh token.
     */
  async generateRefreshToken(client, user, scope) {
    throw new ServerError('generateRefreshToken not implemented');
  }

  /**
     * Invoked to generate a new authorization code.
     * This model function is **optional**. If not implemented, a default handler is used that generates authorization codes consisting of 64 lowercase hexadecimal characters (`0..9a..f`), encoding 32 random bytes.
     * [RFC 6749 Appendix A.11](https://www.rfc-editor.org/6749#appendix-A.11) specifies that authorization codes must consist of characters inside the range `0x20..0x7E` (i.e. only printable US-ASCII characters).
     *
     * **Invoked during:**
     * - `authorization_code` grant
     *>`
     *
     
     * @async
     * @param client {object} The client the authorization code is generated for.
     * @param user {object} The user the authorization code is generated for.
     * @param scope {string[]?} The scopes associated with the authorization code. Can be `null`.
     * @return {Promise<string>} A `String` to be used as authorization code.
     *
     */
  async generateAuthorizationCode(client, user, scope) {
    throw new ServerError('generateAuthorizationCode not implemented');
  }

  /**
     * Invoked to check if the requested `scope` is valid for a particular `client`/`user` combination.
     *
     * This model function is **optional**. If not implemented, any scope is accepted.
     *
     * **Invoked during:**
     *
     * - `authorization_code` grant
     * - `client_credentials` grant
     * - `password` grant
     *
     * **Remarks:**
     *
     * `user` is the user object previously obtained through [Model#getAuthorizationCode](model.md#Model+getAuthorizationCode) (`code.user`; authorization code grant), [Model#getUserFromClient](model.md#Model+getUserFromClient) (client credentials grant) or [Model#getUser](model.md#Model+getUser) (password grant).
     *
     * `client` is the object previously obtained through [Model#getClient](model.md#Model+getClient) (all grants).
     *
     * You can decide yourself whether you want to reject or accept partially valid scopes by simply filtering out invalid scopes and returning only the valid ones.
     * At the authorization endpoint, `user` comes from the custom authenticate handler
     * or the built-in bearer fallback; during code exchange it comes from the stored code.
     *
     * @async
     
     * @param user {object} The associated user.
     * @param client {ClientData} The associated client.
     * @param [scope] {string[]} The scopes to validate; omitted scope is undefined.
     * @return {Promise<string[]|null|undefined|false|0>} Accepted scope array, or a falsy rejection. Synchronous values are also supported. Returning `true` is not a usable scope; `verifyScope` has the separate boolean contract.
     * @example
     * // To reject invalid or only partially valid scopes:
     * const VALID_SCOPES = ['read', 'write'];
     * function validateScope(user, client, scope = []) {
     *   if (!scope.every(s => VALID_SCOPES.indexOf(s) >= 0)) {
     *     return false;
     *   }
     *   return scope;
     * }
     * @example
     * // To accept partially valid scopes:
     * const VALID_SCOPES = ['read', 'write'];
     * function validateScope(user, client, scope = []) {
     *   return scope.filter(s => VALID_SCOPES.indexOf(s) >= 0);
     * }
     */
  async validateScope(user, client, scope) {
    throw new ServerError('validateScope not implemented');
  }

  /**
     * Invoked to check if the provided `redirectUri` is valid for a particular `client`.
     * This model function is **optional**. If not implemented, the `redirectUri` should be included in the provided `redirectUris` of the client.
     *
     * **Invoked during:**
     * - `authorization_code` grant
     *
     * **Remarks:**
     * When implementing this method you should take care of possible security risks related to `redirectUri`.
     * See: https://datatracker.ietf.org/doc/html/rfc6819
     * (Section-5.2.3.5 is implemented by default).
     *
     * @async
     
     * @param redirectUri {string} The redirect URI to validate
     * @param client {object} The associated client.
     * @return {Promise<boolean>} Returns `true` if the `redirectUri` is valid, `false` otherwise.
     */
  async validateRedirectUri(redirectUri, client) {
    throw new ServerError('validateRedirectUri not implemented');
  }
}

module.exports = Model;

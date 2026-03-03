'use strict';

/*
 * Module dependencies.
 */
const AuthenticateHandler = require('./handlers/authenticate-handler');
const AuthorizeHandler = require('./handlers/authorize-handler');
const InvalidArgumentError = require('./errors/invalid-argument-error');
const RevokeHandler = require('./handlers/revoke-handler');
const TokenHandler = require('./handlers/token-handler');
// we require the model only for JSDoc linking
require('./model');

/**
 * @class
 * @classDesc The main OAuth2 server class.
 * @example
 * const OAuth2Server = require('@node-oauth/oauth2-server');
 */
class OAuth2Server {

  /**
   * Instantiates `OAuth2Server` using the supplied model.
   * **Remarks:**
   * - Any valid option for {@link OAuth2Server#authenticate}, {@link OAuth2Server#authorize} and {@link OAuth2Server#token} can be passed to the constructor as well.
   * - The supplied options will be used as default for the other methods.
   *
   * @constructor
   * @param options {object} Server options.
   * @param options.model {Model} The Model; this is always required.
   *
   * @param options.scope {string[]|undefined} The scope(s) to authenticate.
   * @param [options.addAcceptedScopesHeader=true] {boolean=} Set the `X-Accepted-OAuth-Scopes` HTTP header on response objects.
   * @param [options.addAuthorizedScopesHeader=true] {boolean=} Set the `X-OAuth-Scopes` HTTP header on response objects.
   * @param [options.allowBearerTokensInQueryString=false] {boolean=} Allow clients to pass bearer tokens in the query string of a request.
   *
   * @param options.authenticateHandler {object=} The authenticate handler (see remarks section).
   * @param options.authenticateHandler.handle {function} The actual handler function to get an authenticated user
   * @param [options.allowEmptyState=false] {boolean=} Allow clients to specify an empty `state
   * @param [options.authorizationCodeLifetime=300] {number=} Lifetime of generated authorization codes in seconds (default = 300 s = 5 min)
   *
   * @param [options.accessTokenLifetime=3600] {number=} Lifetime of generated access tokens in seconds (default = 1 hour).
   * @param [options.refreshTokenLifetime=1209600] {number=} Lifetime of generated refresh tokens in seconds (default = 2 weeks).
   * @param [options.allowExtendedTokenAttributes=false] {boolean=} Allow extended attributes to be set on the returned token (see remarks section).
   * @param [options.requireClientAuthentication=object] {object|boolean} Require a client secret for grant types (names as keys). Defaults to `true` for all grant types.
   * @param [options.alwaysIssueNewRefreshToken=true] {boolean=} Always revoke the used refresh token and issue a new one for the `refresh_token` grant.
   * @param [options.extendedGrantTypes=object] {object} Additional supported grant types.
   *
   * @throws {InvalidArgumentError} if the model is missing
   * @return {OAuth2Server} A new `OAuth2Server` instance.
   * @example
   * // Basic usage:
   * const oauth = new OAuth2Server({
   *   model: require('./model')
   * });
   * @example
   * // Advanced example with additional options:
   * const oauth = new OAuth2Server({
   *   model: require('./model'),
   *   allowBearerTokensInQueryString: true,
   *   accessTokenLifetime: 4 * 60 * 60
   * });
   */
  constructor (options) {
    options = options || {};

    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }

    this.options = options;
  }

  /**
   * Authenticates a request.
   * @function
   * @param options.scope {string[]|undefined} The scope(s) to authenticate.
   * @param [options.addAcceptedScopesHeader=true] {boolean=} Set the `X-Accepted-OAuth-Scopes` HTTP header on response objects.
   * @param [options.addAuthorizedScopesHeader=true] {boolean=} Set the `X-OAuth-Scopes` HTTP header on response objects.
   * @param [options.allowBearerTokensInQueryString=false] {boolean=} Allow clients to pass bearer tokens in the query string of a request.
   * @throws {UnauthorizedRequestError} The protected resource request failed authentication.
   * @return {Promise.<object>} A `Promise` that resolves to the access token object returned from the model's `getAccessToken`.
   *   In case of an error, the promise rejects with one of the error types derived from `OAuthError`.
   * @example
   * const oauth = new OAuth2Server({model: ...});
   * function authenticateHandler(options) {
   *   return function(req, res, next) {
   *     let request = new Request(req);
   *     let response = new Response(res);
   *     return oauth.authenticate(request, response, options)
   *       .then(function(token) {
   *         res.locals.oauth = {token: token};
   *         next();
   *       })
   *       .catch(function(err) {
   *         // handle error condition
   *       });
   *   }
   * }
   */
  authenticate (request, response, options) {
    options = Object.assign({
      addAcceptedScopesHeader: true,
      addAuthorizedScopesHeader: true,
      allowBearerTokensInQueryString: false
    }, this.options, options);

    return new AuthenticateHandler(options).handle(request, response);
  }

  /**
   * Authorizes a token request.
   * **Remarks:**
   *
   * If `request.query.allowed` equals the string `'false'` the access request is denied and the returned promise is rejected with an `AccessDeniedError`.
   *
   * In order to retrieve the user associated with the request, `options.authenticateHandler` should be supplied.
   * The `authenticateHandler` has to be an object implementing a `handle(request, response)` function that returns a user object.
   * If there is no associated user (i.e. the user is not logged in) a falsy value should be returned.
   *
   * ```js
   * let authenticateHandler = {
   *   handle: function(request, response) {
   *     return // get authenticated user;
   *   }
   * };
   * ```
   * When working with a session-based login mechanism, the handler can simply look like this:
   * ```js
   * let authenticateHandler = {
   *   handle: function(request, response) {
   *     return request.session.user;
   *   }
   * };
   * ```
   *
   * @function
   * @param request {Request} the Request instance object
   * @param request.query.allowed {string=} `'false'` to deny the authorization request (see remarks section).
   * @param response {Response} the Response instance object
   * @param options {object=} handler options
   * @param options.authenticateHandler {object=} The authenticate handler (see remarks section).
   * @param options.authenticateHandler.handle {function} The actual handler function to get an authenticated user
   * @param [options.allowEmptyState=false] {boolean=} Allow clients to specify an empty `state
   * @param [options.authorizationCodeLifetime=300] {number=} Lifetime of generated authorization codes in seconds (default = 300 s = 5 min)
   * @throws {AccessDeniedError} The resource owner denied the access request (i.e. `request.query.allow` was `'false'`).
   * @return {Promise.<object>} A `Promise` that resolves to the authorization code object returned from model's `saveAuthorizationCode`
   *   In case of an error, the promise rejects with one of the error types derived from `OAuthError`.
   * @example
   * const oauth = new OAuth2Server({model: ...});
   * function authorizeHandler(options) {
   *   return function(req, res, next) {
   *     let request = new Request(req);
   *     let response = new Response(res);
   *     return oauth.authorize(request, response, options)
   *       .then(function(code) {
   *         res.locals.oauth = {code: code};
   *         next();
   *       })
   *       .catch(function(err) {
   *         // handle error condition
   *       });
   *   }
   * }
   */
  authorize (request, response, options) {
    options = Object.assign({
      allowEmptyState: false,
      authorizationCodeLifetime: 5 * 60   // 5 minutes.
    }, this.options, options);

    return new AuthorizeHandler(options).handle(request, response);
  }

  /**
   * Retrieves a new token for an authorized token request.
   * **Remarks:**
   * If `options.allowExtendedTokenAttributes` is `true` any additional properties set on the object returned from `Model#saveToken() <Model#saveToken>` are copied to the token response sent to the client.
   * By default, all grant types require the client to send it's `client_secret` with the token request. `options.requireClientAuthentication` can be used to disable this check for selected grants. If used, this server option must be an object containing properties set to `true` or `false`. Possible keys for the object include all supported values for the token request's `grant_type` field (`authorization_code`, `client_credentials`, `password` and `refresh_token`). Grants that are not specified default to `true` which enables verification of the `client_secret`.
   * ```js
   * let options = {
   *   // ...
   *   // Allow token requests using the password grant to not include a client_secret.
   *   requireClientAuthentication: {password: false}
   * };
   * ```
   * `options.extendedGrantTypes` is an object mapping extension grant URIs to handler types, for example:
   * ```js
   * let options = {
   *   // ...
   *   extendedGrantTypes: {
   *     'urn:foo:bar:baz': MyGrantType
   *   }
   * };
   * ```
   * For information on how to implement a handler for a custom grant type see the extension grants.
   * @function
   * @param request {Request} the Request instance object
   * @param response {Response} the Response instance object
   * @param options {object=} handler options
   * @param [options.accessTokenLifetime=3600] {number=} Lifetime of generated access tokens in seconds (default = 1 hour).
   * @param [options.refreshTokenLifetime=1209600] {number=} Lifetime of generated refresh tokens in seconds (default = 2 weeks).
   * @param [options.allowExtendedTokenAttributes=false] {boolean=} Allow extended attributes to be set on the returned token (see remarks section).
   * @param [options.requireClientAuthentication=object] {object|boolean} Require a client secret for grant types (names as keys). Defaults to `true` for all grant types.
   * @param [options.alwaysIssueNewRefreshToken=true] {boolean=} Always revoke the used refresh token and issue a new one for the `refresh_token` grant.
   * @param [options.extendedGrantTypes=object] {object} Additional supported grant types.
   * @return {Promise.<object>} A `Promise` that resolves to the token object returned from the model's `saveToken` method.
   *   In case of an error, the promise rejects with one of the error types derived from `OAuthError`.
   * @throws {InvalidGrantError} The access token request was invalid or not authorized.
   * @example
   * const oauth = new OAuth2Server({model: ...});
   * function tokenHandler(options) {
   *   return function(req, res, next) {
   *     let request = new Request(req);
   *     let response = new Response(res);
   *     return oauth.token(request, response, options)
   *       .then(function(code) {
   *         res.locals.oauth = {token: token};
   *         next();
   *       })
   *       .catch(function(err) {
   *         // handle error condition
   *       });
   *   }
   * }
   */
  token (request, response, options) {
    options = Object.assign({
      accessTokenLifetime: 60 * 60,             // 1 hour.
      refreshTokenLifetime: 60 * 60 * 24 * 14,  // 2 weeks.
      allowExtendedTokenAttributes: false,
      requireClientAuthentication: {}           // defaults to true for all grant types
    }, this.options, options);

    return new TokenHandler(options).handle(request, response);
  }

  /**
   * Revokes an access or refresh token, as defined in RFC 7009.
   * @param request {Request}
   * @param response {Response}
   * @return {Promise<void>}
   */
  revoke (request, response) {
    return new RevokeHandler(this.options).handle(request, response);
  }
}

module.exports = OAuth2Server;

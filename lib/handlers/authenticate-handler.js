'use strict';

/**
 * Module dependencies.
 */

const InvalidArgumentError = require('../errors/invalid-argument-error');
const InvalidRequestError = require('../errors/invalid-request-error');
const InsufficientScopeError = require('../errors/insufficient-scope-error');
const InvalidTokenError = require('../errors/invalid-token-error');
const OAuthError = require('../errors/oauth-error');
const Request = require('../request');
const Response = require('../response');
const ServerError = require('../errors/server-error');
const UnauthorizedRequestError = require('../errors/unauthorized-request-error');

/**
 * Constructor.
 */

function AuthenticateHandler(options) {
  options = options || {};

  if (!options.model) {
    throw new InvalidArgumentError('Missing parameter: `model`');
  }

  if (!options.model.getAccessToken) {
    throw new InvalidArgumentError('Invalid argument: model does not implement `getAccessToken()`');
  }

  if (options.scope && undefined === options.addAcceptedScopesHeader) {
    throw new InvalidArgumentError('Missing parameter: `addAcceptedScopesHeader`');
  }

  if (options.scope && undefined === options.addAuthorizedScopesHeader) {
    throw new InvalidArgumentError('Missing parameter: `addAuthorizedScopesHeader`');
  }

  if (options.scope && !options.model.verifyScope) {
    throw new InvalidArgumentError('Invalid argument: model does not implement `verifyScope()`');
  }

  this.addAcceptedScopesHeader = options.addAcceptedScopesHeader;
  this.addAuthorizedScopesHeader = options.addAuthorizedScopesHeader;
  this.allowBearerTokensInQueryString = options.allowBearerTokensInQueryString;
  this.model = options.model;
  this.scope = options.scope;
}

/**
 * Authenticate Handler.
 */
AuthenticateHandler.prototype.handle = async function(request, response) {

  if (!(request instanceof Request)) {
    throw new InvalidArgumentError('Invalid argument: `request` must be an instance of Request');
  }

  if (!(response instanceof Response)) {
    throw new InvalidArgumentError('Invalid argument: `response` must be an instance of Response');
  }

  function errorHandler (err) {
    // Include the "WWW-Authenticate" response header field if the client
    // lacks any authentication information.
    //
    // @see https://tools.ietf.org/html/rfc6750#section-3.1
    if (err instanceof UnauthorizedRequestError) {
      response.set('WWW-Authenticate', 'Bearer realm="Service"');
    }

    if (!(err instanceof OAuthError)) {
      return Promise.reject( new ServerError(err) );
    }

    return Promise.reject( err );

  }

  let requestToken,
    accessToken;

  try {
    requestToken = await this.getTokenFromRequest.call(this, request);
  } catch (err) {
    return errorHandler(err);
  }

  try {
    accessToken = await this.getAccessToken.call(this, requestToken);
  } catch (err) {
    return errorHandler(err);
  }

  try {
    await this.validateAccessToken.call(this, accessToken);
  } catch (err) {
    return errorHandler(err);
  }

  if (this.scope) {
    try {
      await this.verifyScope.call(this, accessToken);
    } catch (err) {
      return errorHandler(err);
    }
  }

  try {
    await this.updateResponse.call(this, response, accessToken);
  } catch (err) {
    return errorHandler(err);
  }

  return Promise.resolve(accessToken);

};

/**
 * Get the token from the header or body, depending on the request.
 *
 * "Clients MUST NOT use more than one method to transmit the token in each request."
 *
 * @see https://tools.ietf.org/html/rfc6750#section-2
 */
AuthenticateHandler.prototype.getTokenFromRequest = function(request) {
  
  const headerToken = request.get('Authorization');
  const queryToken = request.query.access_token;
  const bodyToken = request.body.access_token;

  if (!!headerToken + !!queryToken + !!bodyToken > 1) {
    return Promise.reject(
      new InvalidRequestError('Invalid request: only one authentication method is allowed')
    );
  }

  if (headerToken) {
    return this.getTokenFromRequestHeader(request);
  }

  if (queryToken) {
    return this.getTokenFromRequestQuery(request);
  }

  if (bodyToken) {
    return this.getTokenFromRequestBody(request);
  }

  return Promise.reject(
    new UnauthorizedRequestError('Unauthorized request: no authentication given')
  );

};

/**
 * Get the token from the request header.
 *
 * @see http://tools.ietf.org/html/rfc6750#section-2.1
 */

AuthenticateHandler.prototype.getTokenFromRequestHeader = function(request) {
  const token = request.get('Authorization');
  const matches = token.match(/Bearer\s(\S+)/);

  if (!matches) {
    throw new InvalidRequestError('Invalid request: malformed authorization header');
  }

  return matches[1];
};

/**
 * Get the token from the request query.
 *
 * "Don't pass bearer tokens in page URLs:  Bearer tokens SHOULD NOT be passed in page
 * URLs (for example, as query string parameters). Instead, bearer tokens SHOULD be
 * passed in HTTP message headers or message bodies for which confidentiality measures
 * are taken. Browsers, web servers, and other software may not adequately secure URLs
 * in the browser history, web server logs, and other data structures. If bearer tokens
 * are passed in page URLs, attackers might be able to steal them from the history data,
 * logs, or other unsecured locations."
 *
 * @see http://tools.ietf.org/html/rfc6750#section-2.3
 */

AuthenticateHandler.prototype.getTokenFromRequestQuery = function(request) {
  if (!this.allowBearerTokensInQueryString) {
    throw new InvalidRequestError('Invalid request: do not send bearer tokens in query URLs');
  }

  return request.query.access_token;
};

/**
 * Get the token from the request body.
 *
 * "The HTTP request method is one for which the request-body has defined semantics.
 * In particular, this means that the "GET" method MUST NOT be used."
 *
 * @see http://tools.ietf.org/html/rfc6750#section-2.2
 */

AuthenticateHandler.prototype.getTokenFromRequestBody = function(request) {
  if (request.method === 'GET') {
    throw new InvalidRequestError('Invalid request: token may not be passed in the body when using the GET verb');
  }

  if (!request.is('application/x-www-form-urlencoded')) {
    throw new InvalidRequestError('Invalid request: content must be application/x-www-form-urlencoded');
  }

  return request.body.access_token;
};

/**
 * Get the access token from the model.
 */

AuthenticateHandler.prototype.getAccessToken = async function(token) {

  let accessToken;

  try {
    accessToken = await this.model.getAccessToken.call(this.model, token);
  } catch (err) {
    return Promise.reject(err);
  }

  if (!accessToken) {
    throw new InvalidTokenError('Invalid token: access token is invalid');
  }

  if (!accessToken.user) {
    throw new ServerError('Server error: `getAccessToken()` did not return a `user` object');
  }

  return accessToken;

};

/**
 * Validate access token.
 */

AuthenticateHandler.prototype.validateAccessToken = function(accessToken) {

  if (!(accessToken.accessTokenExpiresAt instanceof Date)) {
    throw new ServerError('Server error: `accessTokenExpiresAt` must be a Date instance');
  }

  if (accessToken.accessTokenExpiresAt < new Date()) {
    throw new InvalidTokenError('Invalid token: access token has expired');
  }

  return accessToken;

};

/**
 * Verify scope.
 */

AuthenticateHandler.prototype.verifyScope = async function(accessToken) {

  let scope;

  try {
    scope = await this.model.verifyScope.call(this.model, accessToken, this.scope);
  } catch (err) {
    return Promise.reject(err);
  }

  if (!scope) {
    return Promise.reject(
      new InsufficientScopeError('Insufficient scope: authorized scope is insufficient')
    );
  }

  return Promise.resolve(scope);

};

/**
 * Update response.
 */

AuthenticateHandler.prototype.updateResponse = function(response, accessToken) {
  if (this.scope && this.addAcceptedScopesHeader) {
    response.set('X-Accepted-OAuth-Scopes', this.scope);
  }

  if (this.scope && this.addAuthorizedScopesHeader) {
    response.set('X-OAuth-Scopes', accessToken.scope);
  }
};

/**
 * Export constructor.
 */

module.exports = AuthenticateHandler;

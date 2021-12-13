'use strict';

/**
 * Module dependencies.
 */

const AccessDeniedError = require('../errors/access-denied-error');
const AuthenticateHandler = require('../handlers/authenticate-handler');
const InvalidArgumentError = require('../errors/invalid-argument-error');
const InvalidClientError = require('../errors/invalid-client-error');
const InvalidRequestError = require('../errors/invalid-request-error');
const InvalidScopeError = require('../errors/invalid-scope-error');
const UnsupportedResponseTypeError = require('../errors/unsupported-response-type-error');
const OAuthError = require('../errors/oauth-error');
const Request = require('../request');
const Response = require('../response');
const ServerError = require('../errors/server-error');
const UnauthorizedClientError = require('../errors/unauthorized-client-error');
const is = require('../validator/is');
const tokenUtil = require('../utils/token-util');
const url = require('url');

/**
 * Response types.
 */

const responseTypes = {
  code: require('../response-types/code-response-type'),
  //token: require('../response-types/token-response-type')
};

/**
 * Constructor.
 */

function AuthorizeHandler(options) {
  options = options || {};

  if (options.authenticateHandler && !options.authenticateHandler.handle) {
    throw new InvalidArgumentError('Invalid argument: authenticateHandler does not implement `handle()`');
  }

  if (!options.authorizationCodeLifetime) {
    throw new InvalidArgumentError('Missing parameter: `authorizationCodeLifetime`');
  }

  if (!options.model) {
    throw new InvalidArgumentError('Missing parameter: `model`');
  }

  if (!options.model.getClient) {
    throw new InvalidArgumentError('Invalid argument: model does not implement `getClient()`');
  }

  if (!options.model.saveAuthorizationCode) {
    throw new InvalidArgumentError('Invalid argument: model does not implement `saveAuthorizationCode()`');
  }

  this.allowEmptyState = options.allowEmptyState;
  this.authenticateHandler = options.authenticateHandler || new AuthenticateHandler(options);
  this.authorizationCodeLifetime = options.authorizationCodeLifetime;
  this.model = options.model;
}

/**
 * Authorize Handler.
 */

AuthorizeHandler.prototype.handle = async function(request, response) {

  if (!(request instanceof Request)) {
    return Promise.reject(
      new InvalidArgumentError('Invalid argument: `request` must be an instance of Request')
    );
  }

  if (!(response instanceof Response)) {
    return Promise.reject(
      new InvalidArgumentError('Invalid argument: `response` must be an instance of Response')
    );
  }

  if ('false' === request.query.allowed) {
    return Promise.reject(
      new AccessDeniedError('Access denied: user denied access to application')
    );
  }

  const fns = [
    this.getAuthorizationCodeLifetime(),
    this.getClient(request),
    this.getUser(request, response)
  ];

  let res;

  try {
    res = await Promise.all(fns);
  } catch (err) {
    return Promise.reject(err);
  }

  if (!res || !res.length === 3) {
    return Promise.reject( new ServerError() );
  }

  const expiresAt = res[0];
  const client = res[1];
  const user = res[2];
  const errorHandler = (err) => {

    if (!(err instanceof OAuthError)) {
      err = new ServerError();
    }
    const redirectUri = this.buildErrorRedirectUri(uri, err);

    this.updateResponse(response, redirectUri, state);

    return Promise.reject(err);

  };

  let uri,
    scope,
    scopeIsValid,
    authorizationCode,
    state,
    ResponseType,
    code;

  try {
    uri = this.getRedirectUri(request, client);
  } catch (err) {
    return errorHandler(err);
  } 

  try {
    state = this.getState(request);
  } catch (err) {
    return errorHandler(err);
  }

  try {
    scope = this.getScope(request);
  } catch (err) {
    return errorHandler(err);
  }

  try {
    ResponseType = this.getResponseType(request);
  } catch (err) {
    return errorHandler(err);
  }

  if(request.query.allowed === 'false') {
    return Promise.reject(
      new AccessDeniedError('Access denied: user denied access to application')
    );
  }

  try {
    scopeIsValid = await this.validateScope(
      user,
      client,
      scope,
    );
  } catch (err) {
    return errorHandler(err);
  }

  try {
    authorizationCode = await this.generateAuthorizationCode(
      client, user, scopeIsValid );
  } catch (err) {
    return errorHandler(err);
  }

  try {
    code = await this.saveAuthorizationCode(
      authorizationCode, expiresAt, scope, client, uri, user);    
  } catch (err) {
    return errorHandler(err);
  }

  const responseType = new ResponseType(code.authorizationCode);
  const redirectUri = this.buildSuccessRedirectUri(uri, responseType);

  this.updateResponse(response, redirectUri, state);

  return Promise.resolve(code);

};

/**
 * Generate authorization code.
 */

AuthorizeHandler.prototype.generateAuthorizationCode = function(client, user, scope) {
 
  if (this.model.generateAuthorizationCode) {
    return this.model.generateAuthorizationCode.call(this.model, client, user, scope);
  }

  return tokenUtil.generateRandomToken();

};

/**
 * Get authorization code lifetime.
 */

AuthorizeHandler.prototype.getAuthorizationCodeLifetime = function() {

  const expires = new Date();

  expires.setSeconds(expires.getSeconds() + this.authorizationCodeLifetime);

  return expires;

};

/**
 * Get the client from the model.
 */

AuthorizeHandler.prototype.getClient = async function(request) {

  const clientId = request.body.client_id || request.query.client_id;

  if (!clientId) {
    return Promise.reject(
      new InvalidRequestError('Missing parameter: `client_id`')
    );
  }

  if (!is.vschar(clientId)) {
    return Promise.reject(
      new InvalidRequestError('Invalid parameter: `client_id`')
    );
  }

  const redirectUri = request.body.redirect_uri || request.query.redirect_uri;

  if (redirectUri && !is.uri(redirectUri)) {
    return Promise.reject(
      new InvalidRequestError('Invalid request: `redirect_uri` is not a valid URI')
    );
  }

  let client;

  try {
    client = await this.model.getClient.call(this.model, clientId, null);
  } catch (err) {
    return Promise.reject(err);
  }

  if (!client) {
    return Promise.reject(
      new InvalidClientError('Invalid client: client credentials are invalid')
    );
  }

  if (!client.grants) {
    return Promise.reject(
      new InvalidClientError('Invalid client: missing client `grants`')
    );
  }

  if (!Array.isArray(client.grants) || !client.grants.includes('authorization_code')) {
    return Promise.reject(
      new UnauthorizedClientError('Unauthorized client: `grant_type` is invalid')
    );
  }

  if (!client.redirectUris || 0 === client.redirectUris.length) {
    return Promise.reject(
      new InvalidClientError('Invalid client: missing client `redirectUri`')
    );
  }

  if (redirectUri && !client.redirectUris.includes(redirectUri)) {
    return Promise.reject(
      new InvalidClientError('Invalid client: `redirect_uri` does not match client value')
    );
  }

  return Promise.resolve(client);

};

/**
 * Validate requested scope.
 */

AuthorizeHandler.prototype.validateScope = async function(user, client, scope) {

  if (this.model.validateScope) {

    let isValid;

    try {
      isValid = await this.model.validateScope
        .call(this.model, user, client, scope);
    } catch (err) {
      return Promise.reject(err);
    }

    // TODO: fix documentation: "Returns true if the access token passes, false otherwise."
    // should say "returns true if the access token is valid, Error otherwise."
    // https://oauth2-server.readthedocs.io/en/latest/model/spec.html#validatescope-user-client-scope-callback
    if (!isValid) {
      return Promise.reject( new InvalidScopeError('Invalid scope: Requested scope is invalid') );
    }

    return isValid;

  }

  // REVIEW: This should always be true
  // from docs: "If not implemented, any scope is accepted."
  return Promise.resolve(true);

};

/**
 * Get scope from the request.
 */

AuthorizeHandler.prototype.getScope = function(request) {

  const scope = request.body.scope || request.query.scope;

  if (!is.nqschar(scope)) {
    throw new InvalidScopeError('Invalid parameter: `scope`');
  }

  return scope;

};

/**
 * Get state from the request.
 */

AuthorizeHandler.prototype.getState = function(request) {

  const state = request.body.state || request.query.state;

  const stateExists = state && state.length > 0;

  const stateIsValid = stateExists
    ? is.vschar(state)
    : this.allowEmptyState;

  if (!stateIsValid) {
    const message = (!stateExists) ? 'Missing' : 'Invalid';
    throw new InvalidRequestError(`${message} parameter: \`state\``);
  }

  return state;

};

/**
 * Get user by calling the authenticate middleware.
 */

AuthorizeHandler.prototype.getUser = async function(request, response) {

  let user;

  if (this.authenticateHandler instanceof AuthenticateHandler) {

    let res;

    try {
      res = await this.authenticateHandler.handle(request, response);
    } catch (err) {
      return Promise.reject(err);
    }

    if ( !res || !res.user ) {
      return Promise.reject( 
        new ServerError('Server error: `handle()` did not return a `user` object')
      );
    }

    return Promise.resolve(res.user);

  } 

  try {
    user = await this.authenticateHandler.handle(request, response);
  } catch (err) {
    return Promise.reject(err);
  }

  if (!user) {
    return Promise.reject( 
      new ServerError('Server error: `handle()` did not return a `user` object')
    );
  }

  return Promise.resolve(user);

};

/**
 * Get redirect URI.
 */

AuthorizeHandler.prototype.getRedirectUri = function(request, client) {

  return request.body.redirect_uri || 
    request.query.redirect_uri ||
    client.redirectUris[0];

};

/**
 * Save authorization code.
 */

AuthorizeHandler.prototype.saveAuthorizationCode = 
  function(authorizationCode, expiresAt, scope, client, redirectUri, user) {

    const code = {
      authorizationCode: authorizationCode,
      expiresAt: expiresAt,
      redirectUri: redirectUri,
      scope: scope
    };

    return this.model.saveAuthorizationCode.call(this.model, code, client, user);

  };

/**
 * Get response type.
 */

AuthorizeHandler.prototype.getResponseType = function(request) {
  
  const responseType = request.body.response_type || request.query.response_type;

  if (!responseType) {
    throw new InvalidRequestError('Missing parameter: `response_type`');
  }

  if ( !Object.prototype.hasOwnProperty.call(responseTypes, responseType) ) {
    throw new UnsupportedResponseTypeError('Unsupported response type: `response_type` is not supported');
  }

  return responseTypes[responseType];

};

/**
 * Build a successful response that redirects the user-agent to the client-provided url.
 */

AuthorizeHandler.prototype.buildSuccessRedirectUri = function(redirectUri, responseType) {
  return responseType.buildRedirectUri(redirectUri);
};

/**
 * Build an error response that redirects the user-agent to the client-provided url.
 */

AuthorizeHandler.prototype.buildErrorRedirectUri = function(redirectUri, error) {
  const uri = url.parse(redirectUri);

  uri.query = {
    error: error.name
  };

  if (error.message) {
    uri.query.error_description = error.message;
  }

  return uri;
};

/**
 * Update response with the redirect uri and the state parameter, if available.
 */

AuthorizeHandler.prototype.updateResponse = function(response, redirectUri, state) {
  
  redirectUri.query = redirectUri.query || {};

  if (state) {
    redirectUri.query.state = state;
  }

  response.redirect(url.format(redirectUri));

};

/**
 * Export constructor.
 */

module.exports = AuthorizeHandler;

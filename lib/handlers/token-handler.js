'use strict';

/**
 * Module dependencies.
 */

const BearerTokenType = require('../token-types/bearer-token-type');
const InvalidArgumentError = require('../errors/invalid-argument-error');
const InvalidClientError = require('../errors/invalid-client-error');
const InvalidRequestError = require('../errors/invalid-request-error');
const OAuthError = require('../errors/oauth-error');
const Request = require('../request');
const Response = require('../response');
const ServerError = require('../errors/server-error');
const TokenModel = require('../models/token-model');
const UnauthorizedClientError = require('../errors/unauthorized-client-error');
const UnsupportedGrantTypeError = require('../errors/unsupported-grant-type-error');
const auth = require('basic-auth');
const is = require('../validator/is');

/**
 * Grant types.
 */

const grantTypes = {
  authorization_code: require('../grant-types/authorization-code-grant-type'),
  client_credentials: require('../grant-types/client-credentials-grant-type'),
  password: require('../grant-types/password-grant-type'),
  refresh_token: require('../grant-types/refresh-token-grant-type')
};

/**
 * Constructor.
 */

function TokenHandler(options) {
  options = options || {};

  if (!options.accessTokenLifetime) {
    throw new InvalidArgumentError('Missing parameter: `accessTokenLifetime`');
  }

  if (!options.model) {
    throw new InvalidArgumentError('Missing parameter: `model`');
  }

  if (!options.refreshTokenLifetime) {
    throw new InvalidArgumentError('Missing parameter: `refreshTokenLifetime`');
  }

  if (!options.model.getClient) {
    throw new InvalidArgumentError('Invalid argument: model does not implement `getClient()`');
  }

  this.accessTokenLifetime = options.accessTokenLifetime;
  this.grantTypes = Object.assign({}, grantTypes, options.extendedGrantTypes);
  this.model = options.model;
  this.refreshTokenLifetime = options.refreshTokenLifetime;
  this.allowExtendedTokenAttributes = options.allowExtendedTokenAttributes;
  this.requireClientAuthentication = options.requireClientAuthentication || {};
  this.alwaysIssueNewRefreshToken = options.alwaysIssueNewRefreshToken !== false;
}

/**
 * Token Handler.
 */

TokenHandler.prototype.handle = async function(request, response) {

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

  if (request.method !== 'POST') {
    return Promise.reject(
      new InvalidRequestError('Invalid request: method must be POST')
    );
  }

  if (!request.is('application/x-www-form-urlencoded')) {
    return Promise.reject(
      new InvalidRequestError('Invalid request: content must be application/x-www-form-urlencoded')
    );
  }

  const errorHandler = (err) => {

    if (!(err instanceof OAuthError)) {
      err = new ServerError(err);
    }

    this.updateErrorResponse(response, err);

    return Promise.reject(err);
  };

  let client,
    data,
    tokenType;

  try {
    client = await this.getClient(request, response);
  } catch (err) {
    return errorHandler(err);
  }

  if (!client) {
    return errorHandler();
  }

  try {
    data = await this.handleGrantType(request, client);
  } catch (err) {
    return errorHandler(err);
  }

  if (!data) {
    return errorHandler();
  }

  const model = new TokenModel(data, {
    allowExtendedTokenAttributes:
    this.allowExtendedTokenAttributes
  });

  try {
    tokenType = this.getTokenType(model);
  } catch (err) {
    return errorHandler(err);
  }

  if (!tokenType) {
    return errorHandler();
  }

  try {
    this.updateSuccessResponse(response, tokenType);
  } catch (err) {
    return errorHandler(err);
  }

  return Promise.resolve(data);

};

/**
 * Get the client from the model.
 */

TokenHandler.prototype.getClient = async function(request, response) {

  const credentials = this.getClientCredentials(request);

  const grantType = request.body.grant_type;

  if (!credentials.clientId) {
    return Promise.reject(
      new InvalidRequestError('Missing parameter: `client_id`')
    );
  }

  if (this.isClientAuthenticationRequired(grantType) && !credentials.clientSecret) {
    return Promise.reject(
      new InvalidRequestError('Missing parameter: `client_secret`')
    );
  }

  if (!is.vschar(credentials.clientId)) {
    return Promise.reject(
      new InvalidRequestError('Invalid parameter: `client_id`')
    );
  }

  if (credentials.clientSecret && !is.vschar(credentials.clientSecret)) {
    return Promise.reject(
      new InvalidRequestError('Invalid parameter: `client_secret`')
    );
  }

  function errorHandler(err) {
    // Include the "WWW-Authenticate" response header field if the client
    // attempted to authenticate via the "Authorization" request header.
    //
    // @see https://tools.ietf.org/html/rfc6749#section-5.2.
    if ((err instanceof InvalidClientError) && request.get('authorization')) {
      response.set('WWW-Authenticate', 'Basic realm="Service"');

      return Promise.reject( new InvalidClientError(err, { code: 401 }) );
    }

    return Promise.reject(err);
  }

  let client;

  try {
    client = await this.model.getClient.call(
      this.model, credentials.clientId, credentials.clientSecret );
  } catch (err) {
    return errorHandler(err);
  }

  if (!client) {
    return errorHandler(
      new InvalidClientError('Invalid client: client is invalid')
    );
  }

  if (!client.grants) {
    return errorHandler(
      new ServerError('Server error: missing client `grants`')
    );
  }

  if (!(client.grants instanceof Array)) {
    return errorHandler(
      new ServerError('Server error: `grants` must be an array')
    );
  }

  return Promise.resolve(client);

};

/**
 * Get client credentials.
 *
 * The client credentials may be sent using the HTTP Basic authentication scheme or, alternatively,
 * the `client_id` and `client_secret` can be embedded in the body.
 *
 * @see https://tools.ietf.org/html/rfc6749#section-2.3.1
 */

TokenHandler.prototype.getClientCredentials = function(request) {

  const credentials = auth(request);

  const grantType = request.body.grant_type;

  if (credentials) {
    return { clientId: credentials.name, clientSecret: credentials.pass };
  }

  if (request.body.client_id && request.body.client_secret) {
    return { clientId: request.body.client_id, clientSecret: request.body.client_secret };
  }

  if (!this.isClientAuthenticationRequired(grantType)) {
    if(request.body.client_id) {
      return { clientId: request.body.client_id };
    }
  }

  throw new InvalidClientError('Invalid client: cannot retrieve client credentials');
};

/**
 * Handle grant type.
 */

TokenHandler.prototype.handleGrantType = function(request, client) {
  
  const grantType = request.body.grant_type;

  if (!grantType) {
    throw new InvalidRequestError('Missing parameter: `grant_type`');
  }

  if (!is.nchar(grantType) && !is.uri(grantType)) {
    throw new InvalidRequestError('Invalid parameter: `grant_type`');
  }

  if (!Object.prototype.hasOwnProperty.call(this.grantTypes, grantType)) {
    throw new UnsupportedGrantTypeError('Unsupported grant type: `grant_type` is invalid');
  }

  if (!Array.isArray(client.grants) || !client.grants.includes(grantType)) {
    throw new UnauthorizedClientError('Unauthorized client: `grant_type` is invalid');
  }

  const accessTokenLifetime = this.getAccessTokenLifetime(client);
  const refreshTokenLifetime = this.getRefreshTokenLifetime(client);
  const Type = this.grantTypes[grantType];

  const options = {
    accessTokenLifetime: accessTokenLifetime,
    model: this.model,
    refreshTokenLifetime: refreshTokenLifetime,
    alwaysIssueNewRefreshToken: this.alwaysIssueNewRefreshToken
  };

  return new Type(options)
    .handle(request, client);
};

/**
 * Get access token lifetime.
 */

TokenHandler.prototype.getAccessTokenLifetime = function(client) {
  return client.accessTokenLifetime || this.accessTokenLifetime;
};

/**
 * Get refresh token lifetime.
 */

TokenHandler.prototype.getRefreshTokenLifetime = function(client) {
  return client.refreshTokenLifetime || this.refreshTokenLifetime;
};

/**
 * Get token type.
 */

TokenHandler.prototype.getTokenType = function(model) {

  return new BearerTokenType(
    model.accessToken,
    model.accessTokenLifetime,
    model.refreshToken,
    model.scope,
    model.customAttributes
  );

};

/**
 * Update response when a token is generated.
 */

TokenHandler.prototype.updateSuccessResponse = function(response, tokenType) {

  response.body = tokenType.valueOf();

  response.set('Cache-Control', 'no-store');

  response.set('Pragma', 'no-cache');

};

/**
 * Update response when an error is thrown.
 */

TokenHandler.prototype.updateErrorResponse = function(response, error) {
  
  response.body = {
    error: error.name,
    error_description: error.message
  };

  response.status = error.code;
};

/**
 * Given a grant type, check if client authentication is required
 */
TokenHandler.prototype.isClientAuthenticationRequired = function(grantType) {

  if (Object.keys(this.requireClientAuthentication).length > 0) {

    return (typeof this.requireClientAuthentication[grantType] !== 'undefined') 
      ? this.requireClientAuthentication[grantType] : true;

  } else {

    return true;

  }

};

/**
 * Export constructor.
 */

module.exports = TokenHandler;

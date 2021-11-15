'use strict';

/**
 * Module dependencies.
 */

const AbstractGrantType = require('./abstract-grant-type');
const InvalidArgumentError = require('../errors/invalid-argument-error');
const InvalidGrantError = require('../errors/invalid-grant-error');
const InvalidRequestError = require('../errors/invalid-request-error');
const ServerError = require('../errors/server-error');
const is = require('../validator/is');
const {inherits} = require('util');

/**
 * Constructor.
 */

function AuthorizationCodeGrantType(options) {
  options = options || {};

  if (!options.model) {
    throw new InvalidArgumentError('Missing parameter: `model`');
  }

  if (!options.model.getAuthorizationCode) {
    throw new InvalidArgumentError('Invalid argument: model does not implement `getAuthorizationCode()`');
  }

  if (!options.model.revokeAuthorizationCode) {
    throw new InvalidArgumentError('Invalid argument: model does not implement `revokeAuthorizationCode()`');
  }

  if (!options.model.saveToken) {
    throw new InvalidArgumentError('Invalid argument: model does not implement `saveToken()`');
  }

  AbstractGrantType.call(this, options);
}

/**
 * Inherit prototype.
 */

inherits(AuthorizationCodeGrantType, AbstractGrantType);

/**
 * Handle authorization code grant.
 *
 * @see https://tools.ietf.org/html/rfc6749#section-4.1.3
 */
AuthorizationCodeGrantType.prototype.handle = async function(request, client) {
  
  if (!request) {
    return Promise.reject(
      new InvalidArgumentError('Missing parameter: `request`')
    );
  }

  if (!client) {
    return Promise.reject(
      new InvalidArgumentError('Missing parameter: `client`')
    );
  }

  let code;

  try {
    code = await this.getAuthorizationCode(request, client);
  } catch (err) {
    return Promise.reject(err);
  }

  try {
    await this.validateRedirectUri(request, code);
  } catch (err) {
    return Promise.reject(err);
  }

  try {
    await this.revokeAuthorizationCode(code);
  } catch (err) {
    return Promise.reject(err);
  }


  return this.saveToken(code.user, client, code.authorizationCode, code.scope);

};

/**
 * Get the authorization code.
 */

AuthorizationCodeGrantType.prototype.getAuthorizationCode = async function(request, client) {

  if (!request.body.code) {
    throw new InvalidRequestError('Missing parameter: `code`');
  }

  if (!is.vschar(request.body.code)) {
    throw new InvalidRequestError('Invalid parameter: `code`');
  }
  let code;

  try {
    code = await this.model.getAuthorizationCode.call(this.model, request.body.code);
  } catch (err) {
    return Promise.reject(err);
  }

  // console.log(code);

  
  if (!code) {
    return Promise.reject(
      new InvalidGrantError('Invalid grant: authorization code is invalid') 
    );
  }

  if (!code.client) {
    return Promise.reject(
      new ServerError('Server error: `getAuthorizationCode()` did not return a `client` object') 
    );
  }

  if (!code.user) {
    return Promise.reject(
      new ServerError('Server error: `getAuthorizationCode()` did not return a `user` object') 
    );
  }

  if (code.client.id !== client.id) {
    return Promise.reject(
      new InvalidGrantError('Invalid grant: authorization code is invalid') 
    );
  }

  if (!(code.expiresAt instanceof Date)) {
    return Promise.reject(
      new ServerError('Server error: `expiresAt` must be a Date instance') 
    );
  }

  if (code.expiresAt < new Date()) {
    return Promise.reject(
      new InvalidGrantError('Invalid grant: authorization code has expired') 
    );
  }

  if (code.redirectUri && !is.uri(code.redirectUri)) {
    return Promise.reject(
      new InvalidGrantError('Invalid grant: `redirect_uri` is not a valid URI') 
    );
  }

  return Promise.resolve(code);

};

/**
 * Validate the redirect URI.
 *
 * "The authorization server MUST ensure that the redirect_uri parameter is
 * present if the redirect_uri parameter was included in the initial
 * authorization request as described in Section 4.1.1, and if included
 * ensure that their values are identical."
 *
 * @see https://tools.ietf.org/html/rfc6749#section-4.1.3
 */

AuthorizationCodeGrantType.prototype.validateRedirectUri = function(request, code) {

  if (!code.redirectUri) {
    return;
  }

  const redirectUri = request.body.redirect_uri || request.query.redirect_uri;

  if (!is.uri(redirectUri)) {
    throw new InvalidRequestError('Invalid request: `redirect_uri` is not a valid URI');
  }

  if (redirectUri !== code.redirectUri) {
    throw new InvalidRequestError('Invalid request: `redirect_uri` is invalid');
  }

};

/**
 * Revoke the authorization code.
 *
 * "The authorization code MUST expire shortly after it is issued to mitigate
 * the risk of leaks. [...] If an authorization code is used more than once,
 * the authorization server MUST deny the request."
 *
 * @see https://tools.ietf.org/html/rfc6749#section-4.1.2
 */

AuthorizationCodeGrantType.prototype.revokeAuthorizationCode = async function(code) {

  let status;

  try {
    status = await this.model.revokeAuthorizationCode.call(this.model, code);
  } catch (err) {
    return Promise.reject(err);
  }

  if (!status) {
    return Promise.reject(
      new InvalidGrantError('Invalid grant: authorization code is invalid')
    );
  }

  return Promise.resolve(code);

};

/**
 * Save token.
 */

AuthorizationCodeGrantType.prototype.saveToken = function(user, client, authorizationCode, scope) {

  const fns = [
    this.validateScope(user, client, scope),
    this.generateAccessToken(client, user, scope),
    this.generateRefreshToken(client, user, scope),
    this.getAccessTokenExpiresAt(),
    this.getRefreshTokenExpiresAt()
  ];

  return Promise.all(fns)
    .then( (result) => {

      if (!result || result.length < 5) {
        return Promise.reject(
          new Error('Unexpected problem saving Authorization Code Grant Type token')
        );
      }

      const token = {
        accessToken: result[1],
        authorizationCode: authorizationCode,
        accessTokenExpiresAt: result[3],
        refreshToken: result[2],
        refreshTokenExpiresAt: result[4],
        scope: result[0],
      };

      return this.model.saveToken.call(this.model, token, client, user);
    });
};

/**
 * Export constructor.
 */

module.exports = AuthorizationCodeGrantType;

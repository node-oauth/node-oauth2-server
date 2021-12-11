'use strict';

/**
 * Module dependencies.
 */

const AbstractGrantType = require('./abstract-grant-type');
const InvalidArgumentError = require('../errors/invalid-argument-error');
const InvalidGrantError = require('../errors/invalid-grant-error');
const InvalidRequestError = require('../errors/invalid-request-error');
const InvalidClientError = require('../errors/invalid-client-error');
const ServerError = require('../errors/server-error');
const is = require('../validator/is');
const util = require('util');

/**
 * Constructor.
 */

function RefreshTokenGrantType(options) {
  options = options || {};

  if (!options.model) {
    throw new InvalidArgumentError('Missing parameter: `model`');
  }

  if (!options.model.getRefreshToken) {
    throw new InvalidArgumentError('Invalid argument: model does not implement `getRefreshToken()`');
  }

  if (!options.model.revokeToken) {
    throw new InvalidArgumentError('Invalid argument: model does not implement `revokeToken()`');
  }

  if (!options.model.saveToken) {
    throw new InvalidArgumentError('Invalid argument: model does not implement `saveToken()`');
  }

  AbstractGrantType.call(this, options);
}

/**
 * Inherit prototype.
 */

util.inherits(RefreshTokenGrantType, AbstractGrantType);

/**
 * Handle refresh token grant.
 *
 * @see https://tools.ietf.org/html/rfc6749#section-6
 */

RefreshTokenGrantType.prototype.handle = async function(request, client) {

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

  let token;

  try {
    token = await this.getRefreshToken.call(this, request, client);
  } catch (err) {
    return Promise.reject(err);
  }

  try {
    await this.revokeToken.call(this, token);
  } catch (err) {
    return Promise.reject(err);
  }

  return this.saveToken.call(this, token.user, client, token.scope);

};

/**
 * Get refresh token.
 */

RefreshTokenGrantType.prototype.getRefreshToken = async function(request, client) {

  if (!request.body.refresh_token) {
    return Promise.reject(
      new InvalidRequestError('Missing parameter: `refresh_token`')
    );
  }

  if (!is.vschar(request.body.refresh_token)) {
    return Promise.reject(
      new InvalidRequestError('Invalid parameter: `refresh_token`')
    );
  }

  let token;

  try {
    token = await this.model.getRefreshToken
      .call(this.model, request.body.refresh_token);
  } catch (err) {
    return Promise.reject(err);
  }

  if (!token) {
    throw new InvalidGrantError('Invalid grant: refresh token is invalid');
  }

  if (!token.client) {
    throw new ServerError('Server error: `getRefreshToken()` did not return a `client` object');
  }

  if (!token.user) {
    throw new ServerError('Server error: `getRefreshToken()` did not return a `user` object');
  }

  if (token.client.id !== client.id) {
    throw new InvalidGrantError('Invalid grant: refresh token is invalid');
  }

  if (token.refreshTokenExpiresAt && !(token.refreshTokenExpiresAt instanceof Date)) {
    throw new ServerError('Server error: `refreshTokenExpiresAt` must be a Date instance');
  }

  if (token.refreshTokenExpiresAt && token.refreshTokenExpiresAt < new Date()) {
    throw new InvalidGrantError('Invalid grant: refresh token has expired');
  }
  
  return Promise.resolve(token);

};

/**
 * Revoke the refresh token.
 *
 * @see https://tools.ietf.org/html/rfc6749#section-6
 */
RefreshTokenGrantType.prototype.revokeToken = async function(token) {

  if (this.alwaysIssueNewRefreshToken === false) {
    return Promise.resolve(token);
  }

  let status;

  try {
    status = this.model.revokeToken.call(this.model, token);
  } catch (err) {
    return Promise.reject(err);
  }

  if (!status) {
    return Promise.reject(
      new InvalidGrantError('Invalid grant: refresh token is invalid')
    );
  }

  return token;

};

/**
 * Save token.
 */
RefreshTokenGrantType.prototype.saveToken = async function(user, client, scope) {

  const fns = [
    this.generateAccessToken.call(this,client, user, scope),
    this.generateRefreshToken.call(this,client, user, scope),
    this.getAccessTokenExpiresAt.call(this),
    this.getRefreshTokenExpiresAt.call(this),
  ];

  let res;

  try {
    res = await Promise.all(fns);
  } catch (err) {
    return Promise.reject(err);
  }

  if (!res || res.length !== 4) {
    return Promise.reject( 
      new InvalidClientError('Invalid client: client credentials are invalid')
    );
  }

  const token = {
    accessToken: res[0],
    accessTokenExpiresAt: res[2],
    scope: scope
  };

  if (this.alwaysIssueNewRefreshToken !== false) {
    token.refreshToken = res[1];
    token.refreshTokenExpiresAt = res[3];
  }

  return this.model.saveToken.call(this.model, token, client, user);

};

/**
 * Export constructor.
 */

module.exports = RefreshTokenGrantType;

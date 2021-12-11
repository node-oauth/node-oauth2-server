'use strict';

const InvalidArgumentError = require('../errors/invalid-argument-error');
const is = require('../validator/is');
const tokenUtil = require('../utils/token-util');

/**
 * Constructor.
 */
function AbstractGrantType(options) {
  options = options || {};

  if (!options.accessTokenLifetime) {
    throw new InvalidArgumentError('Missing parameter: `accessTokenLifetime`');
  }

  if (!options.model) {
    throw new InvalidArgumentError('Missing parameter: `model`');
  }

  this.accessTokenLifetime = options.accessTokenLifetime;
  this.model = options.model;
  this.refreshTokenLifetime = options.refreshTokenLifetime;
  this.alwaysIssueNewRefreshToken = options.alwaysIssueNewRefreshToken;
}

/**
 * Generate access token.
 */
AbstractGrantType.prototype.generateAccessToken = async function(client, user, scope) {

  let accessToken;

  if (
    this.model &&
    this.model.generateAccessToken &&
    typeof this.model.generateAccessToken === 'function'
  ) {

    try {
      accessToken = await this.model.generateAccessToken
        .call(this.model, client, user, scope);
    } catch (err) {
      return Promise.reject(err);
    }

  }

  return Promise.resolve( accessToken || tokenUtil.generateRandomToken() );
};

/**
 * Generate refresh token.
 */
AbstractGrantType.prototype.generateRefreshToken = async function(client, user, scope) {

  let refreshToken;

  if (
    this.model &&
    this.model.generateRefreshToken &&
    typeof this.model.generateRefreshToken === 'function'
  ) {

    try {
      refreshToken = await this.model.generateRefreshToken
        .call(this.model, client, user, scope); 
    } catch (err) {
      return Promise.reject(err);
    }

  }

  return Promise.resolve( refreshToken || tokenUtil.generateRandomToken() );
};

/**
 * Get access token expiration date.
 */
AbstractGrantType.prototype.getAccessTokenExpiresAt = function() {
  return new Date(Date.now() + this.accessTokenLifetime * 1000);
};

/**
 * Get refresh token expiration date.
 */
AbstractGrantType.prototype.getRefreshTokenExpiresAt = function() {
  return new Date(Date.now() + this.refreshTokenLifetime * 1000);
};

/**
 * Get scope from the request body.
 */
AbstractGrantType.prototype.getScope = function(request) {

  if (!request || !request.body || !is.nqschar(request.body.scope)) {
    throw new InvalidArgumentError('Invalid parameter: `scope`');
  }

  return request.body.scope;
};

/**
 * Validate requested scope.
 */
AbstractGrantType.prototype.validateScope = async function(user, client, scope) {

  // scope is valid by default
  let isValidScope = true;

  if (
    this.model &&
    this.model.validateScope &&
    typeof this.model.validateScope === 'function'
  ) {

    try {
      isValidScope = await this.model.validateScope
        .call(this.model, user, client, scope);
    } catch (err) {
      return Promise.reject(err);
    }
    
  }

  // This should never return an error, only true or false.
  // if (!isValidScope) {
  //   Promise.reject( 
  //     new InvalidScopeError('Invalid scope: Requested scope is invalid')
  //   );
  // }

  return Promise.resolve(isValidScope);

};

module.exports = AbstractGrantType;

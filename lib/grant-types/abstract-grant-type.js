'use strict';

/**
 * Module dependencies.
 */

const InvalidArgumentError = require('../errors/invalid-argument-error');
const InvalidScopeError = require('../errors/invalid-scope-error');
const isFormat = require('@node-oauth/formats');
const tokenUtil = require('../utils/token-util');

class AbstractGrantType {
  constructor (options) {
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
  async generateAccessToken (client, user, scope) {
    if (this.model.generateAccessToken) {
      const accessToken = await this.model.generateAccessToken(client, user, scope);
      return accessToken || tokenUtil.generateRandomToken();
    }

    return tokenUtil.generateRandomToken();
  }

  /**
 * Generate refresh token.
 */
  async generateRefreshToken (client, user, scope) {
    if (this.model.generateRefreshToken) {
      const refreshToken = await this.model.generateRefreshToken(client, user, scope);
      return refreshToken || tokenUtil.generateRandomToken();
    }

    return tokenUtil.generateRandomToken();
  }

  /**
 * Get access token expiration date.
 */
  getAccessTokenExpiresAt() {
    return new Date(Date.now() + this.accessTokenLifetime * 1000);
  }



  /**
   * Get refresh token expiration date.
   */
  getRefreshTokenExpiresAt () {
    return new Date(Date.now() + this.refreshTokenLifetime * 1000);
  }

  /**
   * Get scope from the request body.
   */
  getScope (request) {
    if (!isFormat.nqschar(request.body.scope)) {
      throw new InvalidArgumentError('Invalid parameter: `scope`');
    }

    return request.body.scope;
  }

  /**
   * Validate requested scope.
   */
  async validateScope (user, client, scope) {
    if (this.model.validateScope) {
      const validatedScope = await this.model.validateScope(user, client, scope);

      if (!validatedScope) {
        throw new InvalidScopeError('Invalid scope: Requested scope is invalid');
      }

      return validatedScope;
    } else {
      return scope;
    }
  }
}

/**
 * Export constructor.
 */

module.exports = AbstractGrantType;

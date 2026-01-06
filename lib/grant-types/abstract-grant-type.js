'use strict';

/*
 * Module dependencies.
 */

const InvalidArgumentError = require('../errors/invalid-argument-error');
const InvalidScopeError = require('../errors/invalid-scope-error');
const tokenUtil = require('../utils/token-util');
const { parseScope } = require('../utils/scope-util');

/**
 * @class
 * @classDesc#
 */
class AbstractGrantType {
  /**
     * @constructor
     * @param options {object}
     * @param options.accessTokenLifetime {number} access token lifetime in seconds
     * @param options.model {Model} the model
     * @param options.refreshTokenLifetime {number}
     * @param [options.alwaysIssueNewRefreshToken=true] {boolean=} Always revoke the used refresh token and issue a new one for the `refresh_token` grant.
     * @throws {InvalidArgumentError} if {options.accessTokenLifeTime} is missing
     * @throws {InvalidArgumentError} if {options.model} is missing
     */
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
     * If the model implements `generateAccessToken` then
     * this implementation will be used.
     * Otherwise, falls back to an internal implementation from `TokenUtil.generateRandomToken`.
     *
     * @param client
     * @param user
     * @param scope
     * @return {Promise<string>}
     */
  async generateAccessToken (client, user, scope) {
    if (this.model.generateAccessToken) {
      // We should not fall back to a random accessToken, if the model did not
      // return a token, in order to prevent unintended token-issuing.
      return this.model.generateAccessToken(client, user, scope);
    }

    return tokenUtil.generateRandomToken();
  }

  /**
 * Generate refresh token.
 */
  async generateRefreshToken (client, user, scope) {
    if (this.model.generateRefreshToken) {
      // We should not fall back to a random refreshToken, if the model did not
      // return a token, in order to prevent unintended token-issuing.
      return this.model.generateRefreshToken(client, user, scope);
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
   * Get refresh token expiration date (now + refresh token lifetime)
   * @returns {Date}
   */
  getRefreshTokenExpiresAt () {
    return new Date(Date.now() + this.refreshTokenLifetime * 1000);
  }

  /**
   * Get scope from the request body.
   * @param request {Request}
   * @returns {string|undefined}
   */
  getScope (request) {
    return parseScope(request.body.scope);
  }

  /**
   * Validate requested scope.
   * Delegates validation to the Model's `validateScope` method,
   * if the model implements this method.
   * Otherwise, treats given scope as valid.
   * @param user {object}
   * @param client {ClientData}
   * @param scope {string}
   * @return {string} the validated scope
   * @throws {InvalidScopeError} if the {Model#validateScope} method returned a falsy value
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

module.exports = AbstractGrantType;

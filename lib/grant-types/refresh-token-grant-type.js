'use strict';

/**
 * Module dependencies.
 */

const AbstractGrantType = require('./abstract-grant-type');
const InvalidArgumentError = require('../errors/invalid-argument-error');
const InvalidGrantError = require('../errors/invalid-grant-error');
const InvalidRequestError = require('../errors/invalid-request-error');
const ServerError = require('../errors/server-error');
const isFormat = require('@node-oauth/formats');
const InvalidScopeError = require('../errors/invalid-scope-error');

/**
 * Constructor.
 */

class RefreshTokenGrantType extends AbstractGrantType {
  constructor(options = {}) {
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

    super(options);
  }

  /**
	 * Handle refresh token grant.
	 *
	 * @see https://tools.ietf.org/html/rfc6749#section-6
	 */

  async handle(request, client) {
    if (!request) {
      throw new InvalidArgumentError('Missing parameter: `request`');
    }

    if (!client) {
      throw new InvalidArgumentError('Missing parameter: `client`');
    }

    let token;
    token = await this.getRefreshToken(request, client);
    token = await this.revokeToken(token);

    const scope = this.getScope(request, token);

    return this.saveToken(token.user, client, scope);
  }

  /**
	 * Get refresh token.
	 */

  async getRefreshToken(request, client) {
    if (!request.body.refresh_token) {
      throw new InvalidRequestError('Missing parameter: `refresh_token`');
    }

    if (!isFormat.vschar(request.body.refresh_token)) {
      throw new InvalidRequestError('Invalid parameter: `refresh_token`');
    }

    const token = await this.model.getRefreshToken(request.body.refresh_token);

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
      throw new InvalidGrantError('Invalid grant: refresh token was issued to another client');
    }

    if (token.refreshTokenExpiresAt && !(token.refreshTokenExpiresAt instanceof Date)) {
      throw new ServerError('Server error: `refreshTokenExpiresAt` must be a Date instance');
    }

    if (token.refreshTokenExpiresAt && token.refreshTokenExpiresAt < new Date()) {
      throw new InvalidGrantError('Invalid grant: refresh token has expired');
    }

    return token;
  }

  /**
	 * Revoke the refresh token.
	 *
	 * @see https://tools.ietf.org/html/rfc6749#section-6
	 */

  async revokeToken(token) {
    if (this.alwaysIssueNewRefreshToken === false) {
      return token;
    }

    const status = await this.model.revokeToken(token);

    if (!status) {
      throw new InvalidGrantError('Invalid grant: refresh token is invalid or could not be revoked');
    }

    return token;
  }

  /**
	 * Save token.
	 */

  async saveToken(user, client, scope) {
    const accessToken = await this.generateAccessToken(client, user, scope);
    const refreshToken = await this.generateRefreshToken(client, user, scope);
    const accessTokenExpiresAt = await this.getAccessTokenExpiresAt();
    const refreshTokenExpiresAt = await this.getRefreshTokenExpiresAt();
    const token = {
      accessToken,
      accessTokenExpiresAt,
      scope,
    };

    if (this.alwaysIssueNewRefreshToken !== false) {
      token.refreshToken = refreshToken;
      token.refreshTokenExpiresAt = refreshTokenExpiresAt;
    }

    return this.model.saveToken(token, client, user);
  }

  getScope (request, token) {
    const requestedScope = super.getScope(request);
    const originalScope = token.scope;

    if (!originalScope && !requestedScope) {
      return;
    }

    if (!originalScope && requestedScope) {
      throw new InvalidScopeError('Invalid scope: Unable to add extra scopes');
    }

    if (!requestedScope) {
      return originalScope;
    }

    const valid = requestedScope.every(scope => {
      return originalScope.includes(scope);
    });

    if (!valid) {
      throw new InvalidScopeError('Invalid scope: Unable to add extra scopes');
    }

    return requestedScope;
  }
}

/**
 * Export constructor.
 */

module.exports = RefreshTokenGrantType;

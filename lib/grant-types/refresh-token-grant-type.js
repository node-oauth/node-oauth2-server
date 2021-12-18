'use strict';

/**
 * Module dependencies.
 */

const AbstractGrantType = require('./abstract-grant-type');
const InvalidArgumentError = require('../errors/invalid-argument-error');
const InvalidGrantError = require('../errors/invalid-grant-error');
const InvalidRequestError = require('../errors/invalid-request-error');
const Promise = require('bluebird');
const promisify = require('promisify-any').use(Promise);
const ServerError = require('../errors/server-error');
const isFormat = require('@node-oauth/formats');

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

  handle(request, client) {
    if (!request) {
      throw new InvalidArgumentError('Missing parameter: `request`');
    }

    if (!client) {
      throw new InvalidArgumentError('Missing parameter: `client`');
    }

    return Promise.bind(this)
      .then(function () {
        return this.getRefreshToken(request, client);
      })
      .tap(function (token) {
        return this.revokeToken(token);
      })
      .then(function (token) {
        return this.saveToken(token.user, client, token.scope);
      });
  }

  /**
	 * Get refresh token.
	 */

  getRefreshToken(request, client) {
    if (!request.body.refresh_token) {
      throw new InvalidRequestError('Missing parameter: `refresh_token`');
    }

    if (!isFormat.vschar(request.body.refresh_token)) {
      throw new InvalidRequestError('Invalid parameter: `refresh_token`');
    }

    return promisify(this.model.getRefreshToken, 1)
      .call(this.model, request.body.refresh_token)
      .then((token) => {
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

        return token;
      });
  }

  /**
	 * Revoke the refresh token.
	 *
	 * @see https://tools.ietf.org/html/rfc6749#section-6
	 */

  revokeToken(token) {
    if (this.alwaysIssueNewRefreshToken === false) {
      return Promise.resolve(token);
    }

    return promisify(this.model.revokeToken, 1)
      .call(this.model, token)
      .then((status) => {
        if (!status) {
          throw new InvalidGrantError('Invalid grant: refresh token is invalid');
        }

        return token;
      });
  }

  /**
	 * Save token.
	 */

  saveToken(user, client, scope) {
    const fns = [
      this.generateAccessToken(client, user, scope),
      this.generateRefreshToken(client, user, scope),
      this.getAccessTokenExpiresAt(),
      this.getRefreshTokenExpiresAt(),
    ];

    return Promise.all(fns)
      .bind(this)
      .spread(function (accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt) {
        const token = {
          accessToken: accessToken,
          accessTokenExpiresAt: accessTokenExpiresAt,
          scope: scope,
        };

        if (this.alwaysIssueNewRefreshToken !== false) {
          token.refreshToken = refreshToken;
          token.refreshTokenExpiresAt = refreshTokenExpiresAt;
        }

        return token;
      })
      .then(function (token) {
        return promisify(this.model.saveToken, 3)
          .call(this.model, token, client, user)
          .then((savedToken) => savedToken);
      });
  }
}

/**
 * Export constructor.
 */

module.exports = RefreshTokenGrantType;

'use strict';

/*
 * Module dependencies.
 */
const InvalidArgumentError = require('../errors/invalid-argument-error');
const { getLifetimeFromExpiresAt } = require('../utils/date-util');

/**
 * @private
 * @typedef modelAttributes
 * @type {Set}
 * @description The core model attributes allowed when `allowExtendedTokenAttributes` is `false`.
 */
const modelAttributes = new Set([
  'accessToken',
  'accessTokenExpiresAt',
  'refreshToken',
  'refreshTokenExpiresAt',
  'scope',
  'client',
  'user'
]);

/**
 * @class
 * @classDesc
 */
class TokenModel {
  /**
     * @constructor
     * @param data
     * @param options
     */
  constructor(data = {}, options = {}) {
    const {
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
      refreshTokenExpiresAt,
      scope,
      client,
      user,
    } = data;

    if (!accessToken) {
      throw new InvalidArgumentError('Missing parameter: `accessToken`');
    }

    if (!client) {
      throw new InvalidArgumentError('Missing parameter: `client`');
    }

    if (!user) {
      throw new InvalidArgumentError('Missing parameter: `user`');
    }

    if (accessTokenExpiresAt && !(accessTokenExpiresAt instanceof Date)) {
      throw new InvalidArgumentError('Invalid parameter: `accessTokenExpiresAt`');
    }

    if (refreshTokenExpiresAt && !(refreshTokenExpiresAt instanceof Date)) {
      throw new InvalidArgumentError('Invalid parameter: `refreshTokenExpiresAt`');
    }

    this.accessToken = accessToken;
    this.accessTokenExpiresAt = accessTokenExpiresAt;
    this.client = client;
    this.refreshToken = refreshToken;
    this.refreshTokenExpiresAt = refreshTokenExpiresAt;
    this.scope = scope;
    this.user = user;

    if (accessTokenExpiresAt) {
      this.accessTokenLifetime = getLifetimeFromExpiresAt(accessTokenExpiresAt);
    }

    const { allowExtendedTokenAttributes } = options;

    if (allowExtendedTokenAttributes) {
      this.customAttributes = {};

      Object.keys(data).forEach(key => {
        if (!modelAttributes.has(key)) {
          this.customAttributes[key] = data[key];
        }
      });
    }
  }
}

module.exports = TokenModel;

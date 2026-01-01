'use strict';

/**
 * Module dependencies.
 */

const AbstractGrantType = require('./abstract-grant-type');
const InvalidArgumentError = require('../errors/invalid-argument-error');
const InvalidGrantError = require('../errors/invalid-grant-error');
const InvalidRequestError = require('../errors/invalid-request-error');
const isFormat = require('@node-oauth/formats');

/**
 * Constructor.
 * @deprecated
 */

class PasswordGrantType extends AbstractGrantType {
  constructor(options = {}) {
    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }

    if (!options.model.getUser) {
      throw new InvalidArgumentError('Invalid argument: model does not implement `getUser()`');
    }

    if (!options.model.saveToken) {
      throw new InvalidArgumentError('Invalid argument: model does not implement `saveToken()`');
    }

    super(options);
  }

  /**
	 * Retrieve the user from the model using a username/password combination.
	 *
	 * @see https://tools.ietf.org/html/rfc6749#section-4.3.2
	 */

  async handle(request, client) {
    if (!request) {
      throw new InvalidArgumentError('Missing parameter: `request`');
    }

    if (!client) {
      throw new InvalidArgumentError('Missing parameter: `client`');
    }

    const scope = this.getScope(request);
    const user = await this.getUser(request, client);

    return this.saveToken(user, client, scope);
  }

  /**
	 * Get user using a username/password combination.
	 */

  async getUser(request, client) {
    if (!request.body.username) {
      throw new InvalidRequestError('Missing parameter: `username`');
    }

    if (!request.body.password) {
      throw new InvalidRequestError('Missing parameter: `password`');
    }

    if (!isFormat.uchar(request.body.username)) {
      throw new InvalidRequestError('Invalid parameter: `username`');
    }

    if (!isFormat.uchar(request.body.password)) {
      throw new InvalidRequestError('Invalid parameter: `password`');
    }

    const user = await this.model.getUser(request.body.username, request.body.password, client);

    if (!user) {
      throw new InvalidGrantError('Invalid grant: user credentials are invalid');
    }

    return user;
  }

  /**
	 * Save token.
	 */

  async saveToken(user, client, requestedScope) {
    const validatedScope = await this.validateScope(user, client, requestedScope);
    const accessToken = await this.generateAccessToken(client, user, validatedScope);
    const refreshToken = await this.generateRefreshToken(client, user, validatedScope);
    const accessTokenExpiresAt = await this.getAccessTokenExpiresAt();
    const refreshTokenExpiresAt = await this.getRefreshTokenExpiresAt();

    const token = {
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
      refreshTokenExpiresAt,
      scope: validatedScope,
    };

    return this.model.saveToken(token, client, user);
  }
}

/**
 * Export constructor.
 */

module.exports = PasswordGrantType;

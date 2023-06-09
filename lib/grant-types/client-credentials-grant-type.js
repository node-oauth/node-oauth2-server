'use strict';

/**
 * Module dependencies.
 */

const AbstractGrantType = require('./abstract-grant-type');
const InvalidArgumentError = require('../errors/invalid-argument-error');
const InvalidGrantError = require('../errors/invalid-grant-error');

/**
 * Constructor.
 */

class ClientCredentialsGrantType extends AbstractGrantType {
  constructor(options = {}) {
    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }

    if (!options.model.getUserFromClient) {
      throw new InvalidArgumentError('Invalid argument: model does not implement `getUserFromClient()`');
    }

    if (!options.model.saveToken) {
      throw new InvalidArgumentError('Invalid argument: model does not implement `saveToken()`');
    }

    super(options);
  }

  /**
	 * Handle client credentials grant.
	 *
	 * @see https://tools.ietf.org/html/rfc6749#section-4.4.2
	 */

  async handle(request, client) {
    if (!request) {
      throw new InvalidArgumentError('Missing parameter: `request`');
    }

    if (!client) {
      throw new InvalidArgumentError('Missing parameter: `client`');
    }

    const scope = this.getScope(request);
    const user = this.getUserFromClient(client);

    return this.saveToken(user, client, scope);
  }

  /**
	 * Retrieve the user using client credentials.
	 */

  async getUserFromClient(client) {
    const user = await this.model.getUserFromClient(client);

    if (!user) {
      throw new InvalidGrantError('Invalid grant: user credentials are invalid');
    }

    return user;
  }

  /**
	 * Save token.
	 */

  async saveToken(user, client, scope) {
    const fns = [
      this.validateScope(user, client, scope),
      this.generateAccessToken(client, user, scope),
      this.getAccessTokenExpiresAt(client, user, scope),
    ];

    const [validatedScope, accessToken, accessTokenExpiresAt] = await Promise.all(fns);
    const token = {
      accessToken: accessToken,
      accessTokenExpiresAt: accessTokenExpiresAt,
      scope: validatedScope,
    };

    return this.model.saveToken(token, client, user);
  }
}

/**
 * Export constructor.
 */

module.exports = ClientCredentialsGrantType;

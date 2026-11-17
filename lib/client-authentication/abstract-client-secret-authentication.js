'use strict';

/*
 * Module dependencies.
 */

const AbstractClientAuthentication = require('./abstract-client-authentication');
const InvalidClientError = require('../errors/invalid-client-error');
const InvalidRequestError = require('../errors/invalid-request-error');
const isFormat = require('@node-oauth/formats');

/**
 * @class AbstractClientSecretAuthentication
 * @classdesc
 * Shared behaviour for the secret-based methods (`client_secret_basic`,
 * `client_secret_post`): validate the credential format, then delegate
 * verification of the secret to `model.getClient(clientId, clientSecret)`.
 *
 * Subclasses differ only in how the credentials are carried on the wire
 * (`getCredentials`).
 *
 * @abstract
 * @extends AbstractClientAuthentication
 */
class AbstractClientSecretAuthentication extends AbstractClientAuthentication {
  /**
   * Extract `{ clientId, clientSecret }` from the request for this transport.
   * @param {Request} request
   * @return {{clientId: *, clientSecret: *}}
   * @abstract
   */
  getCredentials(request) {
    throw new InvalidClientError('Invalid client: cannot retrieve client credentials');
  }

  async authenticate(request, { model }) {
    const { clientId, clientSecret } = this.getCredentials(request);

    if (!isFormat.vschar(clientId)) {
      throw new InvalidRequestError('Invalid parameter: `client_id`');
    }

    if (clientSecret && !isFormat.vschar(clientSecret)) {
      throw new InvalidRequestError('Invalid parameter: `client_secret`');
    }

    const client = await model.getClient(clientId, clientSecret);

    if (!client) {
      throw new InvalidClientError('Invalid client: client is invalid');
    }

    return client;
  }
}

module.exports = AbstractClientSecretAuthentication;

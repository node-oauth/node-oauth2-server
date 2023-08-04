'use strict';

/**
 * Module dependencies.
 */

const OAuthError = require('./oauth-error');

/**
 * Constructor.
 *
 * "The authorization server encountered an unexpected condition that prevented it from fulfilling the request."
 *
 * @see https://tools.ietf.org/html/rfc6749#section-4.1.2.1
 */

class ServerError extends OAuthError {
  constructor(message, properties) {
    properties = {
      code: 503,
      name: 'server_error',
      ...properties
    };

    super(message, properties);
  }
}

/**
 * Export constructor.
 */

module.exports = ServerError;

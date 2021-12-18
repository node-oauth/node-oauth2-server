'use strict';

/**
 * Module dependencies.
 */

const OAuthError = require('./oauth-error');

/**
 * Constructor.
 *
 * "Client authentication failed (e.g., unknown client, no client
 * authentication included, or unsupported authentication method)"
 *
 * @see https://tools.ietf.org/html/rfc6749#section-5.2
 */

class InvalidClientError extends OAuthError {
  constructor(message, properties) {
    properties = Object.assign(
      {
        code: 400,
        name: 'invalid_client',
      },
      properties
    );

    super(message, properties);
  }
}

/**
 * Export constructor.
 */

module.exports = InvalidClientError;

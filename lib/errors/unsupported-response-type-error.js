'use strict';

/**
 * Module dependencies.
 */

const OAuthError = require('./oauth-error');

/**
 * Constructor.
 *
 * "The authorization server does not supported obtaining an
 * authorization code using this method."
 *
 * @see https://tools.ietf.org/html/rfc6749#section-4.1.2.1
 */

class UnsupportedResponseTypeError extends OAuthError {
  constructor(message, properties) {
    properties = Object.assign(
      {
        code: 400,
        name: 'unsupported_response_type',
      },
      properties
    );

    super(message, properties);
  }
}

/**
 * Export constructor.
 */

module.exports = UnsupportedResponseTypeError;

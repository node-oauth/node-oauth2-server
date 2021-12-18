'use strict';

/**
 * Module dependencies.
 */

const OAuthError = require('./oauth-error');

/**
 * Constructor.
 */

class InvalidArgumentError extends OAuthError {
  constructor(message, properties) {
    properties = Object.assign(
      {
        code: 500,
        name: 'invalid_argument',
      },
      properties
    );

    super(message, properties);
  }
}

/**
 * Export constructor.
 */

module.exports = InvalidArgumentError;

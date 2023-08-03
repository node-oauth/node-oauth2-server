'use strict';

/**
 * Module dependencies.
 */

const OAuthError = require('./oauth-error');

/**
 * Constructor.
 *
 * "The request is missing a required parameter, includes an invalid parameter value,
 * includes a parameter more than once, or is otherwise malformed."
 *
 * @see https://tools.ietf.org/html/rfc6749#section-4.2.2.1
 */

class InvalidRequest extends OAuthError {
  constructor(message, properties) {
    properties = {
      code: 400,
      name: 'invalid_request',
      ...properties
    };

    super(message, properties);
  }
}

/**
 * Export constructor.
 */

module.exports = InvalidRequest;

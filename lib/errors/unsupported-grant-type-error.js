'use strict';

/*
 * Module dependencies.
 */

const OAuthError = require('./oauth-error');

/**
 * Constructor.
 *
 * "The authorization grant type is not supported by the authorization server."
 *
 * @see https://tools.ietf.org/html/rfc6749#section-4.1.2.1
 */

class UnsupportedGrantTypeError extends OAuthError {
  constructor(message, properties) {
    properties = {
      code: 400,
      name: 'unsupported_grant_type',
      ...properties
    };

    super(message, properties);
  }
}

/**
 * Export constructor.
 */

module.exports = UnsupportedGrantTypeError;

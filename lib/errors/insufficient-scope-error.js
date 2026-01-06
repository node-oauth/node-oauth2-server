'use strict';

/*
 * Module dependencies.
 */

const OAuthError = require('./oauth-error');

/**
 * @class
 * @classDesc "The request requires higher privileges than provided by the access token.."
 * @see https://tools.ietf.org/html/rfc6750.html#section-3.1
 */

class InsufficientScopeError extends OAuthError {
  /**
   * @constructor
   * @param message {string}
   * @param properties {object=}
     */
  constructor(message, properties) {
    properties = {
      code: 403,
      name: 'insufficient_scope',
      ...properties
    };

    super(message, properties);
  }
}

module.exports = InsufficientScopeError;

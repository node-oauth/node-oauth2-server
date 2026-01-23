'use strict';

/*
 * Module dependencies.
 */

const OAuthError = require('./oauth-error');

/**
 * @class
 * @classDesc "The resource owner or authorization server denied the request"
 * @see https://tools.ietf.org/html/rfc6749#section-4.1.2.1
 */
class AccessDeniedError extends OAuthError {
  /**
     * @constructor
     * @param message {string}
     * @param properties {object=}
     */
  constructor(message, properties) {
    properties = {
      code: 400,
      name: 'access_denied',
      ...properties
    };

    super(message, properties);
  }
}

module.exports = AccessDeniedError;

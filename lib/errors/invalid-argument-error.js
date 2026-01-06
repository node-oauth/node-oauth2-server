'use strict';

/*
 * Module dependencies.
 */

const OAuthError = require('./oauth-error');

/**
 * @class
 * @classDesc "An argument to a function or constructor is missing or of wrong type"
 */

class InvalidArgumentError extends OAuthError {
  /**
   * @constructor
   * @param message {string}
   * @param properties {object=}
     */
  constructor(message, properties) {
    properties = {
      code: 500,
      name: 'invalid_argument',
      ...properties
    };

    super(message, properties);
  }
}

module.exports = InvalidArgumentError;

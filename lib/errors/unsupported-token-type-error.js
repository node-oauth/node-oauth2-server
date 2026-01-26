'use strict';

/**
 * Module dependencies.
 */

const OAuthError = require('./oauth-error');

/**
 * Constructor.
 *
 * "The authorization server does not support
 * the revocation of the presented token type. That is, the
 * client tried to revoke an access token on a server not
 * supporting this feature."
 *
 * @see https://www.rfc-editor.org/rfc/rfc7009#section-2.2.1
 */

class UnsupportedTokenTypeError extends OAuthError {
  constructor(message, properties) {
    properties = {
      code: 503,
      name: 'unsupported_token_type',
      ...properties
    };

    super(message, properties);
  }
}

/**
 * Export constructor.
 */

module.exports = UnsupportedTokenTypeError;

'use strict';

/**
 * Module dependencies.
 */

const OAuthError = require('./oauth-error');
const util = require('util');

/**
 * Constructor.
 *
 * "The requested scope is invalid, unknown, or malformed."
 *
 * @see https://tools.ietf.org/html/rfc6749#section-4.1.2.1
 */

class InvalidScopeError extends OAuthError {
	constructor(message, properties) {
		properties = Object.assign(
			{
				code: 400,
				name: 'invalid_scope',
			},
			properties
		);

		super(message, properties);
	}
}

/**
 * Export constructor.
 */

module.exports = InvalidScopeError;

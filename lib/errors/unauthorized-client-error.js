'use strict';

/**
 * Module dependencies.
 */

const OAuthError = require('./oauth-error');
const util = require('util');

/**
 * Constructor.
 *
 * "The authenticated client is not authorized to use this authorization grant type."
 *
 * @see https://tools.ietf.org/html/rfc6749#section-4.1.2.1
 */

class UnauthorizedClientError extends OAuthError {
	constructor(message, properties) {
		properties = Object.assign(
			{
				code: 400,
				name: 'unauthorized_client',
			},
			properties
		);

		super(message, properties);
	}
}

/**
 * Export constructor.
 */

module.exports = UnauthorizedClientError;

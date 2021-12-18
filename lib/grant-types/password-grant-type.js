'use strict';

/**
 * Module dependencies.
 */

const AbstractGrantType = require('./abstract-grant-type');
const InvalidArgumentError = require('../errors/invalid-argument-error');
const InvalidGrantError = require('../errors/invalid-grant-error');
const InvalidRequestError = require('../errors/invalid-request-error');
const Promise = require('bluebird');
const promisify = require('promisify-any').use(Promise);
const isFormat = require('@node-oauth/formats');
const util = require('util');

/**
 * Constructor.
 */

class PasswordGrantType extends AbstractGrantType {
	constructor(options = {}) {
		if (!options.model) {
			throw new InvalidArgumentError('Missing parameter: `model`');
		}

		if (!options.model.getUser) {
			throw new InvalidArgumentError('Invalid argument: model does not implement `getUser()`');
		}

		if (!options.model.saveToken) {
			throw new InvalidArgumentError('Invalid argument: model does not implement `saveToken()`');
		}

		super(options);
	}

	/**
	 * Retrieve the user from the model using a username/password combination.
	 *
	 * @see https://tools.ietf.org/html/rfc6749#section-4.3.2
	 */

	handle(request, client) {
		if (!request) {
			throw new InvalidArgumentError('Missing parameter: `request`');
		}

		if (!client) {
			throw new InvalidArgumentError('Missing parameter: `client`');
		}

		const scope = this.getScope(request);

		return Promise.bind(this)
			.then(function () {
				return this.getUser(request);
			})
			.then(function (user) {
				return this.saveToken(user, client, scope);
			});
	}

	/**
	 * Get user using a username/password combination.
	 */

	getUser(request) {
		if (!request.body.username) {
			throw new InvalidRequestError('Missing parameter: `username`');
		}

		if (!request.body.password) {
			throw new InvalidRequestError('Missing parameter: `password`');
		}

		if (!isFormat.uchar(request.body.username)) {
			throw new InvalidRequestError('Invalid parameter: `username`');
		}

		if (!isFormat.uchar(request.body.password)) {
			throw new InvalidRequestError('Invalid parameter: `password`');
		}

		return promisify(this.model.getUser, 2)
			.call(this.model, request.body.username, request.body.password)
			.then((user) => {
				if (!user) {
					throw new InvalidGrantError('Invalid grant: user credentials are invalid');
				}

				return user;
			});
	}

	/**
	 * Save token.
	 */

	saveToken(user, client, scope) {
		const fns = [
			this.validateScope(user, client, scope),
			this.generateAccessToken(client, user, scope),
			this.generateRefreshToken(client, user, scope),
			this.getAccessTokenExpiresAt(),
			this.getRefreshTokenExpiresAt(),
		];

		return Promise.all(fns)
			.bind(this)
			.spread(function (scope, accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt) {
				const token = {
					accessToken: accessToken,
					accessTokenExpiresAt: accessTokenExpiresAt,
					refreshToken: refreshToken,
					refreshTokenExpiresAt: refreshTokenExpiresAt,
					scope: scope,
				};

				return promisify(this.model.saveToken, 3).call(this.model, token, client, user);
			});
	}
}

/**
 * Export constructor.
 */

module.exports = PasswordGrantType;

'use strict';

/**
 * Module dependencies.
 */

const AbstractGrantType = require('./abstract-grant-type');
const InvalidArgumentError = require('../errors/invalid-argument-error');
const InvalidGrantError = require('../errors/invalid-grant-error');
const InvalidRequestError = require('../errors/invalid-request-error');
const InvalidClientError = require('../errors/invalid-client-error');
const is = require('../validator/is');
const util = require('util');

/**
 * Constructor.
 */

function PasswordGrantType(options) {
  options = options || {};

  if (!options.model) {
    throw new InvalidArgumentError('Missing parameter: `model`');
  }

  if (!options.model.getUser) {
    throw new InvalidArgumentError('Invalid argument: model does not implement `getUser()`');
  }

  if (!options.model.saveToken) {
    throw new InvalidArgumentError('Invalid argument: model does not implement `saveToken()`');
  }

  AbstractGrantType.call(this, options);
}

/**
 * Inherit prototype.
 */

util.inherits(PasswordGrantType, AbstractGrantType);

/**
 * Retrieve the user from the model using a username/password combination.
 *
 * @see https://tools.ietf.org/html/rfc6749#section-4.3.2
 */

PasswordGrantType.prototype.handle = async function(request, client) {

  if (!request) {
    throw new InvalidArgumentError('Missing parameter: `request`');
  }

  if (!client) {
    throw new InvalidArgumentError('Missing parameter: `client`');
  }

  const scope = this.getScope(request);

  let user;

  try {
    user = await this.getUser.call(this, request);
  } catch (err) {
    return Promise.reject(err);
  }

  return this.saveToken.call(this, user, client, scope);

//   return Promise.bind(this)
//     .then(function() {
//       return this.getUser(request);
//     })
//     .then(function(user) {
//       return this.saveToken(user, client, scope);
//     });
};

/**
 * Get user using a username/password combination.
 */

PasswordGrantType.prototype.getUser = async function(request) {
  if (!request.body.username) {
    return Promise.reject(
      new InvalidRequestError('Missing parameter: `username`')
    );
  }

  if (!request.body.password) {
    return Promise.reject(
      new InvalidRequestError('Missing parameter: `password`')
    );
  }

  if (!is.uchar(request.body.username)) {
    return Promise.reject(
      new InvalidRequestError('Invalid parameter: `username`')
    );
  }

  if (!is.uchar(request.body.password)) {
    return Promise.reject(
      new InvalidRequestError('Invalid parameter: `password`')
    );
  }

  let user;

  try {
    user = await this.model.getUser
      .call(this.model, request.body.username, request.body.password);
  } catch (err) {
    return Promise.reject(err);
  }

  if (!user) {
    return Promise.reject(
      new InvalidGrantError('Invalid grant: user credentials are invalid')
    );
  }

  return Promise.resolve(user);
};

/**
 * Save token.
 */

PasswordGrantType.prototype.saveToken = async function(user, client, scope) {

  const fns = [
    this.validateScope.call(this, user, client, scope),
    this.generateAccessToken.call(this, client, user, scope),
    this.generateRefreshToken.call(this, client, user, scope),
    this.getAccessTokenExpiresAt.call(this),
    this.getRefreshTokenExpiresAt.call(this)
  ];

  let res;

  try {
    res = await Promise.all(fns);
  } catch (err) {
    return Promise.reject(err);
  }

  if (!res || res.length !== 5) {
    // TODO: confirm this is the correct error
    return Promise.reject( 
      new InvalidClientError('Invalid client: client credentials are invalid')
    );
  }

  const token = {
    scope: res[0],
    accessToken: res[1],
    refreshToken: res[2],
    accessTokenExpiresAt: res[3],
    refreshTokenExpiresAt: res[4],
  };

  return this.model.saveToken.call(this.model, token, client, user);

};

/**
 * Export constructor.
 */

module.exports = PasswordGrantType;

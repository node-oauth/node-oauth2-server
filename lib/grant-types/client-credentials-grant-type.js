'use strict';

/**
 * Module dependencies.
 */

const AbstractGrantType = require('./abstract-grant-type');
const InvalidArgumentError = require('../errors/invalid-argument-error');
const InvalidGrantError = require('../errors/invalid-grant-error');
const InvalidClientError = require('../errors/invalid-client-error');
const util = require('util');

/**
 * Constructor.
 */

function ClientCredentialsGrantType(options) {
  options = options || {};

  if (!options.model) {
    throw new InvalidArgumentError('Missing parameter: `model`');
  }

  if (!options.model.getUserFromClient) {
    throw new InvalidArgumentError('Invalid argument: model does not implement `getUserFromClient()`');
  }

  if (!options.model.saveToken) {
    throw new InvalidArgumentError('Invalid argument: model does not implement `saveToken()`');
  }

  AbstractGrantType.call(this, options);
}

/**
 * Inherit prototype.
 */

util.inherits(ClientCredentialsGrantType, AbstractGrantType);

/**
 * Handle client credentials grant.
 *
 * @see https://tools.ietf.org/html/rfc6749#section-4.4.2
 */

ClientCredentialsGrantType.prototype.handle = async function(request, client) {

  if (!request) {
    throw new InvalidArgumentError('Missing parameter: `request`');
  }

  if (!client) {
    throw new InvalidArgumentError('Missing parameter: `client`');
  }

  const scope = this.getScope(request);

  let user;
  try {
    user = await this.getUserFromClient.call(this, client);   
  } catch (err) {
    return Promise.reject(err);
  }

  return this.saveToken.call(this, user, client, scope);

};

/**
 * Retrieve the user using client credentials.
 */

ClientCredentialsGrantType.prototype.getUserFromClient = async function(client) {

  let user;

  try {
    user = await this.model.getUserFromClient.call(this.model, client);
  } catch (err) {
    return Promise.reject(err);
  }

  if (!user) {
    return Promise.reject( 
      new InvalidGrantError('Invalid grant: user credentials are invalid')
    );
  }

  return user;

};

/**
 * Save token.
 */

ClientCredentialsGrantType.prototype.saveToken = async function(user, client, scope) {

  const fns = [
    this.validateScope.call( this, user, client, scope),
    this.generateAccessToken.call( this, client, user, scope),
    this.getAccessTokenExpiresAt.call( this, client, user, scope)
  ];

  let res;

  try {
    res = await Promise.all(fns);
  } catch (err) {
    return Promise.reject(err);
  }

  if (!res || res.length !== 3) {
    // TODO: confirm this is the correct error
    return Promise.reject( 
      new InvalidClientError('Invalid client: client credentials are invalid')
    );
  }

  const token = {
    scope: res[0],
    accessToken: res[1],
    accessTokenExpiresAt: res[2],
  };

  return this.model.saveToken.call(this.model, token, client, user);

};

/**
 * Export constructor.
 */

module.exports = ClientCredentialsGrantType;

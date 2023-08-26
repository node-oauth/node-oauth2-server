'use strict';

/**
 * Module dependencies.
 */

const ServerError = require('../errors/server-error');

class TokenResponseType {
  constructor() {
    throw new ServerError('Not implemented.');
  }
}

module.exports = TokenResponseType;

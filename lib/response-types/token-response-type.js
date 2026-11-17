'use strict';

/*
 * Module dependencies.
 */

const ServerError = require('../errors/server-error');

/**
 * @class
 * @classDesc Unsupported internal placeholder, not a package export. Construction throws
 * `ServerError('Not implemented.')`. Only bearer tokens and code authorization responses are supported.
 */
class TokenResponseType {
  /**
   * @constructor
   * @throws {ServerError} not implemented yet
   */
  constructor() {
    throw new ServerError('Not implemented.');
  }
}

module.exports = TokenResponseType;

'use strict';

const ServerError = require('../errors/server-error');

/**
 * @class
 * @classDesc Unsupported internal placeholder, not a package export. Construction throws
 * `ServerError('Not implemented.')`. Only bearer tokens and code authorization responses are supported.
 */
class MacTokenType {
  /**
   * @constructor
   * @throws {ServerError} not yet implemented
   */
  constructor() {
    throw new ServerError('Not implemented.');
  }
}

module.exports = MacTokenType;

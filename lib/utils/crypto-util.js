'use strict';

const crypto = require('crypto');

/**
 * Export `StringUtil`.
 */

module.exports = {
  /**
   *
   * @param algorithm {String} the hash algorithm, default is 'sha256'
   * @param data {Buffer|String|TypedArray|DataView} the data to hash
   * @param encoding {String|undefined} optional, the encoding to calculate the
   *    digest
   * @return {Buffer|String} if {encoding} undefined a {Buffer} is returned, otherwise a {String}
   */
  createHash: function({ algorithm = 'sha256', data = undefined, encoding = undefined }) {
    return crypto
      .createHash(algorithm)
      .update(data)
      .digest(encoding);
  }
};

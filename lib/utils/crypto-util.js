'use strict';

const crypto = require('crypto');

/**
 * @module CryptoUtil
 */

/**
 * Creates a new hash by given algorithm, data and digest encoding.
 * Defaults to sha256.
 *
 * @function
 * @param algorithm {string} the hash algorithm, default is 'sha256'
 * @param data {Buffer|string|TypedArray|DataView} the data to hash
 * @param encoding {string=} optional, the encoding of the input
 * @param output {'base64'|'base64url'|'binary'|'hex'|undefined} optional, the desired output type
 * @return {Buffer|string} if {output} is undefined, a {Buffer} is returned, otherwise a {String}
 */
const createHash = function({ algorithm = 'sha256', data, output, encoding }) {
  return crypto
    .createHash(algorithm)
    .update(data, encoding)
    .digest(output);
};

module.exports = { createHash };

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
 * @param options {object} Hash inputs, e.g. `createHash({data: 'hello', output: 'hex'})`.
 * @param [options.algorithm='sha256'] {string} the hash algorithm
 * @param options.data {Buffer|string|TypedArray|DataView} the data to hash
 * @param options.encoding {string=} optional, the encoding of the input
 * @param [options.output] {'base64'|'base64url'|'binary'|'hex'} optional, the desired output type
 * @return {Buffer|string} if {output} is undefined, a {Buffer} is returned, otherwise a {String}
 */
const createHash = function ({ algorithm = 'sha256', data, output, encoding }) {
  return crypto.createHash(algorithm).update(data, encoding).digest(output);
};

module.exports = { createHash };

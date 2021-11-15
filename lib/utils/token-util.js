'use strict';

/**
 * Module dependencies.
 */
const crypto = require('crypto');
const {promisify} = require('util');

/**
 * Export `TokenUtil`.
 */

module.exports = {

  /**
   * Generate random token.
   */
  generateRandomToken: async function() {

    let buffer;

    try {
      buffer = await promisify(crypto.randomBytes)(256);
    } catch (err) {
      return Promise.reject(err);
    }

    return crypto
      .createHash('sha256')
      .update(buffer)
      .digest('hex');

  }

};

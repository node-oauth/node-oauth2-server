'use strict';

/**
 * Module dependencies.
 */

const randomBytes = require('crypto').randomBytes;
const { createHash } = require('../utils/crypto-util');

/**
 * Export `TokenUtil`.
 */

module.exports = {

  /**
   * Generate random token.
   */

  generateRandomToken: async function() {
    const buffer = randomBytes(256);
    return createHash({ data: buffer, encoding: 'hex' });
  }
};

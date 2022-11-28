'use strict';

/**
 * Module dependencies.
 */

const randomBytes = require('bluebird').promisify(require('crypto').randomBytes);
const { createHash } = require('../utils/crypto-util');

/**
 * Export `TokenUtil`.
 */

module.exports = {

  /**
   * Generate random token.
   */

  generateRandomToken: function() {
    return randomBytes(256).then(function(buffer) {
      return createHash({ data: buffer, encoding: 'hex' });
    });
  }

};

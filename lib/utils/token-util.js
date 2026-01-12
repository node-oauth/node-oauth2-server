'use strict';

/**
 * Module dependencies.
 */

const randomBytes = require('crypto').randomBytes;

/**
 * Export `TokenUtil`.
 */

module.exports = {

  /**
   * Generate random token.
   */

  generateRandomToken: function() {
    return new Promise((resolve, reject) => {
      randomBytes(32, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data.toString('hex'));
        }
      });
    });
  }
};

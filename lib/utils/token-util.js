'use strict';

const randomBytes = require('crypto').randomBytes;

/**
 * @module TokenUtil
 */

/**
 * Generates random token as 32 byte hex string.
 * @function
 * @async
 * @return {Promise<string>}
 */
function generateRandomToken() {
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

module.exports = {
  generateRandomToken
};

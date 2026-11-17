'use strict';

const randomBytes = require('crypto').randomBytes;

/**
 * @module TokenUtil
 */

/**
 * Generates 32 random bytes encoded as 64 lowercase hexadecimal characters (0..9a..f).
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
  generateRandomToken,
};

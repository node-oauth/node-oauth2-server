'use strict';

/**
 * @module DateUtil
 */

/**
 * Returns the remaining seconds of expiration from now.
 * If the value is less than or equal zero, then it is considered expired.
 * @function
 * @param expiresAt {Date} The date at which something (e.g. a token) expires.
 * @return {number} The number of seconds until the expiration date.
 */
function getLifetimeFromExpiresAt(expiresAt) {
  return Math.floor((expiresAt - new Date()) / 1000);
}

module.exports = {
  getLifetimeFromExpiresAt,
};

'use strict';

/**
 * @module StringUtil
 */

/**
 * Encodes a string to a valid base64 string that
 * can be used as URL component.
 * @param str
 * @return {string}
 */
function base64URLEncode(str) {
  return str.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

module.exports = { base64URLEncode };

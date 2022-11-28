'use strict';

/**
 * Export `StringUtil`.
 */

module.exports = {
  /**
   *
   * @param str
   * @return {string}
   */
  base64URLEncode: function(str) {
    return str.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
};

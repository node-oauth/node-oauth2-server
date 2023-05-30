'use strict';

/**
 * Module dependencies.
 */
const { base64URLEncode } = require('../utils/string-util');
const { createHash } = require('../utils/crypto-util');
const codeChallengeRegexp = /^([a-zA-Z0-9.\-_~]){43,128}$/;
/**
 * Export `TokenUtil`.
 */

const pkce = {
  /**
   * Return hash for code-challenge method-type.
   *
   * @param method {String} the code challenge method
   * @param verifier {String} the code_verifier
   * @return {String|undefined}
   */
  getHashForCodeChallenge: function({ method, verifier }) {
    // to prevent undesired side-effects when passing some wird values
    // to createHash or base64URLEncode we first check if the values are right
    if (pkce.isValidMethod(method) && typeof verifier === 'string' && verifier.length > 0) {
      if (method === 'plain') {
        return verifier;
      }

      if (method === 'S256') {
        const hash = createHash({ data: verifier });
        return base64URLEncode(hash);
      }
    }
  },

  /**
   * Check if the request is a PCKE request. We assume PKCE if grant type is
   * 'authorization_code' and code verifier is present.
   *
   * @param grantType {String}
   * @param codeVerifier {String}
   * @return {boolean}
   */
  isPKCERequest: function ({ grantType, codeVerifier }) {
    return grantType === 'authorization_code' && !!codeVerifier;
  },

  /**
   * Matches a code verifier (or code challenge) against the following criteria:
   *
   * code-verifier = 43*128unreserved
   * unreserved = ALPHA / DIGIT / "-" / "." / "_" / "~"
   * ALPHA = %x41-5A / %x61-7A
   * DIGIT = %x30-39
   *
   * @see: https://datatracker.ietf.org/doc/html/rfc7636#section-4.1
   * @param codeChallenge {String}
   * @return {Boolean}
   */
  codeChallengeMatchesABNF: function (codeChallenge) {
    return typeof codeChallenge === 'string' &&
      !!codeChallenge.match(codeChallengeRegexp);
  },

  /**
   * Checks if the code challenge method is one of the supported methods
   * 'sha256' or 'plain'
   *
   * @param method {String}
   * @return {boolean}
   */
  isValidMethod: function (method) {
    return method === 'S256' || method === 'plain';
  }
};

module.exports = pkce;

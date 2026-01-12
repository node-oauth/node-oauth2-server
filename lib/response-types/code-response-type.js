'use strict';

/*
 * Module dependencies.
 */

const InvalidArgumentError = require('../errors/invalid-argument-error');
const url = require('url');

/**
 * @class
 * @classDesc
 */
class CodeResponseType {
  /**
     * @constructor
     * @param code
     * @throws {InvalidArgumentError} if {code} is missing
     */
  constructor(code) {
    if (!code) {
      throw new InvalidArgumentError('Missing parameter: `code`');
    }

    this.code = code;
  }

  /**
     * @param redirectUri
     * @return {UrlWithParsedQuery}
     * @throws {InvalidArgumentError} if redirectUri is missing
     */
  buildRedirectUri(redirectUri) {
    if (!redirectUri) {
      throw new InvalidArgumentError('Missing parameter: `redirectUri`');
    }

    const uri = url.parse(redirectUri, true);

    uri.query.code = this.code;
    uri.search = null;

    return uri;
  }
}

module.exports = CodeResponseType;

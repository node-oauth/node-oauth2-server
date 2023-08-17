'use strict';

/**
 * Module dependencies.
 */

const InvalidArgumentError = require('../errors/invalid-argument-error');
const url = require('url');

class CodeResponseType {
  constructor(code) {
    if (!code) {
      throw new InvalidArgumentError('Missing parameter: `code`');
    }

    this.code = code;
  }

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

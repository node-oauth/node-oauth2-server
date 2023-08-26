'use strict';

/**
 * Module dependencies.
 */

const InvalidArgumentError = require('./errors/invalid-argument-error');
const typeis = require('type-is');

class Request {
  constructor({ headers, method, query, body, ...otherOptions } = {}) {
    if (!headers) {
      throw new InvalidArgumentError('Missing parameter: `headers`');
    }

    if (!method) {
      throw new InvalidArgumentError('Missing parameter: `method`');
    }

    if (!query) {
      throw new InvalidArgumentError('Missing parameter: `query`');
    }

    this.body = body || {};
    this.headers = {};
    this.method = method;
    this.query = query;

    // Store the headers in lower case.
    Object.entries(headers).forEach(([header, value]) => {
      this.headers[header.toLowerCase()] = value;
    });

    // Store additional properties of the request object passed in
    Object.entries(otherOptions)
      .filter(([property]) => !this[property])
      .forEach(([property, value]) => {
        this[property] = value;
      });
  }

  /**
   * Get a request header.
   * @param {String} field
   */
  get(field) {
    return this.headers[field.toLowerCase()];
  }

  /**
   * Check if the content-type matches any of the given mime types.
   * @param {...String|Array} types
   */
  is(...types) {
    return typeis(this, types.flat()) || false;
  }
}

module.exports = Request;

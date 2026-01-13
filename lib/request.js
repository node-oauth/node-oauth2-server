'use strict';

/*
 * Module dependencies.
 */
const InvalidArgumentError = require('./errors/invalid-argument-error');
/* type-is: https://github.com/jshttp/type-is */
const typeis = require('type-is');

/**
 * Wrapper for webserver's request.
 * Used to decouple this package from the webserver's
 * request signature.
 * @class
 * @example
 * function (req, res, next) {
 *   // most webservers follow a similar structure
 *   const response = new Request(req);
 * }
 */
class Request {
  /**
     * Creates a new request instance
     * @constructor
     * @param headers {object} key-value object of headers
     * @param method {string} the HTTP method
     * @param query {object} key-value object of query parameters
     * @param body {object=} optional key-value object of body parameters
     * @param otherOptions {...object} any other properties that should be assigned to the request by your webserver
     * @throws {InvalidArgumentError} if one of headers, method or query are missing.
     */
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
   * Get a request header (case-insensitive).
   * @param {String} field
   * @return {string}
   */
  get(field) {
    return this.headers[field.toLowerCase()];
  }

  /**
   * Check if the content-type matches any of the given mime types.
   * @param {...string[]} types
   * @return {boolean}
   */
  is(...types) {
    return typeis(this, types.flat()) || false;
  }
}

module.exports = Request;

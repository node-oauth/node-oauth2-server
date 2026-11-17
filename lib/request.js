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
 * const { Request } = require('@node-oauth/oauth2-server');
 * const request = new Request({ method: 'GET', headers: {}, query: {} });
 */
class Request {
  /**
   * Creates a new request instance
   * Additional properties on options are copied onto the wrapper.
   * @constructor
   * @param options {object} Wrapper options.
   * @param options.headers {object} key-value object of headers
   * @param options.method {string} the HTTP method
   * @param options.query {object} key-value object of query parameters
   * @param options.body {object=} optional key-value object of body parameters
   * @throws {InvalidArgumentError} if one of headers, method or query are missing.
   * @example
   * const request = new Request({ method: 'GET', headers: {}, query: {} });
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
   * @return {string|undefined}
   */
  get(field) {
    return this.headers[field.toLowerCase()];
  }

  /**
   * Check if the content-type matches any of the given mime types.
   * @param {...string[]} types
   * @return {string|false}
   */
  is(...types) {
    return typeis(this, types.flat()) || false;
  }
}

module.exports = Request;

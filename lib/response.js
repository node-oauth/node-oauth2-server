'use strict';

/**
 * Wrapper for webserver's response object.
 * Used to decouple this package from the webserver's
 * response signature.
 * @class
 * @example
 * const { Response } = require('@node-oauth/oauth2-server');
 * const response = new Response({ headers: {}, body: {} });
 */
class Response {
  /**
   * Create a new Response instance.
   * Additional properties on options are copied onto the wrapper.
   * @constructor
   * @param [options] {object} Wrapper options.
   * @param [options.headers] {object} key-value object of headers
   * @param options.body {object=} optional key-value object of body parameters
   * @example
   * const response = new Response({ headers: {}, body: {} });
   */
  constructor({ headers = {}, body = {}, ...otherOptions } = {}) {
    this.status = 200;
    this.body = body;
    this.headers = {};

    // Store the headers in lower case.
    Object.entries(headers).forEach(([header, value]) => {
      this.headers[header.toLowerCase()] = value;
    });

    // Store additional properties of the response object passed in
    Object.entries(otherOptions)
      .filter(([property]) => !this[property])
      .forEach(([property, value]) => {
        this[property] = value;
      });
  }

  /**
   * Get a response header.
   * @param field {string} the field to access, case-insensitive
   * @return {string|undefined}
   */
  get(field) {
    return this.headers[field.toLowerCase()];
  }

  /**
   * Redirect response.
   * @param url {string} the url to redirect to
   */
  redirect(url) {
    this.set('Location', url);
    this.status = 302;
  }

  /**
   * Set a response header.
   * @param field {string} the name of the header field, case-insensitive
   * @param value {string} the new value of the header field
   */
  set(field, value) {
    this.headers[field.toLowerCase()] = value;
  }
}

module.exports = Response;

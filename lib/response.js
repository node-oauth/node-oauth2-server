'use strict';

class Response {
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
   */
  get(field) {
    return this.headers[field.toLowerCase()];
  }

  /**
   * Redirect response.
   */
  redirect(url) {
    this.set('Location', url);
    this.status = 302;
  }

  /**
   * Set a response header.
   */
  set(field, value) {
    this.headers[field.toLowerCase()] = value;
  }
}

module.exports = Response;

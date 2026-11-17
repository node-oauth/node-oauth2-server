'use strict';

/*
 * Module dependencies.
 */

const AbstractClientSecretAuthentication = require('./abstract-client-secret-authentication');

/**
 * @class ClientSecretPost
 * @classdesc
 * `client_secret_post`: `client_id` and `client_secret` supplied as
 * `application/x-www-form-urlencoded` request-body parameters.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-2.3.1
 * @extends AbstractClientSecretAuthentication
 */
class ClientSecretPost extends AbstractClientSecretAuthentication {
  presentedMethod() {
    return 'client_secret_post';
  }

  matches(request) {
    return !!(request.body.client_id && request.body.client_secret);
  }

  getCredentials(request) {
    return { clientId: request.body.client_id, clientSecret: request.body.client_secret };
  }
}

module.exports = ClientSecretPost;

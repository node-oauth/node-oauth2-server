'use strict';

/*
 * Module dependencies.
 */

const AbstractClientSecretAuthentication = require('./abstract-client-secret-authentication');
const auth = require('basic-auth');

/**
 * @class ClientSecretBasic
 * @classdesc
 * `client_secret_basic`: client credentials supplied via the HTTP Basic
 * `Authorization` header.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-2.3.1
 * @extends AbstractClientSecretAuthentication
 */
class ClientSecretBasic extends AbstractClientSecretAuthentication {
  presentedMethod() {
    return 'client_secret_basic';
  }

  matches(request) {
    return !!auth(request);
  }

  getCredentials(request) {
    const credentials = auth(request);

    return { clientId: credentials.name, clientSecret: credentials.pass };
  }
}

module.exports = ClientSecretBasic;

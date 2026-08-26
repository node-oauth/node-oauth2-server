'use strict';

/*
 * Module dependencies.
 */

const AbstractClientAuthentication = require('./abstract-client-authentication');
const InvalidClientError = require('../errors/invalid-client-error');
const InvalidRequestError = require('../errors/invalid-request-error');
const isFormat = require('@node-oauth/formats');

/**
 * @class None
 * @classdesc
 * `none`: a public client that identifies itself with `client_id` only and
 * presents no secret (e.g. a PKCE flow, or a grant for which
 * `requireClientAuthentication` is disabled).
 *
 * This adapter only resolves the client. Whether a secret-less client is
 * *acceptable* for the request is a policy decision owned by the orchestrator
 * (it knows the grant type, the `requireClientAuthentication` config and
 * whether this is a PKCE request).
 *
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-2.1
 * @extends AbstractClientAuthentication
 */
class None extends AbstractClientAuthentication {
  presentedMethod() {
    return 'none';
  }

  get requiresCredentials() {
    return false;
  }

  // A positive predicate only: the orchestrator owns mutual exclusion, so this
  // adapter needs no knowledge of other methods' credential shapes. `none` is
  // selected only as a fallback when no credentialed method matched.
  matches(request) {
    return !!request.body.client_id;
  }

  async authenticate(request, { model }) {
    const clientId = request.body.client_id;

    if (!isFormat.vschar(clientId)) {
      throw new InvalidRequestError('Invalid parameter: `client_id`');
    }

    const client = await model.getClient(clientId);

    if (!client) {
      throw new InvalidClientError('Invalid client: client is invalid');
    }

    return client;
  }
}

module.exports = None;

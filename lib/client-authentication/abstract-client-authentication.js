'use strict';

/*
 * Module dependencies.
 */

const InvalidArgumentError = require('../errors/invalid-argument-error');

/**
 * @class AbstractClientAuthentication
 * @classdesc
 * Port for a single client-authentication method — an OAuth
 * `token_endpoint_auth_method` (e.g. `client_secret_basic`, `private_key_jwt`).
 *
 * Concrete adapters are responsible only for (a) recognising their own
 * credential shape on the incoming request and (b) verifying those
 * credentials and resolving the client. *Selection* (which method applies,
 * rejecting requests that present more than one) and *post-validation* (the
 * client's `grants`) are owned by the orchestrator, not the adapter.
 *
 * This is deliberately minimal so that new methods — mTLS
 * (`tls_client_auth`), attestation, etc. — can be added without touching the
 * token handler. The built-in methods are themselves implemented against this
 * same port.
 *
 * @abstract
 */
class AbstractClientAuthentication {
  /**
   * The OAuth `token_endpoint_auth_method` this request presents
   * (e.g. `client_secret_basic`, `private_key_jwt`). For most methods this is
   * a constant; for JWT client assertions it is derived from the assertion's
   * algorithm. The orchestrator uses it to enforce a client's registered
   * `tokenEndpointAuthMethod`, when the client declares one.
   *
   * @param {Request} request
   * @return {string}
   */
  presentedMethod(request) {
    throw new InvalidArgumentError('Invalid argument: client authentication method must implement `presentedMethod()`');
  }

  /**
   * Whether this method presents client *credentials* (`true`) or merely
   * identifies a public client (`false`, e.g. the `none` method).
   *
   * The orchestrator uses this — not the `method` identifier — to enforce
   * that a request presents at most one credentialed mechanism and to decide
   * when a public client is acceptable. A new credentialed method (e.g.
   * `tls_client_auth`) therefore needs no changes elsewhere.
   *
   * @return {boolean}
   */
  get requiresCredentials() {
    return true;
  }

  /**
   * Does the request present credentials for this method?
   *
   * MUST be a cheap, side-effect-free predicate: no model calls, no network,
   * no throwing. The orchestrator calls this on every registered method to
   * decide which one applies.
   *
   * @param {Request} request the incoming token request
   * @return {boolean}
   */
  matches(request) {
    throw new InvalidArgumentError('Invalid argument: client authentication method must implement `matches()`');
  }

  /**
   * Verify the presented credentials and resolve the authenticated client.
   *
   * Implementations MUST throw an `InvalidClientError` when authentication
   * fails (or an `InvalidRequestError` for malformed input) and MUST NOT
   * return a falsy client for a credential they accepted.
   *
   * @param {Request} request the incoming token request
   * @param {object} context
   * @param {Model} context.model the configured model
   * @return {Promise<Client>} the authenticated client
   */
  async authenticate(request, context) {
    throw new InvalidArgumentError('Invalid argument: client authentication method must implement `authenticate()`');
  }
}

module.exports = AbstractClientAuthentication;

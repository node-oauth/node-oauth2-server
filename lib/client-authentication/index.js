'use strict';

/*
 * Module dependencies.
 */

const AbstractClientAuthentication = require('./abstract-client-authentication');
const ClientSecretBasic = require('./client-secret-basic');
const ClientSecretPost = require('./client-secret-post');
const JwtBearerClientAuthentication = require('./jwt-bearer-client-authentication');
const None = require('./none');
const InvalidClientError = require('../errors/invalid-client-error');
const InvalidRequestError = require('../errors/invalid-request-error');
const ServerError = require('../errors/server-error');

/**
 * @module client-authentication
 * @description
 * Pluggable client authentication for the token endpoint. Each
 * `token_endpoint_auth_method` is an adapter against
 * {@link AbstractClientAuthentication}; this module owns *selection* (pick the
 * one method that applies, reject requests presenting more than one) and the
 * shared *post-validation* of the resolved client.
 */

/**
 * The client-authentication methods enabled by default. These reproduce the
 * library's historical behaviour (HTTP Basic, request-body credentials, and
 * public clients). JWT client assertions are intentionally NOT enabled by
 * default — they require per-deployment configuration (the expected
 * `audience`) — and are added via the `extendedClientAuthentication` option.
 *
 * @return {Object<string, AbstractClientAuthentication>}
 */
function defaultClientAuthenticationMethods() {
  return {
    client_secret_basic: new ClientSecretBasic(),
    client_secret_post: new ClientSecretPost(),
    none: new None(),
  };
}

/**
 * Select the single client-authentication method that applies to the request
 * and use it to resolve and validate the authenticated client.
 *
 * @param {Request} request
 * @param {Response} response
 * @param {object} options
 * @param {Model} options.model the configured model
 * @param {Object<string, AbstractClientAuthentication>} options.methods the enabled methods
 * @param {boolean} options.clientAuthenticationRequired whether the grant requires client authentication
 * @param {boolean} options.isPKCE whether this is a PKCE request (public clients are always permitted)
 * @return {Promise<Client>} the authenticated client
 */
async function authenticateClient(request, response, options) {
  const { model, methods, clientAuthenticationRequired, isPKCE } = options;

  const method = selectMethod(request, methods, { clientAuthenticationRequired, isPKCE });

  try {
    const client = await method.authenticate(request, { model });

    if (!client.grants) {
      throw new ServerError('Server error: missing client `grants`');
    }

    if (!(client.grants instanceof Array)) {
      throw new ServerError('Server error: `grants` must be an array');
    }

    // Enforce the client's registered authentication method when it declares one
    // (RFC 7591 `token_endpoint_auth_method`). Clients without a registered
    // method are unconstrained, preserving backwards compatibility.
    const presented = method.presentedMethod(request);
    if (client.tokenEndpointAuthMethod && client.tokenEndpointAuthMethod !== presented) {
      throw new InvalidClientError(
        'Invalid client: `' + presented + '` is not a permitted authentication method for this client',
      );
    }

    return client;
  } catch (e) {
    // Per RFC 6749 §5.2, include the `WWW-Authenticate` response header when
    // the client attempted to authenticate via the `Authorization` header.
    if (e instanceof InvalidClientError && request.get('authorization')) {
      response.set('WWW-Authenticate', 'Basic realm="Service"');
      throw new InvalidClientError(e, { code: 401 });
    }

    throw e;
  }
}

/**
 * Decide which method authenticates this request.
 *
 * Rejects requests that present more than one credential-bearing mechanism
 * (RFC 6749 §2.3). When no credentials are presented, a public (`none`)
 * client is accepted only for PKCE requests or grants that do not require
 * client authentication.
 */
function selectMethod(request, methods, { clientAuthenticationRequired, isPKCE }) {
  const credentialed = [];
  let publicMethod = null;

  for (const method of Object.values(methods)) {
    if (!method.matches(request)) {
      continue;
    }

    if (method.requiresCredentials) {
      credentialed.push(method);
    } else {
      publicMethod = method;
    }
  }

  if (credentialed.length > 1) {
    throw new InvalidRequestError('Invalid request: multiple client authentication mechanisms');
  }

  if (credentialed.length === 1) {
    return credentialed[0];
  }

  if (publicMethod && (isPKCE || !clientAuthenticationRequired)) {
    return publicMethod;
  }

  throw new InvalidClientError('Invalid client: cannot retrieve client credentials');
}

module.exports = {
  AbstractClientAuthentication,
  ClientSecretBasic,
  ClientSecretPost,
  JwtBearerClientAuthentication,
  None,
  defaultClientAuthenticationMethods,
  authenticateClient,
};

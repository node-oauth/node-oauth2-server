'use strict';

/*
 * Module dependencies.
 */

const AbstractClientAuthentication = require('./abstract-client-authentication');
const InvalidClientError = require('../errors/invalid-client-error');
const ServerError = require('../errors/server-error');
const { decodeJwt, decodeProtectedHeader, jwtVerify, createLocalJWKSet } = require('jose');
const { algorithmsForHeader, isHmac, isValidationError, replayId, getRemoteJwks } = require('../utils/jws-util');

/**
 * The `client_assertion_type` value identifying a JWT client assertion.
 * @see https://datatracker.ietf.org/doc/html/rfc7523#section-2.2
 */
const CLIENT_ASSERTION_TYPE = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer';

/**
 * @class JwtBearerClientAuthentication
 * @classdesc
 * JWT client assertion authentication — `client_assertion` +
 * `client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer`.
 *
 * Covers both OIDC methods, distinguished by the JWS `alg` of the assertion:
 *   - `client_secret_jwt` — HMAC (`HS*`), keyed by the client secret;
 *   - `private_key_jwt`   — asymmetric (`RS*`/`PS*`/`ES*`), verified against
 *     the client's registered public keys (a JWK Set).
 *
 * The library owns the *protocol* (parse → resolve client → verify → bind);
 * key material and replay state come from the model/client. This method is
 * opt-in (it requires per-deployment `audience` configuration); register it
 * via the `extendedClientAuthentication` server option.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7521#section-4.2
 * @see https://datatracker.ietf.org/doc/html/rfc7523#section-2.2
 * @see https://datatracker.ietf.org/doc/html/rfc7523#section-3
 * @see https://openid.net/specs/openid-connect-core-1_0.html#ClientAuthentication
 * @extends AbstractClientAuthentication
 */
class JwtBearerClientAuthentication extends AbstractClientAuthentication {
  /**
   * @param {object} options
   * @param {string|string[]} options.audience the value(s) the assertion's
   *   `aud` claim must contain — typically this authorization server's token
   *   endpoint URL and/or its issuer identifier. REQUIRED.
   * @param {number} [options.maxTokenAge] maximum assertion age in seconds,
   *   measured from `iat` (enabling this requires assertions to carry `iat`).
   * @param {number} [options.clockTolerance] clock skew tolerance in seconds.
   * @param {string[]} [options.algorithms] override the accepted JWS algorithms.
   * @param {function} [options.getKey] `(client, header) => key` override key
   *   resolution. By default HMAC keys derive from `client.secret` and
   *   asymmetric keys come from `client.jwks` (a JWK Set) or `client.jwksUri`.
   */
  constructor(options = {}) {
    super();

    if (!options.audience) {
      throw new ServerError('Server error: `audience` is required for JWT client authentication');
    }

    this.audience = options.audience;
    this.maxTokenAge = options.maxTokenAge;
    this.clockTolerance = options.clockTolerance;
    this.algorithms = options.algorithms;
    this.getKey = options.getKey || this.defaultGetKey.bind(this);
  }

  matches(request) {
    return request.body.client_assertion_type === CLIENT_ASSERTION_TYPE && !!request.body.client_assertion;
  }

  // The concrete OIDC method depends on the assertion's signature algorithm:
  // an HMAC `alg` is `client_secret_jwt`; an asymmetric `alg` is `private_key_jwt`.
  // Only called after the assertion has been verified, so the header is decodable.
  presentedMethod(request) {
    const header = decodeProtectedHeader(request.body.client_assertion);
    return isHmac(header.alg) ? 'client_secret_jwt' : 'private_key_jwt';
  }

  async authenticate(request, { model }) {
    const assertion = request.body.client_assertion;

    // Decode (WITHOUT verifying) only to discover which client we must verify
    // against. Nothing read here is trusted: the value is used solely to look
    // up the client and its key, and `iss`/`sub` are re-bound to the resolved
    // client id *after* the signature is checked, below.
    let claims;
    let header;
    try {
      claims = decodeJwt(assertion);
      header = decodeProtectedHeader(assertion);
    } catch (e) {
      throw new InvalidClientError('Invalid client: `client_assertion` is malformed');
    }

    const clientId = claims.sub;
    if (!clientId) {
      throw new InvalidClientError('Invalid client: `client_assertion` is missing the `sub` claim');
    }

    // RFC 7521 §4.2: `client_id` is optional, but if present it MUST match.
    if (request.body.client_id && request.body.client_id !== clientId) {
      throw new InvalidClientError('Invalid client: `client_id` does not match the assertion subject');
    }

    const client = await model.getClient(clientId);
    if (!client) {
      throw new InvalidClientError('Invalid client: client is invalid');
    }

    const algorithms = this.algorithms || algorithmsForHeader(header);
    const key = await this.getKey(client, header);

    let payload;
    try {
      ({ payload } = await jwtVerify(assertion, key, {
        algorithms,
        audience: this.audience,
        issuer: clientId, // RFC 7523 §3: for client auth, `iss` MUST be the client_id
        subject: clientId, //              and `sub` MUST be the client_id
        requiredClaims: ['iss', 'sub', 'aud', 'exp'],
        maxTokenAge: this.maxTokenAge,
        clockTolerance: this.clockTolerance,
      }));
    } catch (e) {
      // An invalid assertion is the client's fault; a JWKS fetch failure or
      // other operational error is the server's — don't report it as a bad
      // credential, and don't leak the raw (possibly topology-revealing) message.
      if (isValidationError(e)) {
        throw new InvalidClientError('Invalid client: ' + e.message);
      }
      throw new ServerError(e);
    }

    await this.assertNotReplayed(model, payload, assertion);

    return client;
  }

  /**
   * Default key resolution: HMAC from the client secret, asymmetric from the
   * client's registered JWK Set (inline `jwks` or remote `jwksUri`).
   */
  async defaultGetKey(client, header) {
    if (isHmac(header.alg)) {
      if (typeof client.secret !== 'string' || client.secret.length === 0) {
        throw new InvalidClientError('Invalid client: client has no usable secret for `client_secret_jwt`');
      }
      return new TextEncoder().encode(client.secret);
    }

    if (client.jwks) {
      return createLocalJWKSet(client.jwks);
    }

    if (client.jwksUri) {
      return getRemoteJwks(client.jwksUri);
    }

    throw new InvalidClientError('Invalid client: client has no registered keys for `private_key_jwt`');
  }

  /**
   * Single-use replay protection. Opt-in: only enforced when the model
   * implements the replay hooks. The identifier passed to the hooks is the
   * assertion's `jti` when present, otherwise a fingerprint of its signing
   * input — so replay protection applies even to assertions without a `jti`
   * (OIDC Core §9 requires `jti`; RFC 7523 §3 makes it optional).
   */
  async assertNotReplayed(model, payload, assertion) {
    const canCheck = typeof model.isClientAssertionJtiUsed === 'function';
    const canSave = typeof model.saveClientAssertionJti === 'function';

    // Replay protection is opt-in, but it is only meaningful when the model can
    // both record AND check an identifier. A half-configured model would
    // silently provide no protection while appearing enabled, so reject that.
    if (!canCheck && !canSave) {
      return;
    }

    if (canCheck !== canSave) {
      throw new ServerError(
        'Server error: client assertion replay protection requires both `isClientAssertionJtiUsed` and `saveClientAssertionJti`',
      );
    }

    const id = replayId(assertion, payload.jti);

    if (await model.isClientAssertionJtiUsed(id)) {
      throw new InvalidClientError('Invalid client: `client_assertion` has already been used');
    }

    await model.saveClientAssertionJti(id, payload.exp);
  }
}

JwtBearerClientAuthentication.CLIENT_ASSERTION_TYPE = CLIENT_ASSERTION_TYPE;

module.exports = JwtBearerClientAuthentication;

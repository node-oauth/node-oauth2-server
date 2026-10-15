'use strict';

/*
 * Module dependencies.
 */

const AbstractGrantType = require('./abstract-grant-type');
const InvalidArgumentError = require('../errors/invalid-argument-error');
const InvalidGrantError = require('../errors/invalid-grant-error');
const InvalidRequestError = require('../errors/invalid-request-error');
const ServerError = require('../errors/server-error');
const { decodeJwt, decodeProtectedHeader, jwtVerify, createLocalJWKSet } = require('jose');
const { algorithmsForHeader, isHmac, isValidationError, replayId, getRemoteJwks } = require('../utils/jws-util');

/**
 * The `grant_type` value for the JWT bearer authorization grant.
 * @see https://datatracker.ietf.org/doc/html/rfc7523#section-2.1
 */
const GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:jwt-bearer';

/**
 * @class JwtBearerGrantType
 * @classdesc
 * The JWT bearer authorization grant (RFC 7521 §4.1, RFC 7523 §2.1/§3): a signed
 * JWT *is* the authorization grant. The assertion's `iss` identifies a trusted
 * issuer (whose key verifies the assertion) and `sub` identifies the principal
 * the access token is issued for. Unlike JWT *client authentication*, `sub` is
 * the user/principal — not the client — and `iss`/`sub` are not bound to the
 * client id.
 *
 * This is an extension grant; register it via `extendedGrantTypes`. The
 * requested `scope` is taken from the body parameter (RFC 7521 §4.1), and no
 * refresh token is issued (RFC 7521 §5.2).
 *
 * The model must implement:
 *   - `getJWTBearerIssuer(issuer)` → `{ audience, jwks | jwksUri | secret }` (or
 *     falsy for an untrusted issuer) — the verification key material and the
 *     expected `aud`.
 *   - `getJWTBearerUser({ issuer, subject, client, scope, jti, assertionId, exp })` → the
 *     authorized user (or falsy to deny). Replay (`jti`) can be enforced here.
 *
 * @example
 * new OAuth2Server({
 *   model,
 *   extendedGrantTypes: {
 *     'urn:ietf:params:oauth:grant-type:jwt-bearer': JwtBearerGrantType
 *   },
 *   // typically a public requester; identify it with `client_id`:
 *   requireClientAuthentication: { 'urn:ietf:params:oauth:grant-type:jwt-bearer': false }
 * });
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7521#section-4.1
 * @see https://datatracker.ietf.org/doc/html/rfc7523#section-2.1
 * @see https://datatracker.ietf.org/doc/html/rfc7523#section-3
 * @extends AbstractGrantType
 */
class JwtBearerGrantType extends AbstractGrantType {
  constructor(options = {}) {
    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }

    if (!options.model.getJWTBearerIssuer) {
      throw new InvalidArgumentError('Invalid argument: model does not implement `getJWTBearerIssuer()`');
    }

    if (!options.model.getJWTBearerUser) {
      throw new InvalidArgumentError('Invalid argument: model does not implement `getJWTBearerUser()`');
    }

    if (!options.model.saveToken) {
      throw new InvalidArgumentError('Invalid argument: model does not implement `saveToken()`');
    }

    super(options);

    this.maxTokenAge = options.maxTokenAge;
    this.clockTolerance = options.clockTolerance;
    this.algorithms = options.algorithms;
  }

  /**
   * Handle the JWT bearer grant.
   *
   * @param request {Request}
   * @param client {ClientData}
   * @see https://datatracker.ietf.org/doc/html/rfc7523#section-2.1
   */
  async handle(request, client) {
    if (!request) {
      throw new InvalidArgumentError('Missing parameter: `request`');
    }

    if (!client) {
      throw new InvalidArgumentError('Missing parameter: `client`');
    }

    const payload = await this.verifyAssertion(request);
    const scope = this.getScope(request);
    const user = await this.getUser(payload, client, scope, request.body.assertion);

    return this.saveToken(user, client, scope);
  }

  /**
   * Verify the `assertion` and return its (trusted) claims.
   */
  async verifyAssertion(request) {
    const assertion = request.body.assertion;

    if (!assertion) {
      throw new InvalidRequestError('Missing parameter: `assertion`');
    }

    // Decode (without verifying) only to discover the issuer we must verify
    // against; nothing here is trusted until the signature is checked.
    let issuer;
    let header;
    try {
      issuer = decodeJwt(assertion).iss;
      header = decodeProtectedHeader(assertion);
    } catch (e) {
      throw new InvalidGrantError('Invalid grant: `assertion` is malformed');
    }

    if (!issuer) {
      throw new InvalidGrantError('Invalid grant: `assertion` is missing the `iss` claim');
    }

    const issuerData = await this.model.getJWTBearerIssuer(issuer);
    if (!issuerData) {
      throw new InvalidGrantError('Invalid grant: `assertion` issuer is not trusted');
    }

    if (!issuerData.audience || (Array.isArray(issuerData.audience) && issuerData.audience.length === 0)) {
      throw new ServerError('Server error: `getJWTBearerIssuer()` did not return an `audience`');
    }

    const algorithms = this.algorithms || algorithmsForHeader(header);
    const key = await this.getKey(issuerData, header);

    try {
      const { payload } = await jwtVerify(assertion, key, {
        algorithms,
        audience: issuerData.audience,
        issuer,
        requiredClaims: ['iss', 'sub', 'aud', 'exp'],
        maxTokenAge: this.maxTokenAge,
        clockTolerance: this.clockTolerance,
      });

      return payload;
    } catch (e) {
      if (isValidationError(e)) {
        throw new InvalidGrantError('Invalid grant: ' + e.message);
      }
      throw new ServerError(e);
    }
  }

  /**
   * Resolve the verification key for the issuer (HMAC secret or asymmetric JWKS).
   */
  async getKey(issuerData, header) {
    const hasSecret = typeof issuerData.secret === 'string' && issuerData.secret.length > 0;
    const hasJwks = !!issuerData.jwks || !!issuerData.jwksUri;

    // No key material at all is a server-side misconfiguration of the issuer.
    if (!hasSecret && !hasJwks) {
      throw new ServerError('Server error: issuer has no key material for assertion verification');
    }

    if (isHmac(header.alg)) {
      // The issuer has key material, just not for this algorithm family — that
      // makes the assertion unverifiable against this issuer, i.e. the client's
      // fault, not the server's.
      if (!hasSecret) {
        throw new InvalidGrantError('Invalid grant: assertion algorithm does not match the issuer key material');
      }
      return new TextEncoder().encode(issuerData.secret);
    }

    if (!hasJwks) {
      throw new InvalidGrantError('Invalid grant: assertion algorithm does not match the issuer key material');
    }

    if (issuerData.jwks) {
      return createLocalJWKSet(issuerData.jwks);
    }

    return getRemoteJwks(issuerData.jwksUri);
  }

  /**
   * Resolve and authorize the principal (`sub`) the token is issued for.
   */
  async getUser(payload, client, scope, assertion) {
    const user = await this.model.getJWTBearerUser({
      issuer: payload.iss,
      subject: payload.sub,
      client,
      scope,
      jti: payload.jti,
      assertionId: replayId(assertion, payload.jti),
      exp: payload.exp,
    });

    if (!user) {
      throw new InvalidGrantError('Invalid grant: the assertion subject is not authorized');
    }

    return user;
  }

  /**
   * Save and return the access token. No refresh token is issued (RFC 7521 §5.2).
   */
  async saveToken(user, client, requestedScope) {
    const validatedScope = await this.validateScope(user, client, requestedScope);
    const accessToken = await this.generateAccessToken(client, user, validatedScope);
    const accessTokenExpiresAt = this.getAccessTokenExpiresAt(client, user, validatedScope);

    const token = {
      accessToken,
      accessTokenExpiresAt,
      scope: validatedScope,
    };

    return this.model.saveToken(token, client, user);
  }
}

JwtBearerGrantType.GRANT_TYPE = GRANT_TYPE;

module.exports = JwtBearerGrantType;

'use strict';

/*
 * Module dependencies.
 */

const AbstractGrantType = require('./abstract-grant-type');
const InvalidArgumentError = require('../errors/invalid-argument-error');
const InvalidClientError = require('../errors/invalid-client-error');
const InvalidGrantError = require('../errors/invalid-grant-error');
const InvalidRequestError = require('../errors/invalid-request-error');
const InvalidScopeError = require('../errors/invalid-scope-error');
const jwtUtil = require('../utils/jwt-util');
const { parseScope } = require('../utils/scope-util');

/**
 * The `typ` header value mandated by ID-JAG Section 3.1. Any other value,
 * including the generic `JWT`, is a type-confusion attempt and MUST be
 * rejected.
 */
const ID_JAG_TYPE = 'oauth-id-jag+jwt';

/**
 * Default signature algorithm allow-list (ID-JAG Section 3.1 note on
 * algorithm confusion): `alg=none` and HMAC (`HS*`) are never permitted,
 * since the Resource AS has no symmetric secret shared with the IdP.
 */
const DEFAULT_ALGORITHMS = ['RS256', 'ES256', 'PS256'];

const DEFAULT_CLOCK_SKEW = 60;

const REQUIRED_ASSERTION_CLAIMS = ['iss', 'sub', 'aud', 'client_id', 'jti', 'exp', 'iat'];

/**
 * @class
 * @classDesc Implements the JWT Bearer grant
 * (`urn:ietf:params:oauth:grant-type:jwt-bearer`, RFC 7523) profiled by the
 * Identity Assertion Authorization Grant (ID-JAG) draft. Lets this library
 * act as the **Resource Authorization Server** side of a Cross App Access
 * exchange: it consumes an ID-JAG assertion minted by an external Identity
 * Provider and, once verified, issues a locally-scoped access token.
 *
 * Minting the ID-JAG itself (the IdP side, RFC 8693 Token Exchange) is out
 * of scope for this grant.
 *
 * @see https://datatracker.ietf.org/doc/html/draft-ietf-oauth-identity-assertion-authz-grant
 * @see https://tools.ietf.org/html/rfc7523
 */
class JwtBearerGrantType extends AbstractGrantType {
  /**
   * @constructor
   * @param options {object}
   * @param options.tokenEndpointUri {string} this Resource AS's issuer identifier (RFC 8414). Assertions must carry this exact value as their `aud` claim.
   * @param [options.idJagClockSkew=60] {number} allowed clock-skew tolerance, in seconds, applied to `exp`/`iat`/`nbf`.
   * @param [options.jwtBearerAllowedAlgorithms] {string[]} signature algorithm allow-list, defaults to `['RS256', 'ES256', 'PS256']`.
   * @param [options.jwtBearerAllowPublicClients=false] {boolean} relax the confidential-client-only restriction (ID-JAG Section 8.1). Intended for non-production environments only.
   * @throws {InvalidArgumentError} if a required option or model method is missing
   */
  constructor(options = {}) {
    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }

    for (const method of [
      'getTrustedIssuer',
      'getRequestingIssuerKey',
      'getUserFromIdJagAssertion',
      'validateIdJagPermission',
    ]) {
      if (typeof options.model[method] !== 'function') {
        throw new InvalidArgumentError(`Invalid argument: model does not implement \`${method}()\``);
      }
    }

    const hasAtomicReplayCheck = typeof options.model.validateJti === 'function';
    const hasSplitReplayCheck =
      typeof options.model.isJtiUsed === 'function' && typeof options.model.recordJti === 'function';

    if (!hasAtomicReplayCheck && !hasSplitReplayCheck) {
      throw new InvalidArgumentError(
        'Invalid argument: model does not implement `validateJti()` (or `isJtiUsed()` and `recordJti()`)',
      );
    }

    if (!options.model.saveToken) {
      throw new InvalidArgumentError('Invalid argument: model does not implement `saveToken()`');
    }

    if (!options.tokenEndpointUri) {
      throw new InvalidArgumentError('Missing parameter: `tokenEndpointUri`');
    }

    super(options);

    this.tokenEndpointUri = options.tokenEndpointUri;
    this.clockSkew = options.idJagClockSkew != null ? options.idJagClockSkew : DEFAULT_CLOCK_SKEW;
    this.allowedAlgorithms = options.jwtBearerAllowedAlgorithms || DEFAULT_ALGORITHMS;
    this.allowPublicClients = options.jwtBearerAllowPublicClients === true;

    if (this.allowPublicClients) {
      // eslint-disable-next-line no-console
      console.warn(
        '[node-oauth2-server] jwt-bearer grant: `jwtBearerAllowPublicClients` is enabled. ' +
          'Per ID-JAG Section 8.1 this grant SHOULD only be used by confidential clients; ' +
          'only relax this for non-production environments.',
      );
    }
  }

  /**
   * Handle the jwt-bearer grant.
   *
   * @see https://tools.ietf.org/html/rfc7523#section-2.1
   * @see https://datatracker.ietf.org/doc/html/draft-ietf-oauth-identity-assertion-authz-grant
   */
  async handle(request, client) {
    if (!request) {
      throw new InvalidArgumentError('Missing parameter: `request`');
    }

    if (!client) {
      throw new InvalidArgumentError('Missing parameter: `client`');
    }

    this.assertConfidentialClient(request);

    const assertion = this.getAssertion(request);

    // Parse only — the payload is untrusted until `verified` below is true.
    const decoded = jwtUtil.decodeJwt(assertion);

    this.assertValidHeader(decoded.header);

    const issuer = decoded.payload.iss;

    if (typeof issuer !== 'string' || issuer.length === 0) {
      this.rejectAssertion();
    }

    const trustedIssuer = await this.model.getTrustedIssuer(issuer);

    if (!trustedIssuer) {
      this.rejectAssertion();
    }

    const rawKey = await this.model.getRequestingIssuerKey(issuer, decoded.header.kid);

    if (!rawKey) {
      this.rejectAssertion();
    }

    let keyObject;

    try {
      keyObject = jwtUtil.toPublicKeyObject(rawKey);
    } catch {
      this.rejectAssertion();
    }

    const verified = jwtUtil.verifySignature(
      decoded.signingInput,
      decoded.signature,
      decoded.header.alg,
      keyObject,
      this.allowedAlgorithms,
    );

    if (!verified) {
      this.rejectAssertion();
    }

    // The signature covers header+payload as one unit, so a successful
    // verification means every claim in `decoded.payload` — including
    // `iss`, read above only to resolve the key — is now trustworthy.
    const payload = decoded.payload;

    this.assertValidClaims(payload, client);

    await this.checkReplay(payload.iss, payload.jti, payload.exp);

    const user = await this.model.getUserFromIdJagAssertion(payload.iss, payload.sub, client);

    if (!user) {
      this.rejectAssertion();
    }

    const scope = this.getNarrowedScope(request, payload);

    const permitted = await this.model.validateIdJagPermission(client, user, scope, payload);

    if (!permitted) {
      this.rejectAssertion();
    }

    return this.saveToken(user, client, scope);
  }

  /**
   * ID-JAG Section 8.1: this grant SHOULD only be supported for
   * confidential clients. The library does not otherwise track a
   * public/confidential flag on `Client`, so this checks whether the
   * request actually authenticated with a client secret (Basic auth or
   * `client_secret` body param) rather than relying on client metadata.
   */
  assertConfidentialClient(request) {
    if (this.allowPublicClients) {
      return;
    }

    const authHeader = request.headers && (request.headers.authorization || request.headers.Authorization);
    const hasBasicAuth = typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('basic ');
    const hasBodySecret = Boolean(request.body && request.body.client_secret);

    if (!hasBasicAuth && !hasBodySecret) {
      throw new InvalidClientError('Invalid client: `jwt-bearer` grant requires a confidential client');
    }
  }

  /**
   * Get the `assertion` request parameter.
   */
  getAssertion(request) {
    const assertion = request.body && request.body.assertion;

    if (typeof assertion !== 'string' || assertion.length === 0) {
      throw new InvalidRequestError('Missing parameter: `assertion`');
    }

    return assertion;
  }

  /**
   * ID-JAG Section 3.1: enforce `typ` exactly and `alg` against the
   * allow-list before any cryptographic work.
   */
  assertValidHeader(header) {
    if (header.typ !== ID_JAG_TYPE) {
      this.rejectAssertion();
    }

    if (typeof header.alg !== 'string' || !this.allowedAlgorithms.includes(header.alg)) {
      this.rejectAssertion();
    }
  }

  /**
   * ID-JAG Section 3.1: required claims, temporal validity with
   * configurable clock skew, audience and client binding. Only ever
   * called on an already-verified payload.
   */
  assertValidClaims(payload, client) {
    for (const claim of REQUIRED_ASSERTION_CLAIMS) {
      if (payload[claim] === undefined || payload[claim] === null || payload[claim] === '') {
        this.rejectAssertion();
      }
    }

    const now = Math.floor(Date.now() / 1000);

    if (typeof payload.exp !== 'number' || payload.exp + this.clockSkew < now) {
      this.rejectAssertion();
    }

    if (typeof payload.iat !== 'number' || payload.iat - this.clockSkew > now) {
      this.rejectAssertion();
    }

    if (payload.nbf !== undefined && (typeof payload.nbf !== 'number' || payload.nbf - this.clockSkew > now)) {
      this.rejectAssertion();
    }

    // Per ID-JAG Section 3.1, `aud` is this Resource AS's RFC 8414 issuer
    // identifier — not the token endpoint URL.
    if (payload.aud !== this.tokenEndpointUri) {
      this.rejectAssertion();
    }

    if (payload.client_id !== client.id) {
      this.rejectAssertion();
    }
  }

  /**
   * ID-JAG Section 9 (replay protection). Fails closed: any error from the
   * model's replay store — including "already seen" — is treated as a
   * rejected assertion, never as an implicit pass.
   */
  async checkReplay(issuer, jti, exp) {
    try {
      if (typeof this.model.validateJti === 'function') {
        const notReplayed = await this.model.validateJti(jti, issuer, exp);

        if (!notReplayed) {
          this.rejectAssertion();
        }

        return;
      }

      const alreadyUsed = await this.model.isJtiUsed(jti, issuer);

      if (alreadyUsed) {
        this.rejectAssertion();
      }

      await this.model.recordJti(jti, issuer, exp);
    } catch (err) {
      if (err instanceof InvalidGrantError) {
        throw err;
      }

      this.rejectAssertion();
    }
  }

  /**
   * ID-JAG Section 4.4.1: if the assertion carries a `scope` claim, the
   * issued token's scope MUST be the intersection of that and any `scope`
   * parameter on the token request.
   */
  getNarrowedScope(request, payload) {
    const requestedScope = this.getScope(request);
    const assertionScope =
      typeof payload.scope === 'string' && payload.scope.length > 0 ? parseScope(payload.scope) : undefined;

    if (!assertionScope) {
      return requestedScope;
    }

    if (!requestedScope) {
      return assertionScope;
    }

    const narrowedScope = requestedScope.filter((scope) => assertionScope.includes(scope));

    if (narrowedScope.length !== requestedScope.length) {
      throw new InvalidScopeError('Invalid scope: requested scope exceeds the scope granted by the assertion');
    }

    return narrowedScope;
  }

  /**
   * Save token.
   *
   * Per ID-JAG Section 4.4.3 the Resource AS MUST NOT issue a
   * `refresh_token` when an ID-JAG is exchanged for an access token
   * (stricter than the draft's SHOULD NOT) — clients always fetch a fresh
   * ID-JAG when they need a new access token.
   */
  async saveToken(user, client, requestedScope) {
    const scope = await this.validateScope(user, client, requestedScope);
    const accessToken = await this.generateAccessToken(client, user, scope);
    const accessTokenExpiresAt = this.getAccessTokenExpiresAt();

    const token = {
      accessToken,
      accessTokenExpiresAt,
      scope,
    };

    return this.model.saveToken(token, client, user);
  }

  /**
   * Reject the assertion with a single, non-specific error message.
   * Per ID-JAG error handling guidance, the response MUST NOT leak which
   * particular validation step failed (type confusion vs. bad signature
   * vs. untrusted issuer vs. expired, etc. all look identical to the
   * caller), so every assertion-validation failure funnels through here.
   */
  rejectAssertion() {
    throw new InvalidGrantError('Invalid grant: `assertion` is invalid');
  }
}

/**
 * Export constructor.
 */

module.exports = JwtBearerGrantType;

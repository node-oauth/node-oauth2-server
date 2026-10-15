'use strict';

/*
 * Module dependencies.
 */

const { createRemoteJWKSet } = require('jose');
const { createHash } = require('crypto');

/**
 * @module jws-util
 * @description
 * Shared JWS/JWT helpers for the JWT assertion features (client authentication
 * and the JWT bearer grant). These encode security-sensitive policy — the
 * algorithm-family pinning that prevents algorithm-confusion, and the
 * classification of jose errors as client/grant faults vs. operational
 * (server) faults — so both features stay aligned by sharing one source.
 */

/*
 * Accepted JWS algorithms per key type. Pinning the algorithm *family* to the
 * key type prevents algorithm-confusion: an asymmetric ("private key") client
 * must use an asymmetric algorithm, and an attacker cannot submit an `HS256`
 * token to be verified with an RSA public key as the HMAC secret.
 */
const HMAC_ALGS = ['HS256', 'HS384', 'HS512'];
const ASYMMETRIC_ALGS = ['RS256', 'RS384', 'RS512', 'PS256', 'PS384', 'PS512', 'ES256', 'ES384', 'ES512', 'EdDSA'];

/*
 * jose error codes that represent an *invalid assertion* (the caller's fault →
 * `invalid_client` / `invalid_grant`) as opposed to an operational fault such
 * as a JWKS fetch failure (the server's fault → `server_error`). Anything not
 * listed here is treated as a server error rather than mis-reported as a bad
 * credential, and its (possibly topology-revealing) message is not surfaced.
 */
const JOSE_VALIDATION_CODES = new Set([
  'ERR_JWS_SIGNATURE_VERIFICATION_FAILED',
  'ERR_JWS_INVALID',
  'ERR_JWT_INVALID',
  'ERR_JWT_EXPIRED',
  'ERR_JWT_CLAIM_VALIDATION_FAILED',
  'ERR_JOSE_ALG_NOT_ALLOWED',
  'ERR_JOSE_NOT_SUPPORTED',
  'ERR_JWKS_NO_MATCHING_KEY',
  'ERR_JWKS_MULTIPLE_MATCHING_KEYS',
]);

/*
 * Module-level cache of remote JWK sets, keyed by URI, so jose's built-in
 * caching, cooldown and rate-limiting apply across requests. This must live at
 * module scope: per-request consumers (e.g. grant types, which are
 * instantiated per request) would otherwise build a fresh set every time and
 * defeat those protections, amplifying load against the JWKS endpoint.
 */
const remoteJwksCache = new Map();

/**
 * Whether a JWS algorithm is an HMAC (`HS*`) algorithm.
 * @param {string} alg
 * @return {boolean}
 */
function isHmac(alg) {
  return typeof alg === 'string' && alg.startsWith('HS');
}

/**
 * The accepted algorithm family for a JWS header (HMAC vs. asymmetric).
 * @param {object} header the decoded JWS protected header
 * @return {string[]}
 */
function algorithmsForHeader(header) {
  return isHmac(header.alg) ? HMAC_ALGS : ASYMMETRIC_ALGS;
}

/**
 * Whether a thrown error is a jose assertion-validation error (vs. operational).
 * @param {Error} e
 * @return {boolean}
 */
function isValidationError(e) {
  return !!e && JOSE_VALIDATION_CODES.has(e.code);
}

/**
 * A stable replay identifier for an assertion: its `jti` claim when present,
 * otherwise a fingerprint of the JWS *signing input* (`header.payload`).
 *
 * The signing input — not the full compact JWT — is hashed on purpose: ECDSA
 * signatures are malleable (a valid `(r, s)` yields a valid `(r, n-s)`), so a
 * fingerprint over the whole token could be evaded by replaying a re-encoded
 * signature. The signing input is identical across such variants.
 *
 * @param {string} assertion the compact JWT (verified before this is called)
 * @param {string} [jti] the assertion's `jti` claim, if present
 * @return {string}
 */
function replayId(assertion, jti) {
  if (jti) {
    return jti;
  }

  const signingInput = assertion.slice(0, assertion.lastIndexOf('.'));

  return createHash('sha256').update(signingInput).digest('base64url');
}

/**
 * Resolve a (cached) remote JWK Set for the given URI.
 * @param {string} uri
 * @return {function} a jose key-resolution function
 */
function getRemoteJwks(uri) {
  let jwks = remoteJwksCache.get(uri);

  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(uri));
    remoteJwksCache.set(uri, jwks);
  }

  return jwks;
}

module.exports = {
  HMAC_ALGS,
  ASYMMETRIC_ALGS,
  JOSE_VALIDATION_CODES,
  isHmac,
  algorithmsForHeader,
  isValidationError,
  replayId,
  getRemoteJwks,
};

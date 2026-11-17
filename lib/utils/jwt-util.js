'use strict';

/*
 * Module dependencies.
 */

const crypto = require('crypto');
const InvalidRequestError = require('../errors/invalid-request-error');

/**
 * @module JwtUtil
 * @description Minimal, dependency-free helpers for decoding and verifying
 * compact JWS/JWT structures. Intentionally uses only Node's built-in
 * `crypto` module (no `jsonwebtoken`/`jose`/etc.) so grant types built on
 * top of it (e.g. the JWT Bearer / ID-JAG grant) don't pull in a new
 * third-party dependency.
 */

/**
 * Maps a JWS `alg` value to the `crypto.verify()` call needed to check it.
 * Deliberately excludes `none` and HMAC (`HS*`) algorithms: a Resource
 * Authorization Server verifying an externally-minted assertion has no
 * business trusting an unsigned token or sharing a symmetric secret with
 * the issuer.
 */
const ALGORITHMS = {
  RS256: { hashAlgorithm: 'RSA-SHA256' },
  PS256: {
    hashAlgorithm: 'sha256',
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
  },
  ES256: { hashAlgorithm: 'sha256', dsaEncoding: 'ieee-p1363' },
};

/**
 * Base64url-decode (RFC 4648 §5) a string into a `Buffer`.
 * @function
 * @param input {string}
 * @return {Buffer}
 */
function base64UrlDecode(input) {
  return Buffer.from(input, 'base64url');
}

/**
 * Splits a compact JWT into its header, payload and signing input, and
 * parses the header/payload JSON. Performs no cryptographic verification:
 * callers MUST treat the returned `payload` as untrusted until
 * `verifySignature` confirms it, per the "parse header to dispatch, verify,
 * then re-read claims from the verified payload" order of operations.
 *
 * @function
 * @param token {string} the compact JWT (`header.payload.signature`)
 * @throws {InvalidRequestError} if `token` is not a well-formed compact JWT
 * @return {{header: object, payload: object, signature: Buffer, signingInput: string}}
 */
function decodeJwt(token) {
  if (typeof token !== 'string' || token.length === 0) {
    throw new InvalidRequestError('Invalid parameter: `assertion`');
  }

  const parts = token.split('.');

  if (parts.length !== 3 || parts.some((part) => part.length === 0)) {
    throw new InvalidRequestError('Invalid parameter: `assertion`');
  }

  const [headerPart, payloadPart, signaturePart] = parts;
  let header;
  let payload;

  try {
    header = JSON.parse(base64UrlDecode(headerPart).toString('utf8'));
    payload = JSON.parse(base64UrlDecode(payloadPart).toString('utf8'));
  } catch {
    throw new InvalidRequestError('Invalid parameter: `assertion`');
  }

  if (typeof header !== 'object' || header === null || typeof payload !== 'object' || payload === null) {
    throw new InvalidRequestError('Invalid parameter: `assertion`');
  }

  return {
    header,
    payload,
    signature: base64UrlDecode(signaturePart),
    signingInput: `${headerPart}.${payloadPart}`,
  };
}

/**
 * Verifies a JWS signature using one of the allowed asymmetric algorithms.
 *
 * @function
 * @param signingInput {string} `header.payload`, as returned by `decodeJwt`
 * @param signature {Buffer} the decoded signature bytes
 * @param alg {string} the `alg` value from the (still unverified) header
 * @param key {crypto.KeyObject} the issuer's public key
 * @param allowedAlgorithms {string[]} allow-list of acceptable `alg` values
 * @return {boolean} `true` if, and only if, `alg` is allowed *and* the signature is valid
 */
function verifySignature(signingInput, signature, alg, key, allowedAlgorithms) {
  if (!Array.isArray(allowedAlgorithms) || !allowedAlgorithms.includes(alg)) {
    return false;
  }

  const spec = ALGORITHMS[alg];

  if (!spec) {
    return false;
  }

  const { hashAlgorithm, ...verifyOptions } = spec;

  try {
    return crypto.verify(hashAlgorithm, Buffer.from(signingInput, 'utf8'), { key, ...verifyOptions }, signature);
  } catch {
    // Malformed key/signature material is indistinguishable from an
    // invalid signature as far as the caller is concerned.
    return false;
  }
}

/**
 * Normalizes the key material returned by a model's
 * `getRequestingIssuerKey()` implementation — a PEM string, a JWK object,
 * or an already-constructed `crypto.KeyObject` — into a `crypto.KeyObject`.
 *
 * @function
 * @param rawKey {string|object|crypto.KeyObject}
 * @throws {Error} if the key material cannot be parsed
 * @return {crypto.KeyObject}
 */
function toPublicKeyObject(rawKey) {
  if (rawKey instanceof crypto.KeyObject) {
    return rawKey;
  }

  if (typeof rawKey === 'string') {
    return crypto.createPublicKey(rawKey);
  }

  if (rawKey && typeof rawKey === 'object') {
    return crypto.createPublicKey({ key: rawKey, format: 'jwk' });
  }

  throw new Error('Unresolvable signing key');
}

module.exports = {
  decodeJwt,
  verifySignature,
  toPublicKeyObject,
};

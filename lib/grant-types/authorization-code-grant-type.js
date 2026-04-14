'use strict';

/*
 * Module dependencies.
 */
const crypto = require('crypto');
const AbstractGrantType = require('./abstract-grant-type');
const InvalidArgumentError = require('../errors/invalid-argument-error');
const InvalidGrantError = require('../errors/invalid-grant-error');
const InvalidRequestError = require('../errors/invalid-request-error');
const ServerError = require('../errors/server-error');
const isFormat = require('@node-oauth/formats');
const pkce = require('../pkce/pkce');

/**
 * @class
 * @classDesc
 */
class AuthorizationCodeGrantType extends AbstractGrantType {
  /**
     * @constructor
     * @param options
     */
  constructor(options = {}) {
    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }

    if (!options.model.getAuthorizationCode) {
      throw new InvalidArgumentError('Invalid argument: model does not implement `getAuthorizationCode()`');
    }

    if (!options.model.revokeAuthorizationCode) {
      throw new InvalidArgumentError('Invalid argument: model does not implement `revokeAuthorizationCode()`');
    }

    if (!options.model.saveToken) {
      throw new InvalidArgumentError('Invalid argument: model does not implement `saveToken()`');
    }

    super(options);

    // xxx: plain PKCE is only allowed if explicitly enabled
    this.enablePlainPKCE = options.enablePlainPKCE === true;
  }

  /**
	 * Handle authorization code grant.
	 *
     * @param request {Request}
     * @param client {ClientData}
	 * @see https://tools.ietf.org/html/rfc6749#section-4.1.3
	 */

  async handle(request, client) {
    if (!request) {
      throw new InvalidArgumentError('Missing parameter: `request`');
    }

    if (!client) {
      throw new InvalidArgumentError('Missing parameter: `client`');
    }

    const code = await this.getAuthorizationCode(request, client);
    await this.revokeAuthorizationCode(code);
    // xxx: PKCE verification is done after revoking the code,
    // so that a failed verification attempt consumes the code and prevents
    // online brute-force guessing.
    await this.verifyPKCE(request, code);
    await this.validateRedirectUri(request, code);

    return this.saveToken(code.user, client, code.authorizationCode, code.scope);
  }

  /**
     * Get the authorization code.
     * @param request {Request}
     * @param client {ClientData}
     * @return {Promise<{user}>}
     */

  async getAuthorizationCode(request, client) {
    if (!request.body.code) {
      throw new InvalidRequestError('Missing parameter: `code`');
    }

    if (!isFormat.vschar(request.body.code)) {
      throw new InvalidRequestError('Invalid parameter: `code`');
    }

    const code = await this.model.getAuthorizationCode(request.body.code);

    if (!code) {
      throw new InvalidGrantError('Invalid grant: authorization code is invalid');
    }

    if (!code.client) {
      throw new ServerError('Server error: `getAuthorizationCode()` did not return a `client` object');
    }

    if (!code.user) {
      throw new ServerError('Server error: `getAuthorizationCode()` did not return a `user` object');
    }

    if (code.client.id !== client.id) {
      throw new InvalidGrantError('Invalid grant: authorization code is invalid');
    }

    if (!(code.expiresAt instanceof Date)) {
      throw new ServerError('Server error: `expiresAt` must be a Date instance');
    }

    if (code.expiresAt < new Date()) {
      throw new InvalidGrantError('Invalid grant: authorization code has expired');
    }

    if (code.redirectUri && !isFormat.uri(code.redirectUri)) {
      throw new InvalidGrantError('Invalid grant: `redirect_uri` is not a valid URI');
    }

    return code;
  }

  /**
   * Verify PKCE code_verifier against the stored code_challenge.
   *
   * This is called from handle() AFTER the authorization code has been
   * revoked, so that a failed verification attempt consumes the code
   * and prevents online brute-force guessing.
   *
   * @param request {Request}
   * @param code {AuthorizationCodeData}
   * @see https://datatracker.ietf.org/doc/html/rfc7636#section-4.6
   */

  verifyPKCE(request, code) {
    if (code.codeChallenge) {
      const method = this.getCodeChallengeMethod(code.codeChallengeMethod);

      if (!this.enablePlainPKCE && method === 'plain') {
        throw new InvalidRequestError('Invalid request: `code_challenge_method` "plain" is not allowed; use "S256"');
      }

      if (!request.body.code_verifier) {
        throw new InvalidGrantError('Missing parameter: `code_verifier`');
      }

      if (!pkce.codeChallengeMatchesABNF(request.body.code_verifier)) {
        throw new InvalidRequestError('Invalid parameter: `code_verifier` does not match the ABNF (RFC 7636 §4.1)');
      }

      const hash = pkce.getHashForCodeChallenge({
        verifier: request.body.code_verifier,
        method
      });

      if (!hash) {
        throw new ServerError('Server error: no valid hash algorithm available to verify `code_verifier`');
      }

      // xxx: Use timingSafeEqual to prevent against timing attacks when comparing
      // the hash of the code_verifier to the stored code_challenge.
      const hashesAreEqual = crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(code.codeChallenge));

      if (!hashesAreEqual) {
        throw new InvalidGrantError('Invalid grant: code verifier is invalid');
      }
    }
    else {
      if (request.body.code_verifier) {
        // No code challenge but code_verifier was passed in.
        throw new InvalidGrantError('Invalid grant: code verifier is invalid');
      }
    }
  }

  getCodeChallengeMethod(method) {
    if (method) {
      return method;
    }
    // Per RFC 7636 §4.6, the default code challenge method is "plain".
    // However, plain PKCE is not secure, so we only allow it if explicitly enabled.
    return this.enablePlainPKCE ? 'plain' : 'S256';
  }

  /**
	 * Validate the redirect URI.
	 *
	 * "The authorization server MUST ensure that the redirect_uri parameter is
	 * present if the redirect_uri parameter was included in the initial
	 * authorization request as described in Section 4.1.1, and if included
	 * ensure that their values are identical."
	 * @param request {Request}
     * @param code {AuthorizationCodeData}
	 * @see https://tools.ietf.org/html/rfc6749#section-4.1.3
	 */

  validateRedirectUri(request, code) {
    if (!code.redirectUri) {
      return;
    }

    const redirectUri = request.body.redirect_uri || request.query.redirect_uri;

    if (!isFormat.uri(redirectUri)) {
      throw new InvalidRequestError('Invalid request: `redirect_uri` is not a valid URI');
    }

    if (redirectUri !== code.redirectUri) {
      throw new InvalidRequestError('Invalid request: `redirect_uri` is invalid');
    }
  }

  /**
	 * Revoke the authorization code.
	 *
	 * "The authorization code MUST expire shortly after it is issued to mitigate
	 * the risk of leaks. [...] If an authorization code is used more than once,
	 * the authorization server MUST deny the request."
	 * @param code {AuthorizationCodeData}
	 * @see https://tools.ietf.org/html/rfc6749#section-4.1.2
	 */

  async revokeAuthorizationCode(code) {
    const status = await this.model.revokeAuthorizationCode(code);

    if (!status) {
      throw new InvalidGrantError('Invalid grant: authorization code is invalid');
    }

    return code;
  }


  /**
	 * Save token.
   *
   * @param user {object}
   * @param client {ClientData}
   * @param authorizationCode {string}
   * @param requestedScope {string}
     *
	 */

  async saveToken(user, client, authorizationCode, requestedScope) {
    const validatedScope = await this.validateScope(user, client, requestedScope);
    const accessToken = await this.generateAccessToken(client, user, validatedScope);
    const refreshToken = await this.generateRefreshToken(client, user, validatedScope);
    const accessTokenExpiresAt = await this.getAccessTokenExpiresAt();
    const refreshTokenExpiresAt = await this.getRefreshTokenExpiresAt();

    const token = {
      accessToken,
      authorizationCode,
      accessTokenExpiresAt,
      refreshToken,
      refreshTokenExpiresAt,
      scope: validatedScope,
    };

    return this.model.saveToken(token, client, user);
  }
}

/**
 * Export constructor.
 */

module.exports = AuthorizationCodeGrantType;

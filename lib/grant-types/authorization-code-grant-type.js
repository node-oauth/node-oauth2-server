'use strict';

/**
 * Module dependencies.
 */

const AbstractGrantType = require('./abstract-grant-type');
const InvalidArgumentError = require('../errors/invalid-argument-error');
const InvalidGrantError = require('../errors/invalid-grant-error');
const InvalidRequestError = require('../errors/invalid-request-error');
const ServerError = require('../errors/server-error');
const isFormat = require('@node-oauth/formats');
const pkce = require('../pkce/pkce');

/**
 * Constructor.
 */

class AuthorizationCodeGrantType extends AbstractGrantType {
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
  }

  /**
	 * Handle authorization code grant.
	 *
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
    await this.validateRedirectUri(request, code);
    await this.revokeAuthorizationCode(code);

    return this.saveToken(code.user, client, code.authorizationCode, code.scope);
  }

  /**
	 * Get the authorization code.
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

    // optional: PKCE code challenge

    if (code.codeChallenge) {
      if (!request.body.code_verifier) {
        throw new InvalidGrantError('Missing parameter: `code_verifier`');
      }

      const hash = pkce.getHashForCodeChallenge({
        method: code.codeChallengeMethod,
        verifier: request.body.code_verifier
      });

      if (!hash) {
        // notice that we assume that codeChallengeMethod is already
        // checked at an earlier stage when being read from
        // request.body.code_challenge_method
        throw new ServerError('Server error: `getAuthorizationCode()` did not return a valid `codeChallengeMethod` property');
      }

      if (code.codeChallenge !== hash) {
        throw new InvalidGrantError('Invalid grant: code verifier is invalid');
      }
    }
    else {
      if (request.body.code_verifier) {
        // No code challenge but code_verifier was passed in.
        throw new InvalidGrantError('Invalid grant: code verifier is invalid');
      }
    }

    return code;
  }

  /**
	 * Validate the redirect URI.
	 *
	 * "The authorization server MUST ensure that the redirect_uri parameter is
	 * present if the redirect_uri parameter was included in the initial
	 * authorization request as described in Section 4.1.1, and if included
	 * ensure that their values are identical."
	 *
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
	 *
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
	 */

  async saveToken(user, client, authorizationCode, scope) {
    const validatedScope = await this.validateScope(user, client, scope);
    const accessToken = await this.generateAccessToken(client, user, scope);
    const refreshToken = await this.generateRefreshToken(client, user, scope);
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

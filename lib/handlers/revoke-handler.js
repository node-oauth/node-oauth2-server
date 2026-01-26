'use strict';

/*
 * Module dependencies.
 */

const InvalidArgumentError = require('../errors/invalid-argument-error');
const InvalidClientError = require('../errors/invalid-client-error');
const InvalidRequestError = require('../errors/invalid-request-error');
const OAuthError = require('../errors/oauth-error');
const UnsupportedTokenTypeError = require('../errors/unsupported-token-type-error');
const Request = require('../request');
const Response = require('../response');
const ServerError = require('../errors/server-error');
const auth = require('basic-auth');
const isFormat = require('@node-oauth/formats');

/**
 * A revocation request will invalidate the actual token and, if applicable, other
 * tokens based on the same authorization grant and the authorization
 * grant itself.
 *
 * @see https://tools.ietf.org/html/rfc7009
 */
class RevokeHandler {
  /**
   * Constructor.
   * @constructor
   * @param options {object}
   * @param options.model {object} An object containing the required model methods.
   * @throws {InvalidArgumentError} Thrown if required model methods are missing.
   */
  constructor (options) {
    options = options || {};

    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }

    if (!options.model.getClient) {
      throw new InvalidArgumentError('Invalid argument: model does not implement `getClient()`');
    }

    if (!options.model.revokeToken) {
      throw new InvalidArgumentError('Invalid argument: model does not implement `revokeToken()`');
    }

    this.model = options.model;
  }

  /**
   * The supported token types that may be revoked.
   * @return {string[]}
   */
  static get TOKEN_TYPES () {
    return ['access_token', 'refresh_token'];
  }

  /**
   * Revoke Handler.
   *
   * @see https://tools.ietf.org/html/rfc7009
   */

  async handle (request, response) {
    if (!(request instanceof Request)) {
      throw new InvalidArgumentError('Invalid argument: `request` must be an instance of Request');
    }

    if (!(response instanceof Response)) {
      throw new InvalidArgumentError('Invalid argument: `response` must be an instance of Response');
    }

    if (request.method !== 'POST') {
      throw new InvalidRequestError('Invalid request: method must be POST');
    }

    try {
      const client = await this.getClient(request, response);
      const { token, tokenTypeHint } = this.getToken(request);

      // Try to find and revoke the token
      await this.revokeToken({ token, tokenTypeHint, client });

      // Per RFC 7009 section 2.2: return 200 OK even if token was invalid
      // This prevents token enumeration attacks
      this.updateSuccessResponse(response);
    } catch (e) {
      let error = e;

      if (!(error instanceof OAuthError)) {
        error = new ServerError(error);
      }

      // Include the "WWW-Authenticate" response header field if the client
      // attempted to authenticate via the "Authorization" request header.
      //
      // @see https://tools.ietf.org/html/rfc6749#section-5.2.
      if (error instanceof InvalidClientError && request.get('authorization')) {
        response.set('WWW-Authenticate', 'Basic realm="Service"');
        throw new InvalidClientError(error, { code: 401 });
      }

      // For other errors, update the response but don't throw
      // RFC 7009 says to return 200 OK even for invalid tokens, but we should
      // still return errors for malformed requests or authentication failures
      if (error instanceof InvalidRequestError || error instanceof InvalidClientError) {
        this.updateErrorResponse(response, error);
        throw error;
      }

      // For other errors (like server errors), still return 200 OK per RFC 7009
      // but log the error
      this.updateSuccessResponse(response);
    }
  }

  /**
   * Get the client from the model and validate it.
   */

  async getClient (request, response) {
    const credentials = await this.getClientCredentials(request);

    if (!credentials.clientId) {
      throw new InvalidRequestError('Missing parameter: `client_id`');
    }

    if (!isFormat.vschar(credentials.clientId)) {
      throw new InvalidRequestError('Invalid parameter: `client_id`');
    }

    if (credentials.clientSecret && !isFormat.vschar(credentials.clientSecret)) {
      throw new InvalidRequestError('Invalid parameter: `client_secret`');
    }

    try {
      const client = await this.model.getClient(credentials.clientId, credentials.clientSecret);

      if (!client) {
        throw new InvalidClientError('Invalid client: client is invalid');
      }

      return client;
    } catch (e) {
      // Include the "WWW-Authenticate" response header field if the client
      // attempted to authenticate via the "Authorization" request header.
      //
      // @see https://tools.ietf.org/html/rfc6749#section-5.2.
      if ((e instanceof InvalidClientError) && request.get('authorization')) {
        response.set('WWW-Authenticate', 'Basic realm="Service"');
        throw new InvalidClientError(e, { code: 401 });
      }

      throw e;
    }
  }

  /**
   * Get client credentials.
   *
   * The client credentials may be sent using the HTTP Basic authentication scheme or, alternatively,
   * the `client_id` and `client_secret` can be embedded in the body.
   *
   * @see https://tools.ietf.org/html/rfc6749#section-2.3.1
   */

  getClientCredentials (request) {
    const credentials = auth(request);

    if (credentials) {
      return { clientId: credentials.name, clientSecret: credentials.pass };
    }

    if (request.body.client_id) {
      return { clientId: request.body.client_id, clientSecret: request.body.client_secret };
    }

    throw new InvalidClientError('Invalid client: cannot retrieve client credentials');
  }

  /**
   * Extract and validate token from request
   * @param request {Request}
   * @return {{ token: string, token_type_hint: string|undefined}} An object containing the token and token type hint.
   */
  getToken (request) {
    const token = request.body.token;

    if (!token) {
      throw new InvalidRequestError('Missing parameter: `token`');
    }

    if (!isFormat.vschar(token)) {
      throw new InvalidRequestError('Invalid parameter: `token`');
    }

    // An invalid token type hint value is ignored by the authorization
    // server and does not influence the revocation response.
    let tokenTypeHint = request.body.token_type_hint;
    if (!RevokeHandler.TOKEN_TYPES.includes(tokenTypeHint)) {
      tokenTypeHint = undefined;
    }

    return { token, tokenTypeHint };
  }

  /**
   * Revoke the token.
   *
   * Attempts to find the token using the token_type_hint, then calls model.revokeToken().
   * Per RFC 7009, if the token cannot be found, we still return success to prevent
   * token enumeration attacks.
   */

  async revokeToken ({ token, tokenTypeHint, client }) {
    let tokenToRevoke = null;

    // Try to find the token based on the hint
    if (tokenTypeHint === 'refresh_token') {
      // Try to get refresh token if model supports it
      if (this.model.getRefreshToken) {
        const refreshToken = await this.model.getRefreshToken(token);
        if (refreshToken) {
          // Verify the token belongs to the client
          if (refreshToken.client && refreshToken.client.id === client.id) {
            tokenToRevoke = refreshToken;
          }
        }
      }
    } else if (tokenTypeHint === 'access_token') {
      // Try to get access token if model supports it
      if (this.model.getAccessToken) {
        const accessToken = await this.model.getAccessToken(token);
        if (accessToken) {
          // Verify the token belongs to the client
          if (accessToken.client && accessToken.client.id === client.id) {
            tokenToRevoke = accessToken;
          }
        }
      }
    } else {
      // No hint provided, try both access token and refresh token
      if (this.model.getAccessToken) {
        const accessToken = await this.model.getAccessToken(token);
        if (accessToken && accessToken.client && accessToken.client.id === client.id) {
          tokenToRevoke = accessToken;
        }
      }

      // If access token not found, try refresh token
      if (!tokenToRevoke && this.model.getRefreshToken) {
        const refreshToken = await this.model.getRefreshToken(token);
        if (refreshToken && refreshToken.client && refreshToken.client.id === client.id) {
          tokenToRevoke = refreshToken;
        }
      }
    }

    // If we found a token, revoke it
    if (tokenToRevoke) {
      await this.model.revokeToken(tokenToRevoke);
    }

    // Per RFC 7009, we return success even if token was not found
    // This prevents token enumeration attacks
  }

  /**
   * Update response when token is revoked successfully.
   */

  updateSuccessResponse (response) {
    response.body = {};
    response.status = 200;
    response.set('Cache-Control', 'no-store');
    response.set('Pragma', 'no-cache');
  }

  /**
   * Update response when an error is thrown.
   */

  updateErrorResponse (response, error) {
    response.body = {
      error: error.name,
      error_description: error.message
    };

    response.status = error.code;
  }
}

/**
 * Export constructor.
 */

module.exports = RevokeHandler;


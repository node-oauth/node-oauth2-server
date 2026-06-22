'use strict';

/*
 * Module dependencies.
 */

const BearerTokenType = require('../token-types/bearer-token-type');
const InvalidArgumentError = require('../errors/invalid-argument-error');
const InvalidRequestError = require('../errors/invalid-request-error');
const OAuthError = require('../errors/oauth-error');
const Request = require('../request');
const Response = require('../response');
const ServerError = require('../errors/server-error');
const TokenModel = require('../models/token-model');
const UnauthorizedClientError = require('../errors/unauthorized-client-error');
const UnsupportedGrantTypeError = require('../errors/unsupported-grant-type-error');
const pkce = require('../pkce/pkce');
const isFormat = require('@node-oauth/formats');
const { defaultClientAuthenticationMethods, authenticateClient } = require('../client-authentication');

/**
 * Grant types.
 */

const grantTypes = {
  authorization_code: require('../grant-types/authorization-code-grant-type'),
  client_credentials: require('../grant-types/client-credentials-grant-type'),
  password: require('../grant-types/password-grant-type'),
  refresh_token: require('../grant-types/refresh-token-grant-type'),
};

/**
 * Constructor.
 */

class TokenHandler {
  constructor(options) {
    options = options || {};

    if (!options.accessTokenLifetime) {
      throw new InvalidArgumentError('Missing parameter: `accessTokenLifetime`');
    }

    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }

    if (!options.refreshTokenLifetime) {
      throw new InvalidArgumentError('Missing parameter: `refreshTokenLifetime`');
    }

    if (!options.model.getClient) {
      throw new InvalidArgumentError('Invalid argument: model does not implement `getClient()`');
    }

    this.accessTokenLifetime = options.accessTokenLifetime;
    this.grantTypes = Object.assign({}, grantTypes, options.extendedGrantTypes);
    this.model = options.model;
    this.refreshTokenLifetime = options.refreshTokenLifetime;
    this.allowExtendedTokenAttributes = options.allowExtendedTokenAttributes;
    this.requireClientAuthentication = options.requireClientAuthentication || {};
    this.alwaysIssueNewRefreshToken = options.alwaysIssueNewRefreshToken !== false;
    this.enablePlainPKCE = options.enablePlainPKCE === true;
    this.clientAuthenticationMethods = Object.assign(
      {},
      defaultClientAuthenticationMethods(),
      options.extendedClientAuthentication,
    );
  }

  /**
   * Token Handler.
   */

  async handle(request, response) {
    if (!(request instanceof Request)) {
      throw new InvalidArgumentError('Invalid argument: `request` must be an instance of Request');
    }

    if (!(response instanceof Response)) {
      throw new InvalidArgumentError('Invalid argument: `response` must be an instance of Response');
    }

    if (request.method !== 'POST') {
      throw new InvalidRequestError('Invalid request: method must be POST');
    }

    if (!request.is('application/x-www-form-urlencoded')) {
      throw new InvalidRequestError('Invalid request: content must be application/x-www-form-urlencoded');
    }

    try {
      const client = await this.getClient(request, response);
      const data = await this.handleGrantType(request, client);
      const model = new TokenModel(data, { allowExtendedTokenAttributes: this.allowExtendedTokenAttributes });
      const tokenType = this.getTokenType(model);

      this.updateSuccessResponse(response, tokenType);

      return data;
    } catch (err) {
      let e = err;

      if (!(e instanceof OAuthError)) {
        e = new ServerError(e);
      }

      this.updateErrorResponse(response, e);
      throw e;
    }
  }

  /**
   * Get the client from the model.
   *
   * Client authentication is delegated to the configured authentication
   * methods (see the client authentication guide). The single method
   * that matches the request resolves and verifies the client; supported out
   * of the box are HTTP Basic, request-body credentials and public clients,
   * plus any methods added via `extendedClientAuthentication` (e.g. JWT
   * client assertions).
   *
   * @see https://datatracker.ietf.org/doc/html/rfc6749#section-2.3.1
   */

  async getClient(request, response) {
    const grantType = request.body.grant_type;
    const codeVerifier = request.body.code_verifier;

    return authenticateClient(request, response, {
      model: this.model,
      methods: this.clientAuthenticationMethods,
      clientAuthenticationRequired: this.isClientAuthenticationRequired(grantType),
      isPKCE: pkce.isPKCERequest({ grantType, codeVerifier }),
    });
  }

  /**
   * Handle grant type.
   */

  async handleGrantType(request, client) {
    const grantType = request.body.grant_type;

    if (!grantType) {
      throw new InvalidRequestError('Missing parameter: `grant_type`');
    }

    if (!isFormat.nchar(grantType) && !isFormat.uri(grantType)) {
      throw new InvalidRequestError('Invalid parameter: `grant_type`');
    }

    if (!Object.prototype.hasOwnProperty.call(this.grantTypes, grantType)) {
      throw new UnsupportedGrantTypeError('Unsupported grant type: `grant_type` is invalid');
    }

    if (!Array.isArray(client.grants) || !client.grants.includes(grantType)) {
      throw new UnauthorizedClientError('Unauthorized client: `grant_type` is invalid');
    }

    const accessTokenLifetime = this.getAccessTokenLifetime(client);
    const refreshTokenLifetime = this.getRefreshTokenLifetime(client);
    const Type = this.grantTypes[grantType];

    const options = {
      accessTokenLifetime: accessTokenLifetime,
      model: this.model,
      refreshTokenLifetime: refreshTokenLifetime,
      alwaysIssueNewRefreshToken: this.alwaysIssueNewRefreshToken,
      enablePlainPKCE: this.enablePlainPKCE === true,
    };

    return new Type(options).handle(request, client);
  }

  /**
   * Get access token lifetime.
   */

  getAccessTokenLifetime(client) {
    return client.accessTokenLifetime || this.accessTokenLifetime;
  }

  /**
   * Get refresh token lifetime.
   */

  getRefreshTokenLifetime(client) {
    return client.refreshTokenLifetime || this.refreshTokenLifetime;
  }

  /**
   * Get token type.
   */

  getTokenType(model) {
    return new BearerTokenType(
      model.accessToken,
      model.accessTokenLifetime,
      model.refreshToken,
      model.scope,
      model.customAttributes,
    );
  }

  /**
   * Update response when a token is generated.
   */

  updateSuccessResponse(response, tokenType) {
    response.body = tokenType.valueOf();

    // for compliance reasons we rebuild the internal scope to be a string
    // https://datatracker.ietf.org/doc/html/rfc6749.html#section-5.1
    if (response.body.scope) {
      response.body.scope = response.body.scope.join(' ');
    }

    response.set('Cache-Control', 'no-store');
    response.set('Pragma', 'no-cache');
  }

  /**
   * Update response when an error is thrown.
   */

  updateErrorResponse(response, error) {
    response.body = {
      error: error.name,
      error_description: error.message,
    };

    response.status = error.code;
  }

  /**
   * Given a grant type, check if client authentication is required
   */
  isClientAuthenticationRequired(grantType) {
    if (Object.keys(this.requireClientAuthentication).length > 0) {
      return typeof this.requireClientAuthentication[grantType] !== 'undefined'
        ? this.requireClientAuthentication[grantType]
        : true;
    } else {
      return true;
    }
  }
}

/**
 * Export constructor.
 */

module.exports = TokenHandler;

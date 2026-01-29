'use strict';

/*
 * Module dependencies.
 */

const AccessDeniedError = require('../errors/access-denied-error');
const AuthenticateHandler = require('../handlers/authenticate-handler');
const InvalidArgumentError = require('../errors/invalid-argument-error');
const InvalidClientError = require('../errors/invalid-client-error');
const InvalidRequestError = require('../errors/invalid-request-error');
const InvalidScopeError = require('../errors/invalid-scope-error');
const UnsupportedResponseTypeError = require('../errors/unsupported-response-type-error');
const OAuthError = require('../errors/oauth-error');
const Request = require('../request');
const Response = require('../response');
const ServerError = require('../errors/server-error');
const UnauthorizedClientError = require('../errors/unauthorized-client-error');
const isFormat = require('@node-oauth/formats');
const tokenUtil = require('../utils/token-util');
const url = require('url');
const pkce = require('../pkce/pkce');
const { parseScope } = require('../utils/scope-util');
const { isDefined, isInTypes } = require('../utils/param-util');
const isString = isInTypes('string');
const isStringOrNumber = isInTypes('string', 'number');

/**
 * Response types.
 */

const responseTypes = {
  code: require('../response-types/code-response-type'),
  //token: require('../response-types/token-response-type')
};

/**
 * Constructor.
 */

class AuthorizeHandler {
  constructor (options) {
    options = options || {};

    if (options.authenticateHandler && !options.authenticateHandler.handle) {
      throw new InvalidArgumentError('Invalid argument: authenticateHandler does not implement `handle()`');
    }

    if (!options.authorizationCodeLifetime) {
      throw new InvalidArgumentError('Missing parameter: `authorizationCodeLifetime`');
    }

    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }

    if (!options.model.getClient) {
      throw new InvalidArgumentError('Invalid argument: model does not implement `getClient()`');
    }

    if (!options.model.saveAuthorizationCode) {
      throw new InvalidArgumentError('Invalid argument: model does not implement `saveAuthorizationCode()`');
    }

    this.allowEmptyState = options.allowEmptyState;
    this.authenticateHandler = options.authenticateHandler || new AuthenticateHandler(options);
    this.authorizationCodeLifetime = options.authorizationCodeLifetime;
    this.model = options.model;
  }

  /**
   * Authorize Handler.
   */

  async handle (request, response) {
    if (!(request instanceof Request)) {
      throw new InvalidArgumentError('Invalid argument: `request` must be an instance of Request');
    }

    if (!(response instanceof Response)) {
      throw new InvalidArgumentError('Invalid argument: `response` must be an instance of Response');
    }

    const expiresAt = await this.getAuthorizationCodeLifetime();
    const client = await this.getClient(request);
    const user = await this.getUser(request, response);

    let uri;
    let state;

    try {
      uri = this.getRedirectUri(request, client);
      state = this.getState(request);

      if (request.query.allowed === 'false' || request.body.allowed === 'false') {
        throw new AccessDeniedError('Access denied: user denied access to application');
      }

      const requestedScope = await this.getScope(request);
      const validScope = await this.validateScope(user, client, requestedScope);
      const authorizationCode = await this.generateAuthorizationCode(client, user, validScope);

      const ResponseType = this.getResponseType(request);
      const codeChallenge = this.getCodeChallenge(request);
      const codeChallengeMethod = this.getCodeChallengeMethod(request);
      const code = await this.saveAuthorizationCode(
        authorizationCode,
        expiresAt,
        validScope,
        client,
        uri,
        user,
        codeChallenge,
        codeChallengeMethod
      );

      const responseTypeInstance = new ResponseType(code.authorizationCode);
      const redirectUri = this.buildSuccessRedirectUri(uri, responseTypeInstance);

      this.updateResponse(response, redirectUri, state);

      return code;
    } catch (err) {
      let e = err;

      if (!(e instanceof OAuthError)) {
        e = new ServerError(e);
      }
      const redirectUri = this.buildErrorRedirectUri(uri, e);
      this.updateResponse(response, redirectUri, state);

      throw e;
    }
  }

  /**
   * Generate authorization code.
   */

  async generateAuthorizationCode (client, user, scope) {
    if (this.model.generateAuthorizationCode) {
      return this.model.generateAuthorizationCode(client, user, scope);
    }
    return tokenUtil.generateRandomToken();
  }

  /**
   * Get authorization code lifetime.
   */

  getAuthorizationCodeLifetime () {
    const expires = new Date();

    expires.setSeconds(expires.getSeconds() + this.authorizationCodeLifetime);
    return expires;
  }

  /**
   * Get the client from the model.
   */

  async getClient (request) {
    const self = this;
    const clientId = request.body.client_id || request.query.client_id;

    if (!isDefined(clientId)) {
      throw new InvalidRequestError('Missing parameter: `client_id`');
    }

    if (!isStringOrNumber(clientId) || !isFormat.vschar(clientId)) {
      throw new InvalidRequestError('Invalid parameter: `client_id`');
    }

    const redirectUri = request.body.redirect_uri || request.query.redirect_uri;

    if (isDefined(redirectUri) && (!isString(redirectUri) || !isFormat.uri(redirectUri))) {
      throw new InvalidRequestError('Invalid request: `redirect_uri` is not a valid URI');
    }

    const client = await this.model.getClient(clientId, null);

    if (!client) {
      throw new InvalidClientError('Invalid client: client credentials are invalid');
    }

    if (!client.grants) {
      throw new InvalidClientError('Invalid client: missing client `grants`');
    }

    if (!Array.isArray(client.grants) || !client.grants.includes('authorization_code')) {
      throw new UnauthorizedClientError('Unauthorized client: `grant_type` is invalid');
    }

    if (!client.redirectUris || 0 === client.redirectUris.length) {
      throw new InvalidClientError('Invalid client: missing client `redirectUri`');
    }

    if (redirectUri) {
      const valid = await self.validateRedirectUri(redirectUri, client);

      if (!valid) {
        throw new InvalidClientError('Invalid client: `redirect_uri` does not match client value');
      }
    }

    return client;
  }

  /**
   * Validate requested scope.
   */
  async validateScope (user, client, scope) {
    if (this.model.validateScope) {
      const validatedScope = await this.model.validateScope(user, client, scope);

      if (!validatedScope) {
        throw new InvalidScopeError('Invalid scope: Requested scope is invalid');
      }

      return validatedScope;
    }

    return scope;
  }

  /**
   * Get scope from the request.
   */

  getScope (request) {
    const scope = request.body.scope || request.query.scope;

    return parseScope(scope);
  }

  /**
   * Get state from the request.
   */

  getState (request) {
    const state = request.body.state || request.query.state;
    const stateExists = isString(state) && state.length > 0;
    const stateIsValid = stateExists
      ? isFormat.vschar(state)
      : this.allowEmptyState;

    if (!stateIsValid) {
      const message = (!stateExists) ? 'Missing' : 'Invalid';
      throw new InvalidRequestError(`${message} parameter: \`state\``);
    }

    return state;
  }

  /**
   * Get user by calling the authenticate middleware.
   */

  async getUser (request, response) {
    if (this.authenticateHandler instanceof AuthenticateHandler) {
      const handled = await this.authenticateHandler.handle(request, response);
      return handled
        ? handled.user
        : undefined;
    }

    const user = await this.authenticateHandler.handle(request, response);

    if (!user) {
      throw new ServerError('Server error: `handle()` did not return a `user` object');
    }

    return user;
  }

  /**
   * Get redirect URI.
   */

  getRedirectUri (request, client) {
    return request.body.redirect_uri || request.query.redirect_uri || client.redirectUris[0];
  }

  /**
   * Save authorization code.
   */

  async saveAuthorizationCode (authorizationCode, expiresAt, scope, client, redirectUri, user, codeChallenge, codeChallengeMethod) {
    let code = {
      authorizationCode: authorizationCode,
      expiresAt: expiresAt,
      redirectUri: redirectUri,
      scope: scope
    };

    if(codeChallenge && codeChallengeMethod){
      code = Object.assign({
        codeChallenge: codeChallenge,
        codeChallengeMethod: codeChallengeMethod
      }, code);
    }

    return this.model.saveAuthorizationCode(code, client, user);
  }


  async validateRedirectUri (redirectUri, client) {
    if (this.model.validateRedirectUri) {
      return this.model.validateRedirectUri(redirectUri, client);
    }

    return client.redirectUris.includes(redirectUri);
  }
  /**
   * Get response type.
   */

  getResponseType (request) {
    const responseType = request.body.response_type || request.query.response_type;

    if (!responseType) {
      throw new InvalidRequestError('Missing parameter: `response_type`');
    }

    if (!Object.prototype.hasOwnProperty.call(responseTypes, responseType)) {
      throw new UnsupportedResponseTypeError('Unsupported response type: `response_type` is not supported');
    }

    return responseTypes[responseType];
  }

  /**
   * Build a successful response that redirects the user-agent to the client-provided url.
   */

  buildSuccessRedirectUri (redirectUri, responseType) {
    return responseType.buildRedirectUri(redirectUri);
  }

  /**
   * Build an error response that redirects the user-agent to the client-provided url.
   */

  buildErrorRedirectUri (redirectUri, error) {
    const uri = url.parse(redirectUri);

    uri.query = {
      error: error.name
    };

    if (error.message) {
      uri.query.error_description = error.message;
    }

    return uri;
  }

  /**
   * Update response with the redirect uri and the state parameter, if available.
   */

  updateResponse (response, redirectUri, state) {
    redirectUri.query = redirectUri.query || {};

    if (state) {
      redirectUri.query.state = state;
    }

    response.redirect(url.format(redirectUri));
  }

  getCodeChallenge (request) {
    return request.body.code_challenge || request.query.code_challenge;
  }

  /**
   * Get code challenge method from request or defaults to plain.
   * https://www.rfc-editor.org/rfc/rfc7636#section-4.3
   *
   * @throws {InvalidRequestError} if request contains unsupported code_challenge_method
   *  (see https://www.rfc-editor.org/rfc/rfc7636#section-4.4)
   */
  getCodeChallengeMethod (request) {
    const algorithm = request.body.code_challenge_method || request.query.code_challenge_method;

    if (algorithm && !pkce.isValidMethod(algorithm)) {
      throw new InvalidRequestError(`Invalid request: transform algorithm '${algorithm}' not supported`);
    }

    return algorithm || 'plain';
  }
}

/**
 * Export constructor.
 */

module.exports = AuthorizeHandler;

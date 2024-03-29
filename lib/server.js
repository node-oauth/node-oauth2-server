'use strict';

/**
 * Module dependencies.
 */

const AuthenticateHandler = require('./handlers/authenticate-handler');
const AuthorizeHandler = require('./handlers/authorize-handler');
const InvalidArgumentError = require('./errors/invalid-argument-error');
const TokenHandler = require('./handlers/token-handler');

/**
 * Constructor.
 */

class OAuth2Server {
  constructor (options) {
    options = options || {};

    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }

    this.options = options;
  }

  /**
 * Authenticate a token.
 */

  authenticate (request, response, options) {
    options = Object.assign({
      addAcceptedScopesHeader: true,
      addAuthorizedScopesHeader: true,
      allowBearerTokensInQueryString: false
    }, this.options, options);

    return new AuthenticateHandler(options).handle(request, response);
  }

  /**
 * Authorize a request.
 */

  authorize (request, response, options) {
    options = Object.assign({
      allowEmptyState: false,
      authorizationCodeLifetime: 5 * 60   // 5 minutes.
    }, this.options, options);

    return new AuthorizeHandler(options).handle(request, response);
  }

  /**
 * Create a token.
 */

  token (request, response, options) {
    options = Object.assign({
      accessTokenLifetime: 60 * 60,             // 1 hour.
      refreshTokenLifetime: 60 * 60 * 24 * 14,  // 2 weeks.
      allowExtendedTokenAttributes: false,
      requireClientAuthentication: {}           // defaults to true for all grant types
    }, this.options, options);

    return new TokenHandler(options).handle(request, response);
  }
}

/**
 * Export constructor.
 */

module.exports = OAuth2Server;

'use strict';

/*
 * Module dependencies.
 */

const AbstractGrantType = require('./abstract-grant-type');
const InvalidArgumentError = require('../errors/invalid-argument-error');
const InvalidGrantError = require('../errors/invalid-grant-error');
const InvalidRequestError = require('../errors/invalid-request-error');
/**
 * JWT Bearer grant type.
 *
 * Implements RFC 7523 (JWT Profile for OAuth 2.0 Access Token Requests) as
 * applied to the Identity Assertion Authorization Grant (ID-JAG) defined in
 * draft-ietf-oauth-identity-assertion-authz-grant.
 *
 * This grant type enables Cross App Access: an upstream Identity Provider
 * issues an ID-JAG JWT which the client presents here (Resource AS) in
 * exchange for a standard Bearer access token.
 *
 * Grant type URI: urn:ietf:params:oauth:grant-type:jwt-bearer
 *
 * Register via extendedGrantTypes:
 *   new OAuth2Server({
 *     model,
 *     extendedGrantTypes: {
 *       'urn:ietf:params:oauth:grant-type:jwt-bearer': JwtBearerGrantType
 *     }
 *   });
 *
 * Required model methods:
 *   getUserFromJwtBearer(assertion, client) — validate the JWT assertion and
 *     return the associated user, or a falsy value on failure. The model is
 *     responsible for all cryptographic validation including:
 *       - For ID-JAG: typ header = "oauth-id-jag+jwt", aud = this AS,
 *         client_id claim = client.id, exp/iat checks, IdP signature
 *       - For general RFC 7523 JWTs: standard JWT validation per RFC 7519
 *   saveToken(token, client, user) — persist and return the issued access token
 *
 * @see https://www.rfc-editor.org/rfc/rfc7523
 * @see https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/
 */

class JwtBearerGrantType extends AbstractGrantType {
  constructor(options = {}) {
    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }

    if (!options.model.getUserFromJwtBearer) {
      throw new InvalidArgumentError('Invalid argument: model does not implement `getUserFromJwtBearer()`');
    }

    if (!options.model.saveToken) {
      throw new InvalidArgumentError('Invalid argument: model does not implement `saveToken()`');
    }

    super(options);
  }

  /**
   * Handle JWT Bearer grant.
   *
   * @see https://www.rfc-editor.org/rfc/rfc7523#section-2.1
   */

  async handle(request, client) {
    if (!request) {
      throw new InvalidArgumentError('Missing parameter: `request`');
    }

    if (!client) {
      throw new InvalidArgumentError('Missing parameter: `client`');
    }

    const scope = this.getScope(request);
    const user = await this.getUserFromJwtBearer(request, client);

    return this.saveToken(user, client, scope);
  }

  /**
   * Retrieve the user from a JWT Bearer assertion.
   *
   * Validation of the assertion contents (signature, claims, expiry, etc.)
   * is fully delegated to model.getUserFromJwtBearer().
   */

  async getUserFromJwtBearer(request, client) {
    if (!request.body.assertion) {
      throw new InvalidRequestError('Missing parameter: `assertion`');
    }

    const user = await this.model.getUserFromJwtBearer(request.body.assertion, client);

    if (!user) {
      throw new InvalidGrantError('Invalid grant: assertion is invalid');
    }

    return user;
  }

  /**
   * Save token.
   *
   * No refresh token is issued — this grant type represents client-to-client
   * federation; the client re-presents the upstream assertion to obtain a
   * new access token when needed.
   */

  async saveToken(user, client, requestedScope) {
    const validatedScope = await this.validateScope(user, client, requestedScope);
    const accessToken = await this.generateAccessToken(client, user, validatedScope);
    const accessTokenExpiresAt = this.getAccessTokenExpiresAt();

    const token = {
      accessToken,
      accessTokenExpiresAt,
      scope: validatedScope,
    };

    return this.model.saveToken(token, client, user);
  }
}

/*
 * Export constructor.
 */

module.exports = JwtBearerGrantType;

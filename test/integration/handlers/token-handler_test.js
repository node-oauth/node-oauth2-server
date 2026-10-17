'use strict';

/**
 * Module dependencies.
 */

const AccessDeniedError = require('../../../lib/errors/access-denied-error');
const BearerTokenType = require('../../../lib/token-types/bearer-token-type');
const InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
const InvalidClientError = require('../../../lib/errors/invalid-client-error');
const InvalidGrantError = require('../../../lib/errors/invalid-grant-error');
const InvalidRequestError = require('../../../lib/errors/invalid-request-error');
const PasswordGrantType = require('../../../lib/grant-types/password-grant-type');
const Model = require('../../../lib/model');
const Request = require('../../../lib/request');
const Response = require('../../../lib/response');
const ServerError = require('../../../lib/errors/server-error');
const TokenHandler = require('../../../lib/handlers/token-handler');
const UnauthorizedClientError = require('../../../lib/errors/unauthorized-client-error');
const UnsupportedGrantTypeError = require('../../../lib/errors/unsupported-grant-type-error');
const should = require('chai').should();
const util = require('util');
const crypto = require('crypto');
const stringUtil = require('../../../lib/utils/string-util');

/**
 * Test `TokenHandler` integration.
 */

describe('TokenHandler integration', function () {
  describe('constructor()', function () {
    it('should throw an error if `options.accessTokenLifetime` is missing', function () {
      try {
        new TokenHandler();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `accessTokenLifetime`');
      }
    });

    it('should throw an error if `options.model` is missing', function () {
      try {
        new TokenHandler({ accessTokenLifetime: 120 });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should throw an error if `options.refreshTokenLifetime` is missing', function () {
      try {
        new TokenHandler({ accessTokenLifetime: 120, model: {} });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `refreshTokenLifetime`');
      }
    });

    it('should throw an error if the model does not implement `getClient()`', function () {
      try {
        new TokenHandler({
          accessTokenLifetime: 120,
          model: {},
          refreshTokenLifetime: 120,
        });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `getClient()`');
      }
    });

    it('should set the `accessTokenLifetime`', function () {
      const accessTokenLifetime = {};
      const model = Model.from({
        getClient: function () {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: accessTokenLifetime,
        model: model,
        refreshTokenLifetime: 120,
      });

      handler.accessTokenLifetime.should.equal(accessTokenLifetime);
    });

    it('should set the `alwaysIssueNewRefreshToken`', function () {
      const alwaysIssueNewRefreshToken = true;
      const model = Model.from({
        getClient: function () {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 123,
        model: model,
        refreshTokenLifetime: 120,
        alwaysIssueNewRefreshToken: alwaysIssueNewRefreshToken,
      });

      handler.alwaysIssueNewRefreshToken.should.equal(alwaysIssueNewRefreshToken);
    });

    it('should set the `alwaysIssueNewRefreshToken` to false', function () {
      const alwaysIssueNewRefreshToken = false;
      const model = Model.from({
        getClient: function () {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 123,
        model: model,
        refreshTokenLifetime: 120,
        alwaysIssueNewRefreshToken: alwaysIssueNewRefreshToken,
      });

      handler.alwaysIssueNewRefreshToken.should.equal(alwaysIssueNewRefreshToken);
    });

    it('should return the default `alwaysIssueNewRefreshToken` value', function () {
      const model = Model.from({
        getClient: function () {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 123,
        model: model,
        refreshTokenLifetime: 120,
      });

      handler.alwaysIssueNewRefreshToken.should.equal(true);
    });

    it('should set the `extendedGrantTypes`', function () {
      const extendedGrantTypes = { foo: 'bar' };
      const model = Model.from({
        getClient: function () {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        extendedGrantTypes: extendedGrantTypes,
        model: model,
        refreshTokenLifetime: 120,
      });
      handler.grantTypes.should.deep.include(extendedGrantTypes);
    });

    it('should set the `model`', function () {
      const model = Model.from({
        getClient: function () {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });

      handler.model.should.equal(model);
    });

    it('should set the `refreshTokenLifetime`', function () {
      const refreshTokenLifetime = {};
      const model = Model.from({
        getClient: function () {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: refreshTokenLifetime,
      });

      handler.refreshTokenLifetime.should.equal(refreshTokenLifetime);
    });
  });

  describe('handle()', function () {
    it('should throw an error if `request` is missing', async function () {
      const model = Model.from({
        getClient: function () {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });

      try {
        await handler.handle();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: `request` must be an instance of Request');
      }
    });

    it('should throw an error if `response` is missing', async function () {
      const model = Model.from({
        getClient: function () {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {},
      });

      try {
        await handler.handle(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: `response` must be an instance of Response');
      }
    });

    it('should throw an error if the method is not `POST`', function () {
      const model = Model.from({
        getClient: function () {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: {},
        headers: {},
        method: 'GET',
        query: {},
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(should.fail)
        .catch(function (e) {
          e.should.be.an.instanceOf(InvalidRequestError);
          e.message.should.equal('Invalid request: method must be POST');
        });
    });

    it('should throw an error if the media type is not `application/x-www-form-urlencoded`', function () {
      const model = Model.from({
        getClient: function () {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: {},
        headers: {},
        method: 'POST',
        query: {},
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(should.fail)
        .catch(function (e) {
          e.should.be.an.instanceOf(InvalidRequestError);
          e.message.should.equal('Invalid request: content must be application/x-www-form-urlencoded');
        });
    });

    it('should throw the error if an oauth error is thrown', function () {
      const model = Model.from({
        getClient: function () {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: {},
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'transfer-encoding': 'chunked',
        },
        method: 'POST',
        query: {},
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(should.fail)
        .catch(function (e) {
          e.should.be.an.instanceOf(InvalidClientError);
          e.message.should.equal('Invalid client: cannot retrieve client credentials');
        });
    });

    it('should throw a server error if a non-oauth error is thrown', function () {
      const model = Model.from({
        getClient: function () {
          throw new Error('Unhandled exception');
        },
        getUser: function () {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: {
          client_id: 12345,
          client_secret: 'secret',
          grant_type: 'password',
          password: 'bar',
          username: 'foo',
        },
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'transfer-encoding': 'chunked',
        },
        method: 'POST',
        query: {},
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(should.fail)
        .catch(function (e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Unhandled exception');
          e.inner.should.be.an.instanceOf(Error);
        });
    });

    it('should update the response if an error is thrown', function () {
      const model = Model.from({
        getClient: function () {
          throw new Error('Unhandled exception');
        },
        getUser: function () {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: {
          client_id: 12345,
          client_secret: 'secret',
          grant_type: 'password',
          password: 'bar',
          username: 'foo',
        },
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'transfer-encoding': 'chunked',
        },
        method: 'POST',
        query: {},
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(should.fail)
        .catch(function () {
          response.body.should.eql({
            error: 'server_error',
            error_description: 'Unhandled exception',
          });
          response.status.should.equal(503);
        });
    });

    it('should normalise an `InvalidArgumentError` thrown while handling the request to a `server_error`', function () {
      // A model that returns malformed token data makes `TokenModel` throw an
      // `InvalidArgumentError`. That is an internal error, not an OAuth error, so
      // it must reach the client as a standard `server_error` rather than the
      // non-standard `invalid_argument`.
      const model = Model.from({
        getClient: function () {
          return { grants: ['password'] };
        },
        getUser: function () {
          return {};
        },
        saveToken: function () {
          return { accessToken: 'foo', client: {}, user: {}, accessTokenExpiresAt: 'not-a-date' };
        },
        validateScope: function () {
          return ['baz'];
        },
      });
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({
        body: {
          client_id: 12345,
          client_secret: 'secret',
          username: 'foo',
          password: 'bar',
          grant_type: 'password',
          scope: 'baz',
        },
        headers: { 'content-type': 'application/x-www-form-urlencoded', 'transfer-encoding': 'chunked' },
        method: 'POST',
        query: {},
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(should.fail)
        .catch(function (e) {
          e.should.be.an.instanceOf(ServerError);
          e.inner.should.be.an.instanceOf(InvalidArgumentError);
          e.message.should.equal('Invalid parameter: `accessTokenExpiresAt`');
          response.body.should.eql({
            error: 'server_error',
            error_description: 'Invalid parameter: `accessTokenExpiresAt`',
          });
          response.status.should.equal(503);
        });
    });

    it('should return a bearer token if successful', function () {
      const token = {
        accessToken: 'foo',
        client: {},
        refreshToken: 'bar',
        scope: ['foobar'],
        user: {},
      };
      const model = Model.from({
        getClient: function () {
          return { grants: ['password'] };
        },
        getUser: function () {
          return {};
        },
        saveToken: function () {
          return token;
        },
        validateScope: function () {
          return ['baz'];
        },
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: {
          client_id: 12345,
          client_secret: 'secret',
          username: 'foo',
          password: 'bar',
          grant_type: 'password',
          scope: 'baz',
        },
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'transfer-encoding': 'chunked',
        },
        method: 'POST',
        query: {},
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(function (data) {
          data.should.eql(token);
        })
        .catch(should.fail);
    });

    it('should not return custom attributes in a bearer token if the allowExtendedTokenAttributes is not set', function () {
      const token = {
        accessToken: 'foo',
        client: {},
        refreshToken: 'bar',
        scope: ['baz'],
        user: {},
        foo: 'bar',
      };
      const model = Model.from({
        getClient: function () {
          return { grants: ['password'] };
        },
        getUser: function () {
          return {};
        },
        saveToken: function () {
          return token;
        },
        validateScope: function () {
          return ['baz'];
        },
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: {
          client_id: 12345,
          client_secret: 'secret',
          username: 'foo',
          password: 'bar',
          grant_type: 'password',
          scope: 'baz',
        },
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'transfer-encoding': 'chunked',
        },
        method: 'POST',
        query: {},
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(function () {
          should.exist(response.body.access_token);
          should.exist(response.body.refresh_token);
          should.exist(response.body.token_type);
          response.body.scope.should.eql('baz');
          should.not.exist(response.body.foo);
        })
        .catch(should.fail);
    });

    it('should return custom attributes in a bearer token if the allowExtendedTokenAttributes is set', function () {
      const token = {
        accessToken: 'foo',
        client: {},
        refreshToken: 'bar',
        scope: ['baz'],
        user: {},
        foo: 'bar',
      };
      const model = Model.from({
        getClient: function () {
          return { grants: ['password'] };
        },
        getUser: function () {
          return {};
        },
        saveToken: function () {
          return token;
        },
        validateScope: function () {
          return ['baz'];
        },
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
        allowExtendedTokenAttributes: true,
      });
      const request = new Request({
        body: {
          client_id: 12345,
          client_secret: 'secret',
          username: 'foo',
          password: 'bar',
          grant_type: 'password',
          scope: 'baz',
        },
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'transfer-encoding': 'chunked',
        },
        method: 'POST',
        query: {},
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(function () {
          should.exist(response.body.access_token);
          should.exist(response.body.refresh_token);
          should.exist(response.body.token_type);
          response.body.scope.should.eql('baz');
          should.exist(response.body.foo);
        })
        .catch(should.fail);
    });

    describe('with client types', function () {
      const grants = ['authorization_code', 'client_credentials', 'refresh_token'];
      const clients = {
        public: { id: 'public', type: 'public', grants },
        // a public client whose model accepts a secret
        publicWithSecret: { id: 'publicWithSecret', type: 'public', secret: 'secret', grants },
        other: { id: 'other', type: 'public', grants },
        confidential: { id: 'confidential', type: 'confidential', secret: 'secret', grants },
        legacy: { id: 'legacy', secret: 'secret', grants },
      };
      const codeVerifier = stringUtil.base64URLEncode(crypto.randomBytes(32));
      const codeChallenge = stringUtil.base64URLEncode(crypto.createHash('sha256').update(codeVerifier).digest());

      let getClientCalls = 0;

      // codes and refresh tokens are named after the client they were issued to: `code-<id>`, `token-<id>`.
      // `bare-<id>` codes were issued without a `code_challenge`.
      const model = Model.from({
        getClient: function (clientId, clientSecret) {
          getClientCalls++;
          const client = clients[clientId];
          if (!client) return null;
          // a provided secret must always match, also for public clients
          if (clientSecret !== null && client.secret !== clientSecret) return null;
          return { id: client.id, grants: client.grants, type: client.type };
        },
        getAuthorizationCode: function (code) {
          if (code.startsWith('bare-')) {
            return {
              authorizationCode: code,
              client: { id: code.replace('bare-', '') },
              expiresAt: new Date(new Date().getTime() * 2),
              user: {},
            };
          }

          return {
            authorizationCode: code,
            client: { id: code.replace('code-', '') },
            expiresAt: new Date(new Date().getTime() * 2),
            user: {},
            codeChallengeMethod: 'S256',
            codeChallenge: codeChallenge,
          };
        },
        revokeAuthorizationCode: function () {
          return true;
        },
        getRefreshToken: function (refreshToken) {
          return { refreshToken: refreshToken, client: { id: refreshToken.replace('token-', '') }, user: {} };
        },
        revokeToken: function () {
          return true;
        },
        getUserFromClient: function () {
          return {};
        },
        saveToken: function (token, client, user) {
          return Object.assign({}, token, { client: client, user: user });
        },
      });

      const requestToken = async function (body, { headers, requireClientAuthentication } = {}) {
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120,
          requireClientAuthentication: requireClientAuthentication,
        });
        const request = new Request({
          body: body,
          headers: Object.assign(
            { 'content-type': 'application/x-www-form-urlencoded', 'transfer-encoding': 'chunked' },
            headers,
          ),
          method: 'POST',
          query: {},
        });
        const response = new Response({ body: {}, headers: {} });

        getClientCalls = 0;
        await handler.handle(request, response);

        return response;
      };

      const shouldFail = async function (promise, ErrorType, message) {
        try {
          await promise;
        } catch (e) {
          e.should.be.an.instanceOf(ErrorType);
          e.message.should.equal(message);
          return e;
        }

        should.fail();
      };

      const authorizationCode = function (clientId, extra) {
        return Object.assign(
          {
            grant_type: 'authorization_code',
            client_id: clientId,
            code: `code-${clientId}`,
            code_verifier: codeVerifier,
          },
          extra,
        );
      };

      const refreshToken = function (clientId, extra) {
        return Object.assign(
          { grant_type: 'refresh_token', client_id: clientId, refresh_token: `token-${clientId}` },
          extra,
        );
      };

      const clientCredentials = function (clientId, extra) {
        return Object.assign({ grant_type: 'client_credentials', client_id: clientId }, extra);
      };

      const passwordGrant = function (clientId, extra) {
        return Object.assign({ grant_type: 'password', client_id: clientId, username: 'foo', password: 'bar' }, extra);
      };

      const invalidClient = 'Invalid client: client is invalid';
      const missingSecret = 'Invalid client: cannot retrieve client credentials';

      // rejected before `model.getClient()` is called
      const shouldFailEarly = async function (promise) {
        await shouldFail(promise, InvalidClientError, missingSecret);
        getClientCalls.should.equal(0);
      };

      describe('with a public client', function () {
        it('should return a token for `authorization_code` with a valid S256 code verifier and no secret', async function () {
          const response = await requestToken(authorizationCode('public'));

          should.exist(response.body.access_token);
          response.body.token_type.should.equal('Bearer');
        });

        it('should throw an error for `authorization_code` without a code verifier', async function () {
          await shouldFailEarly(requestToken(authorizationCode('public', { code_verifier: undefined })));
        });

        it('should throw an error for a code issued without a `code_challenge` if it supplies a secret', async function () {
          await shouldFail(
            requestToken(
              authorizationCode('publicWithSecret', {
                code: 'bare-publicWithSecret',
                code_verifier: undefined,
                client_secret: 'secret',
              }),
            ),
            InvalidGrantError,
            'Invalid grant: authorization code was issued without a `code_challenge`',
          );
        });

        it('should throw an error for a code issued without a `code_challenge` if `requireClientAuthentication` is false for `authorization_code`', async function () {
          await shouldFail(
            requestToken(authorizationCode('public', { code: 'bare-public', code_verifier: undefined }), {
              requireClientAuthentication: { authorization_code: false },
            }),
            InvalidGrantError,
            'Invalid grant: authorization code was issued without a `code_challenge`',
          );
        });

        it('should throw an error for `authorization_code` with an invalid code verifier', async function () {
          await shouldFail(
            requestToken(
              authorizationCode('public', { code_verifier: stringUtil.base64URLEncode(crypto.randomBytes(32)) }),
            ),
            InvalidGrantError,
            'Invalid grant: code verifier is invalid',
          );
        });

        it('should return a token for `refresh_token` without a secret', async function () {
          const response = await requestToken(refreshToken('public'));

          should.exist(response.body.access_token);
        });

        it('should throw an error for `client_credentials` without a secret', async function () {
          await shouldFailEarly(requestToken(clientCredentials('public')));
        });

        it('should throw an error for `client_credentials` even if `requireClientAuthentication` is false for it', async function () {
          await shouldFail(
            requestToken(clientCredentials('public'), { requireClientAuthentication: { client_credentials: false } }),
            UnauthorizedClientError,
            'Unauthorized client: `grant_type` is invalid',
          );
        });

        it('should throw an error if `requireClientAuthentication` is true for `authorization_code`', async function () {
          await shouldFailEarly(
            requestToken(authorizationCode('public'), { requireClientAuthentication: { authorization_code: true } }),
          );
        });

        it('should throw an error if `requireClientAuthentication` is true for `refresh_token`', async function () {
          await shouldFailEarly(
            requestToken(refreshToken('public'), { requireClientAuthentication: { refresh_token: true } }),
          );
        });

        it('should throw an error if it supplies a `client_secret` in the body', async function () {
          await shouldFail(
            requestToken(authorizationCode('public', { client_secret: 'wrong' })),
            InvalidClientError,
            invalidClient,
          );
        });

        it('should throw a 401 error if it supplies credentials in the Authorization header', async function () {
          const e = await shouldFail(
            requestToken(authorizationCode('public', { client_id: undefined }), {
              headers: { authorization: util.format('Basic %s', Buffer.from('public:wrong').toString('base64')) },
            }),
            InvalidClientError,
            invalidClient,
          );

          e.code.should.equal(401);
        });

        it('should throw an error for an authorization code issued to another client', async function () {
          await shouldFail(
            requestToken(authorizationCode('public', { code: 'code-other' })),
            InvalidGrantError,
            'Invalid grant: authorization code is invalid',
          );
        });

        it('should throw an error for a refresh token issued to another client', async function () {
          await shouldFail(
            requestToken(refreshToken('public', { refresh_token: 'token-other' })),
            InvalidGrantError,
            'Invalid grant: refresh token was issued to another client',
          );
        });
      });

      describe('with a confidential client', function () {
        it('should throw an error for `authorization_code` with a valid code verifier and no secret', async function () {
          await shouldFail(requestToken(authorizationCode('confidential')), InvalidClientError, invalidClient);
        });

        it('should return a token for `authorization_code` with a valid code verifier and a secret', async function () {
          const response = await requestToken(authorizationCode('confidential', { client_secret: 'secret' }));

          should.exist(response.body.access_token);
        });

        it('should throw an error for `authorization_code` with a valid code verifier and a wrong secret', async function () {
          await shouldFail(
            requestToken(authorizationCode('confidential', { client_secret: 'wrong' })),
            InvalidClientError,
            invalidClient,
          );
        });

        it('should throw an error for `refresh_token` without a secret', async function () {
          await shouldFail(requestToken(refreshToken('confidential')), InvalidClientError, invalidClient);
        });

        it('should return a token for `refresh_token` without a secret if `requireClientAuthentication` is false for it', async function () {
          const response = await requestToken(refreshToken('confidential'), {
            requireClientAuthentication: { refresh_token: false },
          });

          should.exist(response.body.access_token);
        });

        it('should return a token for `client_credentials` with a secret', async function () {
          const response = await requestToken(clientCredentials('confidential', { client_secret: 'secret' }));

          should.exist(response.body.access_token);
        });

        it('should throw an error for an authorization code issued to another client, even with a valid secret', async function () {
          await shouldFail(
            requestToken(authorizationCode('confidential', { client_secret: 'secret', code: 'code-other' })),
            InvalidGrantError,
            'Invalid grant: authorization code is invalid',
          );
        });
      });

      describe('with a client without `type` (treated as confidential)', function () {
        it('should throw an error for `authorization_code` with a valid code verifier and no secret', async function () {
          await shouldFail(requestToken(authorizationCode('legacy')), InvalidClientError, invalidClient);
        });

        it('should return a token for `authorization_code` with a valid code verifier and a secret', async function () {
          const response = await requestToken(authorizationCode('legacy', { client_secret: 'secret' }));

          should.exist(response.body.access_token);
        });

        it('should return a token for `authorization_code` with a valid code verifier and no secret if `requireClientAuthentication` is false for it', async function () {
          const response = await requestToken(authorizationCode('legacy'), {
            requireClientAuthentication: { authorization_code: false },
          });

          should.exist(response.body.access_token);
        });

        it('should throw an error for `authorization_code` without a code verifier and no secret', async function () {
          await shouldFailEarly(requestToken(authorizationCode('legacy', { code_verifier: undefined })));
        });

        it('should throw an error for `password` without a secret', async function () {
          await shouldFailEarly(requestToken(passwordGrant('legacy')));
        });

        it('should throw an error for `client_credentials` without a secret', async function () {
          await shouldFailEarly(requestToken(clientCredentials('legacy')));
        });

        it('should throw an error for `refresh_token` without a secret', async function () {
          await shouldFail(requestToken(refreshToken('legacy')), InvalidClientError, invalidClient);
        });

        it('should throw an error for a wrong secret', async function () {
          await shouldFail(
            requestToken(refreshToken('legacy', { client_secret: 'wrong' })),
            InvalidClientError,
            invalidClient,
          );
        });

        it('should return a token for `client_credentials` with a secret', async function () {
          const response = await requestToken(clientCredentials('legacy', { client_secret: 'secret' }));

          should.exist(response.body.access_token);
        });
      });
    });
  });

  describe('getClient()', function () {
    it('should throw an error if `clientId` is invalid', async function () {
      const model = Model.from({
        getClient: function () {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { client_id: 'øå€£‰', client_secret: 'foo' },
        headers: {},
        method: {},
        query: {},
      });

      try {
        await handler.getClient(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `client_id`');
      }
    });

    it('should throw an error if `clientSecret` is invalid', async function () {
      const model = Model.from({
        getClient: function () {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { client_id: 'foo', client_secret: 'øå€£‰' },
        headers: {},
        method: {},
        query: {},
      });

      try {
        await handler.getClient(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `client_secret`');
      }
    });

    it('should throw an error if `client` is missing', function () {
      const model = Model.from({
        getClient: function () {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { client_id: 12345, client_secret: 'secret' },
        headers: {},
        method: {},
        query: {},
      });

      return handler
        .getClient(request)
        .then(should.fail)
        .catch(function (e) {
          e.should.be.an.instanceOf(InvalidClientError);
          e.message.should.equal('Invalid client: client is invalid');
        });
    });

    it('should throw an error if `client.grants` is missing', function () {
      const model = Model.from({
        getClient: function () {
          return {};
        },
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { client_id: 12345, client_secret: 'secret' },
        headers: {},
        method: {},
        query: {},
      });

      return handler
        .getClient(request)
        .then(should.fail)
        .catch(function (e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: missing client `grants`');
        });
    });

    it('should throw an error if `client.grants` is invalid', function () {
      const model = Model.from({
        getClient: function () {
          return { grants: 'foobar' };
        },
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { client_id: 12345, client_secret: 'secret' },
        headers: {},
        method: {},
        query: {},
      });

      return handler
        .getClient(request)
        .then(should.fail)
        .catch(function (e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: `grants` must be an array');
        });
    });

    it('should throw a 401 error if the client is invalid and the request contains an authorization header', function () {
      const model = Model.from({
        getClient: function () {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: {},
        headers: {
          authorization: util.format('Basic %s', Buffer.from('foo:bar').toString('base64')),
        },
        method: {},
        query: {},
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .getClient(request, response)
        .then(should.fail)
        .catch(function (e) {
          e.should.be.an.instanceOf(InvalidClientError);
          e.code.should.equal(401);
          e.message.should.equal('Invalid client: client is invalid');

          response.get('WWW-Authenticate').should.equal('Basic realm="Service"');
        });
    });

    it('should return a client', function () {
      const client = { id: 12345, grants: [] };
      const model = Model.from({
        getClient: function () {
          return client;
        },
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { client_id: 12345, client_secret: 'secret' },
        headers: {},
        method: {},
        query: {},
      });

      return handler
        .getClient(request)
        .then(function (data) {
          data.should.equal(client);
        })
        .catch(should.fail);
    });

    describe('client authentication by client type', function () {
      const getClient = function ({ client, body, requireClientAuthentication }) {
        const model = Model.from({
          getClient: function () {
            return client;
          },
          saveToken: function () {},
        });
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120,
          requireClientAuthentication: requireClientAuthentication,
        });
        const request = new Request({ body: body, headers: {}, method: {}, query: {} });

        return handler.getClient(request);
      };

      const shouldReject = function (promise, message = 'Invalid client: client is invalid') {
        return promise.then(should.fail).catch(function (e) {
          e.should.be.an.instanceOf(InvalidClientError);
          e.message.should.equal(message);
        });
      };

      // rejected before the model is called, the client type is unknown at that point
      const shouldRejectEarly = function (promise) {
        return shouldReject(promise, 'Invalid client: cannot retrieve client credentials');
      };

      describe('with an unknown client `type`', function () {
        ['Confidential', 'CONFIDENTIAL', '', 'native'].forEach(function (type) {
          it(`should throw an error for type ${JSON.stringify(type)}`, function () {
            const client = { id: 'foo', grants: ['authorization_code'], type };

            return getClient({
              client,
              body: { client_id: 'foo', grant_type: 'authorization_code', code_verifier: 'verifier' },
            })
              .then(should.fail)
              .catch(function (e) {
                e.should.be.an.instanceOf(ServerError);
                e.message.should.equal('Server error: `type` must be "public" or "confidential"');
              });
          });
        });

        it('should treat a `null` type as no type', function () {
          const client = { id: 'foo', grants: ['authorization_code'], type: null };

          return shouldReject(
            getClient({
              client,
              body: { client_id: 'foo', grant_type: 'authorization_code', code_verifier: 'verifier' },
            }),
          );
        });
      });

      describe('with a public client and no `client_secret`', function () {
        it('should return the client for `authorization_code` with PKCE', function () {
          const client = { id: 'foo', grants: ['authorization_code'], type: 'public' };

          return getClient({
            client,
            body: { client_id: 'foo', grant_type: 'authorization_code', code_verifier: 'verifier' },
          })
            .then(function (data) {
              data.should.equal(client);
            })
            .catch(should.fail);
        });

        it('should throw an error for `authorization_code` without PKCE', function () {
          const client = { id: 'foo', grants: ['authorization_code'], type: 'public' };

          return shouldRejectEarly(getClient({ client, body: { client_id: 'foo', grant_type: 'authorization_code' } }));
        });

        it('should return the client for `refresh_token`', function () {
          const client = { id: 'foo', grants: ['refresh_token'], type: 'public' };

          return getClient({ client, body: { client_id: 'foo', grant_type: 'refresh_token' } })
            .then(function (data) {
              data.should.equal(client);
            })
            .catch(should.fail);
        });

        it('should throw an error for `client_credentials`', function () {
          const client = { id: 'foo', grants: ['client_credentials'], type: 'public' };

          return shouldRejectEarly(getClient({ client, body: { client_id: 'foo', grant_type: 'client_credentials' } }));
        });

        it('should throw an error if `requireClientAuthentication` is explicitly true for the grant', function () {
          const client = { id: 'foo', grants: ['authorization_code'], type: 'public' };

          return shouldRejectEarly(
            getClient({
              client,
              body: { client_id: 'foo', grant_type: 'authorization_code', code_verifier: 'verifier' },
              requireClientAuthentication: { authorization_code: true },
            }),
          );
        });
      });

      describe('with a confidential client and no `client_secret`', function () {
        it('should throw an error', function () {
          const client = { id: 'foo', grants: ['authorization_code'], type: 'confidential' };

          return shouldRejectEarly(getClient({ client, body: { client_id: 'foo', grant_type: 'authorization_code' } }));
        });

        it('should throw an error for `authorization_code` with PKCE', function () {
          const client = { id: 'foo', grants: ['authorization_code'], type: 'confidential' };

          return shouldReject(
            getClient({
              client,
              body: { client_id: 'foo', grant_type: 'authorization_code', code_verifier: 'verifier' },
            }),
          );
        });

        it('should return the client if `requireClientAuthentication` is explicitly false for the grant', function () {
          const client = { id: 'foo', grants: ['refresh_token'], type: 'confidential' };

          return getClient({
            client,
            body: { client_id: 'foo', grant_type: 'refresh_token' },
            requireClientAuthentication: { refresh_token: false },
          })
            .then(function (data) {
              data.should.equal(client);
            })
            .catch(should.fail);
        });
      });

      describe('with a client without `type` (treated as confidential) and no `client_secret`', function () {
        it('should throw an error', function () {
          const client = { id: 'foo', grants: ['password'] };

          return shouldRejectEarly(getClient({ client, body: { client_id: 'foo', grant_type: 'password' } }));
        });

        it('should throw an error before calling the model if the Authorization header has no secret', function () {
          const model = Model.from({
            getClient: function () {
              should.fail();
            },
            saveToken: function () {},
          });
          const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
          const request = new Request({
            body: { grant_type: 'password' },
            headers: { authorization: util.format('Basic %s', Buffer.from('foo:').toString('base64')) },
            method: {},
            query: {},
          });

          return handler
            .getClient(request, new Response({ body: {}, headers: {} }))
            .then(should.fail)
            .catch(function (e) {
              e.should.be.an.instanceOf(InvalidRequestError);
              e.message.should.equal('Missing parameter: `client_secret`');
            });
        });

        it('should throw an error for `refresh_token`', function () {
          const client = { id: 'foo', grants: ['refresh_token'] };

          return shouldReject(getClient({ client, body: { client_id: 'foo', grant_type: 'refresh_token' } }));
        });

        it('should throw an error for `authorization_code` with PKCE', function () {
          const client = { id: 'foo', grants: ['authorization_code'] };

          return shouldReject(
            getClient({
              client,
              body: { client_id: 'foo', grant_type: 'authorization_code', code_verifier: 'verifier' },
            }),
          );
        });
      });
    });

    describe('with `password` grant type and `requireClientAuthentication` is false', function () {
      it('should return a client ', function () {
        const client = { id: 12345, grants: [] };
        const model = Model.from({
          getClient: function () {
            return client;
          },
          saveToken: function () {},
        });

        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120,
          requireClientAuthentication: {
            password: false,
          },
        });
        const request = new Request({
          body: { client_id: 'blah', grant_type: 'password' },
          headers: {},
          method: {},
          query: {},
        });

        return handler
          .getClient(request)
          .then(function (data) {
            data.should.equal(client);
          })
          .catch(should.fail);
      });
    });

    describe('with `password` grant type and `requireClientAuthentication` is false and Authorization header', function () {
      it('should return a client ', function () {
        const client = { id: 12345, grants: [] };
        const model = Model.from({
          getClient: function () {
            return client;
          },
          saveToken: function () {},
        });

        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120,
          requireClientAuthentication: {
            password: false,
          },
        });
        const request = new Request({
          body: { grant_type: 'password' },
          headers: {
            authorization: util.format('Basic %s', Buffer.from('blah:').toString('base64')),
          },
          method: {},
          query: {},
        });

        return handler
          .getClient(request)
          .then(function (data) {
            data.should.equal(client);
          })
          .catch(should.fail);
      });
    });

    it('should support promises', function () {
      const model = Model.from({
        getClient: async function () {
          return { grants: [] };
        },
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { client_id: 12345, client_secret: 'secret' },
        headers: {},
        method: {},
        query: {},
      });

      handler.getClient(request).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function () {
      const model = Model.from({
        getClient: function () {
          return { grants: [] };
        },
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { client_id: 12345, client_secret: 'secret' },
        headers: {},
        method: {},
        query: {},
      });

      handler.getClient(request).should.be.an.instanceOf(Promise);
    });
  });

  describe('getClientCredentials()', function () {
    it('should throw an error if `client_id` is missing', async function () {
      const model = Model.from({
        getClient: function () {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { client_secret: 'foo' },
        headers: {},
        method: {},
        query: {},
      });

      try {
        await handler.getClientCredentials(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidClientError);
        e.message.should.equal('Invalid client: cannot retrieve client credentials');
      }
    });

    it('should return credentials with only `clientId` when `client_secret` is missing', function () {
      const model = Model.from({
        getClient: function () {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { client_id: 'foo', grant_type: 'refresh_token' },
        headers: {},
        method: {},
        query: {},
      });

      const credentials = handler.getClientCredentials(request);
      credentials.should.eql({ clientId: 'foo' });
    });

    it('should throw an error if `client_secret` is missing and no client could be accepted without it', function () {
      const model = Model.from({
        getClient: function () {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { client_id: 'foo', grant_type: 'password' },
        headers: {},
        method: {},
        query: {},
      });

      try {
        handler.getClientCredentials(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidClientError);
        e.message.should.equal('Invalid client: cannot retrieve client credentials');
      }
    });

    describe('with `client_id` and grant type is `password` and `requireClientAuthentication` is false', function () {
      it('should return a client', function () {
        const model = Model.from({
          getClient: function () {},
          saveToken: function () {},
        });
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120,
          requireClientAuthentication: { password: false },
        });
        const request = new Request({
          body: { client_id: 'foo', grant_type: 'password' },
          headers: {},
          method: {},
          query: {},
        });
        const credentials = handler.getClientCredentials(request);

        credentials.should.eql({ clientId: 'foo' });
      });
    });

    describe('with `client_id` and `client_secret` in the request header as basic auth', function () {
      it('should return a client', function () {
        const model = Model.from({
          getClient: function () {},
          saveToken: function () {},
        });
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120,
        });
        const request = new Request({
          body: {},
          headers: {
            authorization: util.format('Basic %s', Buffer.from('foo:bar').toString('base64')),
          },
          method: {},
          query: {},
        });
        const credentials = handler.getClientCredentials(request);

        credentials.should.eql({ clientId: 'foo', clientSecret: 'bar' });
      });
    });

    describe('with `client_id` and `client_secret` in the request body', function () {
      it('should return a client', function () {
        const model = Model.from({
          getClient: function () {},
          saveToken: function () {},
        });
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120,
        });
        const request = new Request({
          body: { client_id: 'foo', client_secret: 'bar' },
          headers: {},
          method: {},
          query: {},
        });
        const credentials = handler.getClientCredentials(request);

        credentials.should.eql({ clientId: 'foo', clientSecret: 'bar' });
      });
    });
  });

  describe('handleGrantType()', function () {
    it('should throw an error if `grant_type` is missing', async function () {
      const model = Model.from({
        getClient: function () {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {},
      });

      try {
        await handler.handleGrantType(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `grant_type`');
      }
    });

    it('should throw an error if `grant_type` is invalid', async function () {
      const model = Model.from({
        getClient: function () {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { grant_type: '~foo~' },
        headers: {},
        method: {},
        query: {},
      });

      try {
        await handler.handleGrantType(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `grant_type`');
      }
    });

    it('should throw an error if `grant_type` is unsupported', async function () {
      const model = Model.from({
        getClient: function () {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { grant_type: 'foobar' },
        headers: {},
        method: {},
        query: {},
      });

      try {
        await handler.handleGrantType(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(UnsupportedGrantTypeError);
        e.message.should.equal('Unsupported grant type: `grant_type` is invalid');
      }
    });

    it('should throw an error if `grant_type` is unauthorized', async function () {
      const client = { grants: ['client_credentials'] };
      const model = Model.from({
        getClient: function () {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { grant_type: 'password' },
        headers: {},
        method: {},
        query: {},
      });

      try {
        await handler.handleGrantType(request, client);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(UnauthorizedClientError);
        e.message.should.equal('Unauthorized client: `grant_type` is invalid');
      }
    });

    it('should throw an error if a public client uses `client_credentials`', async function () {
      const client = { grants: ['client_credentials'], type: 'public' };
      const model = Model.from({
        getClient: function () {},
        getUserFromClient: function () {
          return {};
        },
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { grant_type: 'client_credentials' },
        headers: {},
        method: {},
        query: {},
      });

      try {
        await handler.handleGrantType(request, client);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(UnauthorizedClientError);
        e.message.should.equal('Unauthorized client: `grant_type` is invalid');
      }
    });

    it('should throw an invalid grant error if a non-oauth error is thrown', function () {
      const client = { grants: ['password'] };
      const model = Model.from({
        getClient: function (clientId, password) {
          return client;
        },
        getUser: function (uid, pwd) {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { grant_type: 'password', username: 'foo', password: 'bar' },
        headers: {},
        method: {},
        query: {},
      });

      return handler
        .handleGrantType(request, client)
        .then(should.fail)
        .catch(function (e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: user credentials are invalid');
        });
    });

    describe('with grant_type `authorization_code`', function () {
      it('should return a token', function () {
        const client = { id: 'foobar', grants: ['authorization_code'] };
        const token = {};
        const model = Model.from({
          getAuthorizationCode: function () {
            return {
              authorizationCode: 12345,
              client: { id: 'foobar' },
              expiresAt: new Date(new Date() * 2),
              user: {},
            };
          },
          getClient: function () {},
          saveToken: function () {
            return token;
          },
          validateScope: function () {
            return ['foo'];
          },
          revokeAuthorizationCode: function () {
            return {
              authorizationCode: 12345,
              client: { id: 'foobar' },
              expiresAt: new Date(new Date() / 2),
              user: {},
            };
          },
        });
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120,
        });
        const request = new Request({
          body: {
            code: 12345,
            grant_type: 'authorization_code',
          },
          headers: {},
          method: {},
          query: {},
        });

        return handler
          .handleGrantType(request, client)
          .then(function (data) {
            data.should.equal(token);
          })
          .catch(should.fail);
      });
    });

    describe('with PKCE', function () {
      it('should return a token when code verifier is valid using S256 code challenge method', async function () {
        const methods = ['S256', undefined];

        for (const method of methods) {
          const codeVerifier = stringUtil.base64URLEncode(crypto.randomBytes(32));
          const authorizationCode = {
            authorizationCode: 12345,
            client: { id: 'foobar' },
            expiresAt: new Date(new Date().getTime() * 2),
            user: {},
            codeChallengeMethod: method,
            codeChallenge: stringUtil.base64URLEncode(crypto.createHash('sha256').update(codeVerifier).digest()),
          };
          const client = { id: 'foobar', grants: ['authorization_code'] };
          const token = {};
          const model = Model.from({
            getAuthorizationCode: function () {
              return authorizationCode;
            },
            getClient: function () {},
            saveToken: function () {
              return token;
            },
            validateScope: function () {
              return ['foo'];
            },
            revokeAuthorizationCode: function () {
              return authorizationCode;
            },
          });
          const handler = new TokenHandler({
            accessTokenLifetime: 120,
            model: model,
            refreshTokenLifetime: 120,
          });
          const request = new Request({
            body: {
              code: 12345,
              grant_type: 'authorization_code',
              code_verifier: codeVerifier,
            },
            headers: {},
            method: {},
            query: {},
          });

          const data = await handler.handleGrantType(request, client);
          data.should.equal(token);
        }
      });

      it('should return a token when code verifier is valid using plain code challenge method', async function () {
        const methods = ['plain', undefined];

        for (const method of methods) {
          const codeVerifier = stringUtil.base64URLEncode(crypto.randomBytes(32));
          const authorizationCode = {
            authorizationCode: 12345,
            client: { id: 'foobar' },
            expiresAt: new Date(new Date().getTime() * 2),
            user: {},
            codeChallengeMethod: method,
            codeChallenge: codeVerifier,
          };
          const client = { id: 'foobar', grants: ['authorization_code'] };
          const token = {};
          const model = Model.from({
            getAuthorizationCode: function () {
              return authorizationCode;
            },
            getClient: function () {},
            saveToken: function () {
              return token;
            },
            validateScope: function () {
              return ['foo'];
            },
            revokeAuthorizationCode: function () {
              return authorizationCode;
            },
          });
          const handler = new TokenHandler({
            enablePlainPKCE: true,
            accessTokenLifetime: 120,
            model: model,
            refreshTokenLifetime: 120,
          });
          const request = new Request({
            body: {
              code: 12345,
              grant_type: 'authorization_code',
              code_verifier: codeVerifier,
            },
            headers: {},
            method: {},
            query: {},
          });

          const data = await handler.handleGrantType(request, client);
          data.should.equal(token);
        }
      });

      it('should throw an invalid grant error when code verifier is invalid', function () {
        const codeVerifier = stringUtil.base64URLEncode(crypto.randomBytes(32));
        const authorizationCode = {
          authorizationCode: 12345,
          client: { id: 'foobar' },
          expiresAt: new Date(new Date().getTime() * 2),
          user: {},
          codeChallengeMethod: 'S256',
          codeChallenge: stringUtil.base64URLEncode(crypto.createHash('sha256').update(codeVerifier).digest()),
        };
        const client = { id: 'foobar', grants: ['authorization_code'] };
        const token = {};
        const model = Model.from({
          getAuthorizationCode: function () {
            return authorizationCode;
          },
          getClient: function () {},
          saveToken: function () {
            return token;
          },
          validateScope: function () {
            return ['foo'];
          },
          revokeAuthorizationCode: function () {
            return authorizationCode;
          },
        });
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120,
        });
        const request = new Request({
          body: {
            code: 12345,
            grant_type: 'authorization_code',
            code_verifier: '123123123123123123123123123123123123123123123',
          },
          headers: {},
          method: {},
          query: {},
        });

        return handler
          .handleGrantType(request, client)
          .then(should.fail)
          .catch(function (e) {
            e.should.be.an.instanceOf(InvalidGrantError);
            e.message.should.equal('Invalid grant: code verifier is invalid');
          });
      });

      it('should throw an invalid grant error when code verifier is missing', function () {
        const codeVerifier = stringUtil.base64URLEncode(crypto.randomBytes(32));
        const authorizationCode = {
          authorizationCode: 12345,
          client: { id: 'foobar' },
          expiresAt: new Date(new Date().getTime() * 2),
          user: {},
          codeChallengeMethod: 'S256',
          codeChallenge: stringUtil.base64URLEncode(crypto.createHash('sha256').update(codeVerifier).digest()),
        };
        const client = { id: 'foobar', grants: ['authorization_code'] };
        const token = {};
        const model = Model.from({
          getAuthorizationCode: function () {
            return authorizationCode;
          },
          getClient: function () {},
          saveToken: function () {
            return token;
          },
          validateScope: function () {
            return ['foo'];
          },
          revokeAuthorizationCode: function () {
            return authorizationCode;
          },
        });
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120,
        });
        const request = new Request({
          body: {
            code: 12345,
            grant_type: 'authorization_code',
          },
          headers: {},
          method: {},
          query: {},
        });

        return handler
          .handleGrantType(request, client)
          .then(should.fail)
          .catch(function (e) {
            e.should.be.an.instanceOf(InvalidGrantError);
            e.message.should.equal('Missing parameter: `code_verifier`');
          });
      });

      it('should throw an invalid grant error when code verifier is present but code challenge is missing', function () {
        const authorizationCode = {
          authorizationCode: 12345,
          client: { id: 'foobar' },
          expiresAt: new Date(new Date().getTime() * 2),
          user: {},
        };
        const client = { id: 'foobar', grants: ['authorization_code'] };
        const token = {};
        const model = Model.from({
          getAuthorizationCode: function () {
            return authorizationCode;
          },
          getClient: function () {},
          saveToken: function () {
            return token;
          },
          validateScope: function () {
            return ['foo'];
          },
          revokeAuthorizationCode: function () {
            return authorizationCode;
          },
        });
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120,
        });
        const request = new Request({
          body: {
            code: 12345,
            grant_type: 'authorization_code',
            code_verifier: '123123123123123123123123123123123123123123123',
          },
          headers: {},
          method: {},
          query: {},
        });

        return handler
          .handleGrantType(request, client)
          .then(should.fail)
          .catch(function (e) {
            e.should.be.an.instanceOf(InvalidGrantError);
            e.message.should.equal('Invalid grant: code verifier is invalid');
          });
      });
    });

    describe('with grant_type `client_credentials`', function () {
      it('should return a token', function () {
        const client = { grants: ['client_credentials'] };
        const token = {};
        const model = Model.from({
          getClient: function () {},
          getUserFromClient: function () {
            return {};
          },
          saveToken: function () {
            return token;
          },
          validateScope: function () {
            return ['foo'];
          },
        });
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120,
        });
        const request = new Request({
          body: {
            grant_type: 'client_credentials',
            scope: 'foo',
          },
          headers: {},
          method: {},
          query: {},
        });

        return handler
          .handleGrantType(request, client)
          .then(function (data) {
            data.should.equal(token);
          })
          .catch(should.fail);
      });
    });

    describe('with grant_type `password`', function () {
      it('should return a token', function () {
        const client = { grants: ['password'] };
        const token = {};
        const model = Model.from({
          getClient: function () {},
          getUser: function () {
            return {};
          },
          saveToken: function () {
            return token;
          },
          validateScope: function () {
            return ['baz'];
          },
        });
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120,
        });
        const request = new Request({
          body: {
            client_id: 12345,
            client_secret: 'secret',
            grant_type: 'password',
            password: 'bar',
            username: 'foo',
            scope: 'baz',
          },
          headers: {},
          method: {},
          query: {},
        });

        return handler
          .handleGrantType(request, client)
          .then(function (data) {
            data.should.equal(token);
          })
          .catch(should.fail);
      });
    });

    describe('with grant_type `refresh_token`', function () {
      it('should return a token', function () {
        const client = { grants: ['refresh_token'] };
        const token = { accessToken: 'foo', client: {}, user: {} };
        const model = Model.from({
          getClient: function () {},
          getRefreshToken: function () {
            return {
              accessToken: 'foo',
              client: {},
              refreshTokenExpiresAt: new Date(new Date() * 2),
              user: {},
            };
          },
          saveToken: function () {
            return token;
          },
          revokeToken: function () {
            return {
              accessToken: 'foo',
              client: {},
              refreshTokenExpiresAt: new Date(new Date() / 2),
              user: {},
            };
          },
        });
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120,
        });
        const request = new Request({
          body: {
            grant_type: 'refresh_token',
            refresh_token: 12345,
          },
          headers: {},
          method: {},
          query: {},
        });

        return handler
          .handleGrantType(request, client)
          .then(function (data) {
            data.should.equal(token);
          })
          .catch(should.fail);
      });
    });

    describe('with custom grant_type', function () {
      it('should return a token', function () {
        const client = {
          grants: ['urn:ietf:params:oauth:grant-type:saml2-bearer'],
        };
        const token = {};
        const model = Model.from({
          getClient: function () {},
          getUser: function () {
            return {};
          },
          saveToken: function () {
            return token;
          },
          validateScope: function () {
            return ['foo'];
          },
        });
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120,
          extendedGrantTypes: {
            'urn:ietf:params:oauth:grant-type:saml2-bearer': PasswordGrantType,
          },
        });
        const request = new Request({
          body: {
            grant_type: 'urn:ietf:params:oauth:grant-type:saml2-bearer',
            username: 'foo',
            password: 'bar',
          },
          headers: {},
          method: {},
          query: {},
        });

        return handler
          .handleGrantType(request, client)
          .then(function (data) {
            data.should.equal(token);
          })
          .catch(should.fail);
      });
    });
  });

  describe('getAccessTokenLifetime()', function () {
    it('should return the client access token lifetime', function () {
      const client = { accessTokenLifetime: 60 };
      const model = Model.from({
        getClient: function () {
          return client;
        },
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });

      handler.getAccessTokenLifetime(client).should.equal(60);
    });

    it('should return the default access token lifetime', function () {
      const client = {};
      const model = Model.from({
        getClient: function () {
          return client;
        },
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });

      handler.getAccessTokenLifetime(client).should.equal(120);
    });
  });

  describe('getRefreshTokenLifetime()', function () {
    it('should return the client access token lifetime', function () {
      const client = { refreshTokenLifetime: 60 };
      const model = Model.from({
        getClient: function () {
          return client;
        },
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });

      handler.getRefreshTokenLifetime(client).should.equal(60);
    });

    it('should return the default access token lifetime', function () {
      const client = {};
      const model = Model.from({
        getClient: function () {
          return client;
        },
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });

      handler.getRefreshTokenLifetime(client).should.equal(120);
    });
  });

  describe('getTokenType()', function () {
    it('should return a token type', function () {
      const model = Model.from({
        getClient: function () {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const tokenType = handler.getTokenType({
        accessToken: 'foo',
        refreshToken: 'bar',
        scope: ['foobar'],
      });
      tokenType.should.deep.include({
        accessToken: 'foo',
        accessTokenLifetime: undefined,
        refreshToken: 'bar',
        scope: ['foobar'],
      });
    });
  });

  describe('updateSuccessResponse()', function () {
    it('should set the `body`', function () {
      const model = Model.from({
        getClient: function () {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const tokenType = new BearerTokenType('foo', 'bar', 'biz');
      const response = new Response({ body: {}, headers: {} });

      handler.updateSuccessResponse(response, tokenType);

      response.body.should.eql({
        access_token: 'foo',
        expires_in: 'bar',
        refresh_token: 'biz',
        token_type: 'Bearer',
      });
    });

    it('should set the `Cache-Control` header', function () {
      const model = Model.from({
        getClient: function () {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const tokenType = new BearerTokenType('foo', 'bar', 'biz');
      const response = new Response({ body: {}, headers: {} });

      handler.updateSuccessResponse(response, tokenType);

      response.get('Cache-Control').should.equal('no-store');
    });

    it('should set the `Pragma` header', function () {
      const model = Model.from({
        getClient: function () {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const tokenType = new BearerTokenType('foo', 'bar', 'biz');
      const response = new Response({ body: {}, headers: {} });

      handler.updateSuccessResponse(response, tokenType);

      response.get('Pragma').should.equal('no-cache');
    });
  });

  describe('updateErrorResponse()', function () {
    it('should set the `body`', function () {
      const error = new AccessDeniedError('Cannot request a token');
      const model = Model.from({
        getClient: function () {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const response = new Response({ body: {}, headers: {} });

      handler.updateErrorResponse(response, error);

      response.body.error.should.equal('access_denied');
      response.body.error_description.should.equal('Cannot request a token');
    });

    it('should set the `status`', function () {
      const error = new AccessDeniedError('Cannot request a token');
      const model = Model.from({
        getClient: function () {},
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const response = new Response({ body: {}, headers: {} });

      handler.updateErrorResponse(response, error);

      response.status.should.equal(400);
    });
  });
});

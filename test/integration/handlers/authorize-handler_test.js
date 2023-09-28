'use strict';

/**
 * Module dependencies.
 */

const AccessDeniedError = require('../../../lib/errors/access-denied-error');
const AuthenticateHandler = require('../../../lib/handlers/authenticate-handler');
const AuthorizeHandler = require('../../../lib/handlers/authorize-handler');
const CodeResponseType = require('../../../lib/response-types/code-response-type');
const InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
const InvalidClientError = require('../../../lib/errors/invalid-client-error');
const InvalidRequestError = require('../../../lib/errors/invalid-request-error');
const InvalidScopeError = require('../../../lib/errors/invalid-scope-error');
const UnsupportedResponseTypeError = require('../../../lib/errors/unsupported-response-type-error');
const Request = require('../../../lib/request');
const Response = require('../../../lib/response');
const ServerError = require('../../../lib/errors/server-error');
const UnauthorizedClientError = require('../../../lib/errors/unauthorized-client-error');
const should = require('chai').should();
const url = require('url');

const createModel = (model = {}) => {
  return {
    getAccessToken: () => should.fail(),
    getClient: () => should.fail(),
    saveAuthorizationCode: () => should.fail(),
    ...model
  };
};

/**
 * Test `AuthorizeHandler` integration.
 */

describe('AuthorizeHandler integration', function() {
  describe('constructor()', function() {
    it('should throw an error if `options.authorizationCodeLifetime` is missing', function() {
      try {
        new AuthorizeHandler();
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `authorizationCodeLifetime`');
      }
    });

    it('should throw an error if `options.model` is missing', function() {
      try {
        new AuthorizeHandler({ authorizationCodeLifetime: 120 });
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should throw an error if the model does not implement `getClient()`', function() {
      try {
        new AuthorizeHandler({ authorizationCodeLifetime: 120, model: {} });
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `getClient()`');
      }
    });

    it('should throw an error if the model does not implement `saveAuthorizationCode()`', function() {
      try {
        new AuthorizeHandler({ authorizationCodeLifetime: 120, model: { getClient: () => should.fail() } });
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `saveAuthorizationCode()`');
      }
    });

    it('should throw an error if the model does not implement `getAccessToken()`', function() {
      const model = {
        getClient: () => should.fail(),
        saveAuthorizationCode: () => should.fail()
      };

      try {
        new AuthorizeHandler({ authorizationCodeLifetime: 120, model });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `getAccessToken()`');
      }
    });

    it('should set the `authorizationCodeLifetime`', function() {
      const model = createModel();
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });

      handler.authorizationCodeLifetime.should.equal(120);
    });

    it('should throw if the custom `authenticateHandler` does not implement a `handle` method', function () {
      const model = createModel();
      const authenticateHandler = {}; // misses handle() method

      try {
        new AuthorizeHandler({ authenticateHandler, authorizationCodeLifetime: 120, model });
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: authenticateHandler does not implement `handle()`');
      }
    });

    it('should set the default `authenticateHandler`, if no custom one is passed', function() {
      const model = createModel();
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      handler.authenticateHandler.should.be.an.instanceOf(AuthenticateHandler);
    });

    it('should set the custom `authenticateHandler`, if valid', function () {
      const model = createModel();

      class CustomAuthenticateHandler {
        async handle () {}
      }

      const authenticateHandler = new CustomAuthenticateHandler();
      const handler = new AuthorizeHandler({ authenticateHandler, authorizationCodeLifetime: 120, model });
      handler.authenticateHandler.should.be.an.instanceOf(CustomAuthenticateHandler);
      handler.authenticateHandler.should.not.be.an.instanceOf(AuthenticateHandler);
    });

    it('should set the `model`', function() {
      const model = createModel();
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      handler.model.should.equal(model);
    });
  });

  describe('handle()', function() {
    it('should throw an error if `request` is missing', async function() {
      const model = createModel();
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });

      try {
        await handler.handle();
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: `request` must be an instance of Request');
      }
    });

    it('should throw an error if `response` is missing', async function() {
      const model = createModel();
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      try {
        await handler.handle(request);
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: `response` must be an instance of Response');
      }
    });

    it('should redirect to an error response if user denied access', async function() {
      const client = {
        id: 'client-12345',
        grants: ['authorization_code'],
        redirectUris: ['http://example.com/cb']
      };
      const model = createModel({
        getAccessToken: async function(_token) {
          _token.should.equal('foobarbazmootoken');
          return {
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
          };
        },
        getClient: async function(clientId, clientSecret) {
          clientId.should.equal(client.id);
          (clientSecret === null).should.equal(true);
          return { ...client };
        }
      });
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const request = new Request({
        body: {
          client_id: client.id,
          response_type: 'code'
        },
        method: {},
        headers: {
          'Authorization': 'Bearer foobarbazmootoken'
        },
        query: {
          state: 'foobar',
          allowed: 'false'
        }
      });
      const response = new Response({ body: {}, headers: {} });

      try {
        await handler.handle(request, response);
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(AccessDeniedError);
        e.message.should.equal('Access denied: user denied access to application');
        response
          .get('location')
          .should
          .equal('http://example.com/cb?error=access_denied&error_description=Access%20denied%3A%20user%20denied%20access%20to%20application&state=foobar');
      }
    });

    it('should redirect to an error response if a non-oauth error is thrown', async function() {
      const model = createModel({
        getAccessToken: async function() {
          return {
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
          };
        },
        getClient: async function() {
          return {
            grants: ['authorization_code'],
            redirectUris: ['http://example.com/cb']
          };
        },
        saveAuthorizationCode: async function() {
          throw new CustomError('Unhandled exception');
        }
      });
      class CustomError extends Error {}
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const request = new Request({
        body: {
          client_id: 12345,
          response_type: 'code'
        },
        headers: {
          'Authorization': 'Bearer foo'
        },
        method: {},
        query: {
          state: 'foobar'
        }
      });
      const response = new Response({ body: {}, headers: {} });

      try {
        await handler.handle(request, response);
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(ServerError); // non-oauth-errors are converted to ServerError
        e.message.should.equal('Unhandled exception');
        response
          .get('location')
          .should
          .equal('http://example.com/cb?error=server_error&error_description=Unhandled%20exception&state=foobar');
      }
    });

    it('should redirect to an error response if an oauth error is thrown', async function() {
      const model = createModel({
        getAccessToken: async function() {
          return {
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
          };
        },
        getClient: async function() {
          return { grants: ['authorization_code'], redirectUris: ['http://example.com/cb'] };
        },
        saveAuthorizationCode: async function() {
          throw new AccessDeniedError('Cannot request this auth code');
        }
      });
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const request = new Request({
        body: {
          client_id: 12345,
          response_type: 'code'
        },
        headers: {
          'Authorization': 'Bearer foo'
        },
        method: {},
        query: {
          state: 'foobar'
        }
      });
      const response = new Response({ body: {}, headers: {} });

      try {
        await handler.handle(request, response);
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(AccessDeniedError);
        e.message.should.equal('Cannot request this auth code');
        response
          .get('location')
          .should
          .equal('http://example.com/cb?error=access_denied&error_description=Cannot%20request%20this%20auth%20code&state=foobar');
      }
    });

    it('should redirect to a successful response with `code` and `state` if successful', async function() {
      const client = {
        id: 'client-12343434',
        grants: ['authorization_code'],
        redirectUris: ['http://example.com/cb']
      };
      const model = createModel({
        getAccessToken: async function(_token) {
          _token.should.equal('foobarbaztokenmoo');
          return {
            client,
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
          };
        },
        getClient: async function(clientId, clientSecret) {
          clientId.should.equal(client.id);
          (clientSecret === null).should.equal(true);
          return { ...client };
        },
        saveAuthorizationCode: async function() {
          return {
            authorizationCode: 'fooobar-long-authzcode-?',
            client
          };
        }
      });
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const request = new Request({
        body: {
          client_id: client.id,
          response_type: 'code'
        },
        headers: {
          'Authorization': 'Bearer foobarbaztokenmoo'
        },
        method: {},
        query: {
          state: 'foobarbazstatemoo'
        }
      });
      const response = new Response({ body: {}, headers: {} });
      const data = await handler.handle(request, response);
      data.authorizationCode.should.equal('fooobar-long-authzcode-?');
      data.client.should.deep.equal(client);
      response.status.should.equal(302);
      response
        .get('location')
        .should
        .equal('http://example.com/cb?code=fooobar-long-authzcode-%3F&state=foobarbazstatemoo');
    });

    it('should redirect to an error response if `scope` is invalid', async function() {
      const model = createModel({
        getAccessToken: async function() {
          return {
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
          };
        },
        getClient: async function() {
          return { grants: ['authorization_code'], redirectUris: ['http://example.com/cb'] };
        },
        saveAuthorizationCode: async function() {
          return {};
        }
      });
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const request = new Request({
        body: {
          client_id: 12345,
          response_type: 'code'
        },
        headers: {
          'Authorization': 'Bearer foo'
        },
        method: {},
        query: {
          scope: [],
          state: 'foobar'
        }
      });
      const response = new Response({ body: {}, headers: {} });

      try {
        await handler.handle(request, response);
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidScopeError);
        e.message.should.equal('Invalid parameter: `scope`');
        response.status.should.equal(302);
        response.get('location').should.equal('http://example.com/cb?error=invalid_scope&error_description=Invalid%20parameter%3A%20%60scope%60&state=foobar');
      }
    });

    it('should redirect to a successful response if `model.validateScope` is not defined', async function() {
      const client = { grants: ['authorization_code'], redirectUris: ['http://example.com/cb'] };
      const model = {
        getAccessToken: function() {
          return {
            client: client,
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
          };
        },
        getClient: function() {
          return client;
        },
        saveAuthorizationCode: function() {
          return { authorizationCode: 'fooobar-long-authzcode-?', client };
        }
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const request = new Request({
        body: {
          client_id: 12345,
          response_type: 'code'
        },
        headers: {
          'Authorization': 'Bearer foo'
        },
        method: {},
        query: {
          scope: 'read',
          state: 'foobarbazstatemoo'
        }
      });
      const response = new Response({ body: {}, headers: {} });
      const data = await handler.handle(request, response);
      data.should.deep.equal({
        authorizationCode: 'fooobar-long-authzcode-?',
        client: client
      });
      response.status.should.equal(302);
      response
        .get('location')
        .should
        .equal('http://example.com/cb?code=fooobar-long-authzcode-%3F&state=foobarbazstatemoo');
    });

    it('should redirect to an error response if `scope` is insufficient (validateScope)', async function() {
      const client = { id: 12345, grants: ['authorization_code'], redirectUris: ['http://example.com/cb'] };
      const model = {
        getAccessToken: async function() {
          return {
            client: client,
            user: { name: 'foouser' },
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
          };
        },
        getClient: async function() {
          return client;
        },
        saveAuthorizationCode: async function() {
          return { authorizationCode: 12345, client };
        },
        validateScope: async function(_user, _client, _scope) {
          _scope.should.eql(['read']);
          return false;
        }
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const request = new Request({
        body: {
          client_id: 12345,
          response_type: 'code'
        },
        headers: {
          'Authorization': 'Bearer foo'
        },
        method: {},
        query: {
          scope: 'read',
          state: 'foobar'
        }
      });
      const response = new Response({ body: {}, headers: {} });

      try {
        await handler.handle(request, response);
        should.fail();
      } catch(e) {
        e.should.be.an.instanceOf(InvalidScopeError);
        e.message.should.equal('Invalid scope: Requested scope is invalid');
        response.status.should.equal(302);
        response
          .get('location')
          .should
          .equal('http://example.com/cb?error=invalid_scope&error_description=Invalid%20scope%3A%20Requested%20scope%20is%20invalid&state=foobar');
      }
    });

    it('should redirect to an error response if `state` is missing', async function() {
      const model = createModel({
        getAccessToken: async function() {
          return {
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
          };
        },
        getClient: async function() {
          return { grants: ['authorization_code'], redirectUris: ['http://example.com/cb'] };
        },
        saveAuthorizationCode: async function() {
          throw new AccessDeniedError('Cannot request this auth code');
        }
      });
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const request = new Request({
        body: {
          client_id: 12345,
          response_type: 'code'
        },
        headers: {
          'Authorization': 'Bearer foo'
        },
        method: {},
        query: {}
      });
      const response = new Response({ body: {}, headers: {} });

      try {
        await handler.handle(request, response);
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `state`');
        response.status.should.equal(302);
        response
          .get('location')
          .should
          .equal('http://example.com/cb?error=invalid_request&error_description=Missing%20parameter%3A%20%60state%60');
      }
    });

    it('should redirect to an error response if `response_type` is invalid', async function() {
      const model = {
        getAccessToken: async function() {
          return {
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
          };
        },
        getClient: async function() {
          return { grants: ['authorization_code'], redirectUris: ['http://example.com/cb'] };
        },
        saveAuthorizationCode: () => should.fail() // should fail before call
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const request = new Request({
        body: {
          client_id: 12345,
          response_type: 'test'
        },
        headers: {
          'Authorization': 'Bearer foo'
        },
        method: {},
        query: {
          state: 'foobar'
        }
      });
      const response = new Response({ body: {}, headers: {} });

      try {
        await handler.handle(request, response);
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(UnsupportedResponseTypeError);
        e.message.should.equal('Unsupported response type: `response_type` is not supported');
        response.status.should.equal(302);
        response
          .get('location')
          .should
          .equal('http://example.com/cb?error=unsupported_response_type&error_description=Unsupported%20response%20type%3A%20%60response_type%60%20is%20not%20supported&state=foobar');
      }
    });

    it('should return the `code` if successful', async function() {
      const client = { grants: ['authorization_code'], redirectUris: ['http://example.com/cb'] };
      const model = {
        getAccessToken: async function() {
          return {
            client: client,
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
          };
        },
        getClient: async function() {
          return client;
        },
        generateAuthorizationCode: async () => 'some-code',
        saveAuthorizationCode: async function(code) {
          return { authorizationCode: code.authorizationCode, client: client };
        }
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const request = new Request({
        body: {
          client_id: 12345,
          response_type: 'code'
        },
        headers: {
          'Authorization': 'Bearer foo'
        },
        method: {},
        query: {
          state: 'foobar'
        }
      });
      const response = new Response({ body: {}, headers: {} });

      const data = await handler.handle(request, response);
      data.should.eql({
        authorizationCode: 'some-code',
        client: client
      });
    });

    it('should return the `code` if successful (full model implementation)', async function () {
      const user = { name: 'fooUser' };
      const state = 'fooobarstatebaz';
      const scope = ['read'];
      const client = {
        id: 'client-1322132131',
        grants: ['authorization_code'],
        redirectUris: ['http://example.com/cb']
      };
      const authorizationCode = 'long-authz-code';
      const accessTokenDoc = {
        accessToken: 'some-access-token-code',
        client,
        user,
        scope,
        accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
      };
      const model = {
        getClient: async function (clientId, clientSecret) {
          clientId.should.equal(client.id);
          (clientSecret === null).should.equal(true);
          return { ...client };
        },
        getAccessToken: async function (_token) {
          _token.should.equal(accessTokenDoc.accessToken);
          return { ...accessTokenDoc };
        },
        verifyScope: async function (_tokenDoc, _scope) {
          _tokenDoc.should.equal(accessTokenDoc);
          _scope.should.eql(accessTokenDoc.scope);
          return true;
        },
        validateScope: async function (_user, _client, _scope) {
          _user.should.deep.equal(user);
          _client.should.deep.equal(client);
          _scope.should.eql(scope);
          return _scope;
        },
        generateAuthorizationCode: async function (_client, _user, _scope) {
          _user.should.deep.equal(user);
          _client.should.deep.equal(client);
          _scope.should.eql(scope);
          return authorizationCode;
        },
        saveAuthorizationCode: async function (code, _client, _user) {
          code.authorizationCode.should.equal(authorizationCode);
          code.expiresAt.should.be.instanceOf(Date);
          _user.should.deep.equal(user);
          _client.should.deep.equal(client);
          return { ...code, client, user };
        }
      };

      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const request = new Request({
        body: {
          client_id: client.id,
          response_type: 'code'
        },
        headers: {
          'Authorization': `Bearer ${accessTokenDoc.accessToken}`
        },
        method: {},
        query: { state, scope: scope.join(' ') }
      });

      const response = new Response({ body: {}, headers: {} });
      const data = await handler.handle(request, response);
      data.scope.should.eql(scope);
      data.client.should.deep.equal(client);
      data.user.should.deep.equal(user);
      data.expiresAt.should.be.instanceOf(Date);
      data.redirectUri.should.equal(client.redirectUris[0]);
      response.status.should.equal(302);
      response
        .get('location')
        .should
        .equal('http://example.com/cb?code=long-authz-code&state=fooobarstatebaz');
    });

    it('should support a custom `authenticateHandler`', async function () {
      const user = { name: 'user1' };
      const authenticateHandler = {
        handle: async function () {
          // all good
          return { ...user };
        }
      };
      const client = { grants: ['authorization_code'], redirectUris: ['http://example.com/cb'] };
      const model = {
        getAccessToken: async function() {
          return {
            client: client,
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
          };
        },
        getClient: async function() {
          return client;
        },
        generateAuthorizationCode: async () => 'some-code',
        saveAuthorizationCode: async function(code) {
          return { authorizationCode: code.authorizationCode, client: client };
        }
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model, authenticateHandler });
      const request = new Request({
        body: {
          client_id: 12345,
          response_type: 'code'
        },
        headers: {
          'Authorization': 'Bearer foo'
        },
        method: {},
        query: {
          state: 'foobar'
        }
      });
      const response = new Response({ body: {}, headers: {} });

      const data = await handler.handle(request, response);
      data.should.eql({
        authorizationCode: 'some-code',
        client: client
      });
    });
  });

  describe('generateAuthorizationCode()', function() {
    it('should return an auth code', function() {
      const model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });

      return handler.generateAuthorizationCode()
        .then(function(data) {
          data.should.be.a.sha256();
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      const model = {
        generateAuthorizationCode: async function() {
          return {};
        },
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });

      handler.generateAuthorizationCode().should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      const model = {
        generateAuthorizationCode: function() {
          return {};
        },
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });

      handler.generateAuthorizationCode().should.be.an.instanceOf(Promise);
    });
  });

  describe('getAuthorizationCodeLifetime()', function() {
    it('should return a date', function() {
      const model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });

      handler.getAuthorizationCodeLifetime().should.be.an.instanceOf(Date);
    });
  });

  describe('validateRedirectUri()', function() {
    it('should support empty method', function() {
      const model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };

      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });

      handler.validateRedirectUri('http://example.com/a', { redirectUris: ['http://example.com/a'] }).should.be.an.instanceOf(Promise);
    });

    it('should support promises', function() {
      const model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {},
        validateRedirectUri: async function() {
          return true;
        }
      };

      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });

      handler.validateRedirectUri('http://example.com/a', { }).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      const model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {},
        validateRedirectUri: function() {
          return true;
        }
      };

      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });

      handler.validateRedirectUri('http://example.com/a', { }).should.be.an.instanceOf(Promise);
    });
  });

  describe('getClient()', function() {
    it('should throw an error if `client_id` is missing', async function() {
      const model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const request = new Request({ body: { response_type: 'code' }, headers: {}, method: {}, query: {} });

      try {
        await handler.getClient(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `client_id`');
      }
    });

    it('should throw an error if `client_id` is invalid', async function() {
      const model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const request = new Request({ body: { client_id: 'øå€£‰', response_type: 'code' }, headers: {}, method: {}, query: {} });

      try {
        await handler.getClient(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `client_id`');
      }
    });

    it('should throw an error if `client.redirectUri` is invalid', async function() {
      const model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const request = new Request({ body: { client_id: 12345, response_type: 'code', redirect_uri: 'foobar' }, headers: {}, method: {}, query: {} });

      try {
        await handler.getClient(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid request: `redirect_uri` is not a valid URI');
      }
    });

    it('should throw an error if `client` is missing', function() {
      const model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const request = new Request({ body: { client_id: 12345, response_type: 'code' }, headers: {}, method: {}, query: {} });

      return handler.getClient(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidClientError);
          e.message.should.equal('Invalid client: client credentials are invalid');
        });
    });

    it('should throw an error if `client.grants` is missing', function() {
      const model = {
        getAccessToken: function() {},
        getClient: function() {
          return {};
        },
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const request = new Request({ body: { client_id: 12345, response_type: 'code' }, headers: {}, method: {}, query: {} });

      return handler.getClient(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidClientError);
          e.message.should.equal('Invalid client: missing client `grants`');
        });
    });

    it('should throw an error if `client` is unauthorized', function() {
      const model = {
        getAccessToken: function() {},
        getClient: function() {
          return { grants: [] };
        },
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const request = new Request({ body: { client_id: 12345, response_type: 'code' }, headers: {}, method: {}, query: {} });

      return handler.getClient(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(UnauthorizedClientError);
          e.message.should.equal('Unauthorized client: `grant_type` is invalid');
        });
    });

    it('should throw an error if `client.redirectUri` is missing', function() {
      const model = {
        getAccessToken: function() {},
        getClient: function() { return { grants: ['authorization_code'] }; },
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const request = new Request({ body: { client_id: 12345, response_type: 'code' }, headers: {}, method: {}, query: {} });

      return handler.getClient(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidClientError);
          e.message.should.equal('Invalid client: missing client `redirectUri`');
        });
    });

    it('should throw an error if `client.redirectUri` is not equal to `redirectUri`', function() {
      const model = {
        getAccessToken: function() {},
        getClient: function() {
          return { grants: ['authorization_code'], redirectUris: ['https://example.com'] };
        },
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const request = new Request({ body: { client_id: 12345, response_type: 'code', redirect_uri: 'https://foobar.com' }, headers: {}, method: {}, query: {} });

      return handler.getClient(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidClientError);
          e.message.should.equal('Invalid client: `redirect_uri` does not match client value');
        });
    });

    it('should support promises', function() {
      const model = {
        getAccessToken: function() {},
        getClient: async function() {
          return { grants: ['authorization_code'], redirectUris: ['http://example.com/cb'] };
        },
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const request = new Request({
        body: { client_id: 12345 },
        headers: {},
        method: {},
        query: {}
      });

      handler.getClient(request).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      const model = {
        getAccessToken: function() {},
        getClient: function() {
          return { grants: ['authorization_code'], redirectUris: ['http://example.com/cb'] };
        },
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const request = new Request({
        body: { client_id: 12345 },
        headers: {},
        method: {},
        query: {}
      });

      handler.getClient(request).should.be.an.instanceOf(Promise);
    });

    describe('with `client_id` in the request query', function() {
      it('should return a client', function() {
        const client = { grants: ['authorization_code'], redirectUris: ['http://example.com/cb'] };
        const model = {
          getAccessToken: function() {},
          getClient: function() {
            return client;
          },
          saveAuthorizationCode: function() {}
        };
        const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
        const request = new Request({ body: { response_type: 'code' }, headers: {}, method: {}, query: { client_id: 12345 } });

        return handler.getClient(request)
          .then(function(data) {
            data.should.equal(client);
          })
          .catch(should.fail);
      });
    });
  });

  describe('getScope()', function() {
    it('should throw an error if `scope` is invalid', async function() {
      const model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const request = new Request({ body: { scope: 'øå€£‰' }, headers: {}, method: {}, query: {} });

      try {
        await handler.getScope(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidScopeError);
        e.message.should.equal('Invalid parameter: `scope`');
      }
    });

    describe('with `scope` in the request body', function() {
      it('should return the scope', function() {
        const model = {
          getAccessToken: function() {},
          getClient: function() {},
          saveAuthorizationCode: function() {}
        };
        const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
        const request = new Request({ body: { scope: 'foo' }, headers: {}, method: {}, query: {} });

        handler.getScope(request).should.eql(['foo']);
      });
    });

    describe('with `scope` in the request query', function() {
      it('should return the scope', function() {
        const model = {
          getAccessToken: function() {},
          getClient: function() {},
          saveAuthorizationCode: function() {}
        };
        const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
        const request = new Request({ body: {}, headers: {}, method: {}, query: { scope: 'foo' } });

        handler.getScope(request).should.eql(['foo']);
      });
    });
  });

  describe('getState()', function() {
    it('should throw an error if `allowEmptyState` is false and `state` is missing', async function() {
      const model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ allowEmptyState: false, authorizationCodeLifetime: 120, model });
      const request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      try {
        await handler.getState(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `state`');
      }
    });

    it('should allow missing `state` if `allowEmptyState` is valid', function () {
      const model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ allowEmptyState: true, authorizationCodeLifetime: 120, model });
      const request = new Request({ body: {}, headers: {}, method: {}, query: {} });
      const state = handler.getState(request);
      should.equal(state, undefined);
    });

    it('should throw an error if `state` is invalid', async function() {
      const model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const request = new Request({ body: {}, headers: {}, method: {}, query: { state: 'øå€£‰' } });

      try {
        await handler.getState(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `state`');
      }
    });

    describe('with `state` in the request body', function() {
      it('should return the state', function() {
        const model = {
          getAccessToken: function() {},
          getClient: function() {},
          saveAuthorizationCode: function() {}
        };
        const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
        const request = new Request({ body: { state: 'foobar' }, headers: {}, method: {}, query: {} });

        handler.getState(request).should.equal('foobar');
      });
    });

    describe('with `state` in the request query', function() {
      it('should return the state', function() {
        const model = {
          getAccessToken: function() {},
          getClient: function() {},
          saveAuthorizationCode: function() {}
        };
        const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
        const request = new Request({ body: {}, headers: {}, method: {}, query: { state: 'foobar' } });

        handler.getState(request).should.equal('foobar');
      });
    });
  });

  describe('getUser()', function() {
    it('should throw an error if `user` is missing', function() {
      const authenticateHandler = { handle: function() {} };
      const model = {
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ authenticateHandler: authenticateHandler, authorizationCodeLifetime: 120, model });
      const request = new Request({ body: {}, headers: {}, method: {}, query: {} });
      const response = new Response();

      return handler.getUser(request, response)
        .then(should.fail)
        .catch(function (e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: `handle()` did not return a `user` object');
        });
    });

    it('should return a user', function() {
      const user = {};
      const model = {
        getAccessToken: function() {
          return {
            user: user,
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
          };
        },
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const request = new Request({ body: {}, headers: { 'Authorization': 'Bearer foo' }, method: {}, query: {} });
      const response = new Response({ body: {}, headers: {} });

      return handler.getUser(request, response)
        .then(function(data) {
          data.should.equal(user);
        })
        .catch(should.fail);
    });
  });

  describe('saveAuthorizationCode()', function() {
    it('should return an auth code', function() {
      const authorizationCode = {};
      const model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {
          return authorizationCode;
        }
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });

      return handler.saveAuthorizationCode('foo', 'bar', 'biz', 'baz')
        .then(function(data) {
          data.should.equal(authorizationCode);
        })
        .catch(should.fail);
    });

    it('should support promises when calling `model.saveAuthorizationCode()`', function() {
      const model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: async function() {
          return {};
        }
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });

      handler.saveAuthorizationCode('foo', 'bar', 'biz', 'baz').should.be.an.instanceOf(Promise);
    });

    it('should support non-promises when calling `model.saveAuthorizationCode()`', function() {
      const model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {
          return {};
        }
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });

      handler.saveAuthorizationCode('foo', 'bar', 'biz', 'baz').should.be.an.instanceOf(Promise);
    });
  });

  describe('getResponseType()', function() {
    it('should throw an error if `response_type` is missing', async function() {
      const model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      try {
        await handler.getResponseType(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `response_type`');
      }
    });

    it('should throw an error if `response_type` is not `code`', async function() {
      const model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const request = new Request({ body: { response_type: 'foobar' }, headers: {}, method: {}, query: {} });

      try {
        await handler.getResponseType(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(UnsupportedResponseTypeError);
        e.message.should.equal('Unsupported response type: `response_type` is not supported');
      }
    });

    describe('with `response_type` in the request body', function() {
      it('should return a response type', function() {
        const model = {
          getAccessToken: function() {},
          getClient: function() {},
          saveAuthorizationCode: function() {}
        };
        const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
        const request = new Request({ body: { response_type: 'code' }, headers: {}, method: {}, query: {} });
        const ResponseType = handler.getResponseType(request);

        ResponseType.should.equal(CodeResponseType);
      });
    });

    describe('with `response_type` in the request query', function() {
      it('should return a response type', function() {
        const model = {
          getAccessToken: function() {},
          getClient: function() {},
          saveAuthorizationCode: function() {}
        };
        const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
        const request = new Request({ body: {}, headers: {}, method: {}, query: { response_type: 'code' } });
        const ResponseType = handler.getResponseType(request);

        ResponseType.should.equal(CodeResponseType);
      });
    });
  });

  describe('buildSuccessRedirectUri()', function() {
    it('should return a redirect uri', function() {
      const model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const responseType = new CodeResponseType(12345);
      const redirectUri = handler.buildSuccessRedirectUri('http://example.com/cb', responseType);

      url.format(redirectUri).should.equal('http://example.com/cb?code=12345');
    });
  });

  describe('buildErrorRedirectUri()', function() {
    it('should set `error_description` if available', function() {
      const error = new InvalidClientError('foo bar');
      const model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const redirectUri = handler.buildErrorRedirectUri('http://example.com/cb', error);

      url.format(redirectUri).should.equal('http://example.com/cb?error=invalid_client&error_description=foo%20bar');
    });

    it('should return a redirect uri', function() {
      const error = new InvalidClientError();
      const model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const redirectUri = handler.buildErrorRedirectUri('http://example.com/cb', error);

      url.format(redirectUri).should.equal('http://example.com/cb?error=invalid_client&error_description=Bad%20Request');
    });
  });

  describe('updateResponse()', function() {
    it('should set the `location` header', function() {
      const model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const response = new Response({ body: {}, headers: {} });
      const uri = url.parse('http://example.com/cb');

      handler.updateResponse(response, uri, 'foobar');

      response.get('location').should.equal('http://example.com/cb?state=foobar');
    });
  });

  describe('getCodeChallengeMethod()', function() {
    it('should get code challenge method', function() {
      const model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const request = new Request({ body: {code_challenge_method: 'S256'}, headers: {}, method: {}, query: {} });

      const codeChallengeMethod  = handler.getCodeChallengeMethod(request);
      codeChallengeMethod.should.equal('S256');
    });

    it('should throw if the code challenge method is not supported', async function () {
      const model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const request = new Request({ body: {code_challenge_method: 'foo'}, headers: {}, method: {}, query: {} });

      try {
        await handler.getCodeChallengeMethod(request);

        should.fail();
      } catch (e) {
        // defined in RFC 7636 - 4.4
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid request: transform algorithm \'foo\' not supported');
      }
    });

    it('should get default code challenge method plain if missing', function() {
      const model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      const codeChallengeMethod  = handler.getCodeChallengeMethod(request);
      codeChallengeMethod.should.equal('plain');
    });
  });

  describe('getCodeChallenge()', function() {
    it('should get code challenge', function() {
      const model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model });
      const request = new Request({ body: {code_challenge: 'challenge'}, headers: {}, method: {}, query: {} });

      const codeChallengeMethod  = handler.getCodeChallenge(request);
      codeChallengeMethod.should.equal('challenge');
    });
  });
});

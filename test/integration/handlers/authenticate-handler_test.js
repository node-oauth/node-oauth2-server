'use strict';

/**
 * Module dependencies.
 */

const AccessDeniedError = require('../../../lib/errors/access-denied-error');
const AuthenticateHandler = require('../../../lib/handlers/authenticate-handler');
const InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
const InvalidRequestError = require('../../../lib/errors/invalid-request-error');
const InsufficientScopeError = require('../../../lib/errors/insufficient-scope-error');
const InvalidTokenError = require('../../../lib/errors/invalid-token-error');
// const Promise = require('bluebird');
const Request = require('../../../lib/request');
const Response = require('../../../lib/response');
const ServerError = require('../../../lib/errors/server-error');
const UnauthorizedRequestError = require('../../../lib/errors/unauthorized-request-error');
const should = require('chai').should();
const sinon = require('sinon');

/**
 * Test `AuthenticateHandler` integration.
 */

describe('AuthenticateHandler integration', function() {

  describe('constructor()', function() {

    it('should throw an error if `options.model` is missing', function() {

      let authenticateHandler;

      try {
        authenticateHandler = new AuthenticateHandler();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }

      should.not.exist(authenticateHandler);

    });

    it('should throw an error if the model does not implement `getAccessToken()`', function() {

      let authenticateHandler;

      try {
        authenticateHandler = new AuthenticateHandler({ model: {} });
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `getAccessToken()`');
      }

      should.not.exist(authenticateHandler);

    });

    it('should throw an error if `scope` was given and `addAcceptedScopesHeader()` is missing', function() {

      let authenticateHandler;

      try {
        authenticateHandler = new AuthenticateHandler({
          model: { getAccessToken: function() {} },
          scope: 'foobar'
        });
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `addAcceptedScopesHeader`');
      }

      should.not.exist(authenticateHandler);

    });

    it('should throw an error if `scope` was given and `addAuthorizedScopesHeader()` is missing', function() {
      let authenticateHandler;
      
      try {
        authenticateHandler = new AuthenticateHandler({
          addAcceptedScopesHeader: true,
          model: { getAccessToken: function() {} },
          scope: 'foobar'
        });
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `addAuthorizedScopesHeader`');
      }

      should.not.exist(authenticateHandler);

    });

    it('should throw an error if `scope` was given and the model does not implement `verifyScope()`', function() {

      let authenticateHandler;

      try {
        authenticateHandler = new AuthenticateHandler({
          addAcceptedScopesHeader: true,
          addAuthorizedScopesHeader: true,
          model: {
            getAccessToken: function() {}
          },
          scope: 'foobar' 
        });
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `verifyScope()`');
      }

      should.not.exist(authenticateHandler);

    });

    it('should set the `model`', function() {

      const model = { getAccessToken: function() {} };
      const grantType = new AuthenticateHandler({ model: model });
      grantType.model.should.equal(model);

    });

    it('should set the `scope`', function() {

      const model = {
        getAccessToken: function() {},
        verifyScope: function() {}
      };

      const grantType = new AuthenticateHandler({
        addAcceptedScopesHeader: true,
        addAuthorizedScopesHeader: true,
        model: model,
        scope: 'foobar'
      });

      grantType.scope.should.equal('foobar');

    });

  });

  describe('handle()', function() {

    it('should throw an error if `request` is missing', async function() {

      const handler = new AuthenticateHandler({
        model: { getAccessToken: function() {} } 
      });

      let res;

      try {
        res = await handler.handle();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: `request` must be an instance of Request');
      }

      should.not.exist(res);

    });

    it('should set the `WWW-Authenticate` header if an unauthorized request error is thrown', function() {

      const model = {
        getAccessToken: function() {
          throw new UnauthorizedRequestError();
        }
      };
      const handler = new AuthenticateHandler({ model: model });
      const request = new Request({ body: {}, headers: { 'Authorization': 'Bearer foo' }, method: {}, query: {} });
      const response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(should.fail)
        .catch(function() {
          response.get('WWW-Authenticate').should.equal('Bearer realm="Service"');
        });

    });

    it('should throw the error if an oauth error is thrown', function() {

      const model = {
        getAccessToken: function() {
          throw new AccessDeniedError('Cannot request this access token');
        }
      };

      const handler = new AuthenticateHandler({ model: model });
      const request = new Request({ body: {}, headers: { 'Authorization': 'Bearer foo' }, method: {}, query: {} });
      const response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(should.fail)
        .catch( function(e) {
          e.should.be.an.instanceOf(AccessDeniedError);
          e.message.should.equal('Cannot request this access token');
        });

    });

    it('should throw a server error if a non-oauth error is thrown', function() {

      const model = {
        getAccessToken: function() {
          throw new Error('Unhandled exception');
        }
      };

      const handler = new AuthenticateHandler({ model: model });
      const request = new Request({ body: {}, headers: { 'Authorization': 'Bearer foo' }, method: {}, query: {} });
      const response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Unhandled exception');
        });

    });

    it('should return an access token', async function() {

      const accessToken = {
        user: {id: 123},
        accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
      };

      const authenticateHandler = new AuthenticateHandler({
        addAcceptedScopesHeader: true,
        addAuthorizedScopesHeader: true,
        model: {
          getAccessToken: sinon.stub().resolves(accessToken),
          verifyScope: sinon.stub().resolves(true)
        },
        scope: 'foo'
      });

      const request = new Request({
        body: {},
        headers: { 'Authorization': 'Bearer foo' },
        method: {},
        query: {}
      });

      const response = new Response({
        body: {},
        headers: {}
      });

      let res;

      try {
        res = await authenticateHandler.handle(request, response);
      } catch (err) {
        should.fail(err.stack);
      }
      should.exist(res);
      res.should.equal(accessToken);

    });

  });

  describe('getTokenFromRequest()', function() {

    it('should throw an error if more than one authentication method is used', async function() {

      const handler = new AuthenticateHandler({
        model: { getAccessToken: function() {} }
      });

      const request = new Request({
        body: {},
        headers: { 'Authorization': 'Bearer foo' },
        method: {},
        query: { access_token: 'foo' }
      });

      let token;

      try {
        token = await handler.getTokenFromRequest(request);
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid request: only one authentication method is allowed');
      }

      should.not.exist(token);

    });

    it('should throw an error if `accessToken` is missing', async function() {

      const handler = new AuthenticateHandler({
        model: {
          getAccessToken: function() {}
        }
      });
      
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {}
      });

      let token;

      try {
        token = await handler.getTokenFromRequest(request);
      } catch (e) {
        e.should.be.an.instanceOf(UnauthorizedRequestError);
        e.message.should.equal('Unauthorized request: no authentication given');
      }

      should.not.exist(token);
    });
  });

  describe('getTokenFromRequestHeader()', function() {

    it('should throw an error if the token is malformed', async function() {


      const handler = new AuthenticateHandler({
        model: {
          getAccessToken: function() {}
        }
      }); 

      const authHeaderValue = 'foobar';

      const request = new Request({
        body: {},
        headers: {
          'Authorization': authHeaderValue
        },
        method: {},
        query: {}
      });

      let token;

      try {
        token = await handler.getTokenFromRequestHeader(request);
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid request: malformed authorization header');
      }

      should.not.exist(token);

    });

    it('should return the bearer token', async function() {

      const token = 'foo';

      const handler = new AuthenticateHandler({
        model: {
          getAccessToken: function() {}
        }
      });

      const request = new Request({
        body: {},
        headers: {
          'Authorization': `Bearer ${token}`
        },
        method: {},
        query: {}
      });

      let bearerToken;

      try {
        bearerToken = await handler.getTokenFromRequestHeader(request);
      } catch (err) {
        should.fail(err.stack);
      }

      should.exist(bearerToken);
      bearerToken.should.equal(token);

    });

  });

  describe('getTokenFromRequestQuery()', function() {

    it('should throw an error if the query contains a token', async function() {

      const handler = new AuthenticateHandler({
        model: {
          getAccessToken: function() {}
        }
      });

      let token;

      try {
        token = await handler.getTokenFromRequestQuery();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid request: do not send bearer tokens in query URLs');
      }

      should.not.exist(token);

    });

    it('should return the bearer token if `allowBearerTokensInQueryString` is true', async function() {

      const query = {
        access_token: 'foo'
      };

      const handler = new AuthenticateHandler({
        allowBearerTokensInQueryString: true,
        model: {
          getAccessToken: function() {}
        }
      });

      let token;

      try {
        token = await handler.getTokenFromRequestQuery({query: query});
      } catch (err) {
        should.fail(err.stack);
      }

      should.exist(token);
      token.should.equal(query.access_token);
    });
  });

  describe('getTokenFromRequestBody()', function() {

    it('should throw an error if the method is `GET`', async function() {

      const handler = new AuthenticateHandler({
        model: {
          getAccessToken: function() {}
        }
      });

      const request = new Request({
        body: { access_token: 'foo' },
        headers: {},
        method: 'GET',
        query: {}
      });

      let token;

      try {
        token = await handler.getTokenFromRequestBody(request);
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid request: token may not be passed in the body when using the GET verb');
      }

      should.not.exist(token);

    });

    it('should throw an error if the media type is not `application/x-www-form-urlencoded`', async function() {

      const handler = new AuthenticateHandler({
        model: {
          getAccessToken: function() {}
        }
      });

      const request = new Request({
        body: { access_token: 'foo' },
        headers: {},
        method: {},
        query: {}
      });

      let token;

      try {
        token = await handler.getTokenFromRequestBody(request);
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid request: content must be application/x-www-form-urlencoded');
      }

      should.not.exist(token);

    });

    it('should return the bearer token', async function() {

      const body = {
        access_token: 'foo'
      };

      const handler = new AuthenticateHandler({
        model: {
          getAccessToken: function() {}
        }
      });

      const request = new Request({
        body: body,
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'transfer-encoding': 'chunked'
        },
        method: {},
        query: {}
      });

      let token;

      try {
        token = await handler.getTokenFromRequestBody(request);
      } catch (err) {
        should.fail(err.stack);
      }

      should.exist(token);
      token.should.equal(body.access_token);

    });
  });

  describe('getAccessToken()', function() {

    it('should throw an error if `accessToken` is missing', function() {

      const model = {
        getAccessToken: function() {}
      };
      const handler = new AuthenticateHandler({ model: model });

      return handler.getAccessToken('foo')
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidTokenError);
          e.message.should.equal('Invalid token: access token is invalid');
        });

    });

    it('should throw an error if `accessToken.user` is missing', function() {

      const model = {
        getAccessToken: function() {
          return {};
        }
      };

      const handler = new AuthenticateHandler({ model: model });

      return handler.getAccessToken('foo')
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: `getAccessToken()` did not return a `user` object');
        });

    });

    it('should return an access token', function() {

      const accessToken = { user: {} };

      const model = {
        getAccessToken: function() {
          return accessToken;
        }
      };

      const handler = new AuthenticateHandler({ model: model });

      return handler.getAccessToken('foo')
        .then(function(data) {
          data.should.equal(accessToken);
        })
        .catch(should.fail);

    });


  });

  describe('validateAccessToken()', function() {

    it('should throw an error if `accessToken` is expired', async function() {
      const accessToken = { accessTokenExpiresAt: new Date(new Date() / 2) };
      const handler = new AuthenticateHandler({
        model: {
          getAccessToken: function() {}
        }
      });

      let valid;

      try {
        valid = await handler.validateAccessToken(accessToken);
      } catch (e) {
        e.should.be.an.instanceOf(InvalidTokenError);
        e.message.should.equal('Invalid token: access token has expired');
      }

      should.not.exist(valid);
    });

    it('should return an access token', async function() {

      const accessToken = {
        user: {},
        accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
      };

      const handler = new AuthenticateHandler({
        model: {
          getAccessToken: function() {}
        }
      });

      let token;

      try {
        token = await handler.validateAccessToken(accessToken);
      } catch (err) {
        should.fail(err.stack);
      }

      should.exist(token);
      token.should.eql(accessToken);

    });

  });

  describe('verifyScope()', function() {

    it('should throw an error if `scope` is insufficient', function() {

      const model = {
        getAccessToken: function() {},
        verifyScope: function() {
          return false;
        }
      };

      const handler = new AuthenticateHandler({ 
        addAcceptedScopesHeader: true,
        addAuthorizedScopesHeader: true,
        model: model,
        scope: 'foo'
      });

      return handler.verifyScope('foo')
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InsufficientScopeError);
          e.message.should.equal('Insufficient scope: authorized scope is insufficient');
        });

    });

    it('should validate scope', async function() {

      const scope = 'foo';

      const model = {
        getAccessToken: function() {},
        verifyScope: sinon.stub().resolves(false),
      };

      const handler = new AuthenticateHandler({ 
        addAcceptedScopesHeader: true,
        addAuthorizedScopesHeader: true,
        model: model,
        scope: scope
      });

      let valid;

      try {
        valid = await handler.verifyScope(scope);
      } catch (err) {
        err.should.be.an.instanceOf(InsufficientScopeError);
        err.message.should.equal('Insufficient scope: authorized scope is insufficient');
      }

      should.not.exist(valid);

    });


  });

  describe('updateResponse()', function() {
    it('should not set the `X-Accepted-OAuth-Scopes` header if `scope` is not specified', function() {
      const model = {
        getAccessToken: function() {},
        verifyScope: function() {}
      };

      const handler = new AuthenticateHandler({
        addAcceptedScopesHeader: true,
        addAuthorizedScopesHeader: false,
        model: model
      });

      const response = new Response({ body: {}, headers: {} });

      handler.updateResponse(response, { scope: 'foo biz' });

      response.headers.should.not.have.property('x-accepted-oauth-scopes');

    });

    it('should set the `X-Accepted-OAuth-Scopes` header if `scope` is specified', function() {
      const model = {
        getAccessToken: function() {},
        verifyScope: function() {}
      };
      const handler = new AuthenticateHandler({
        addAcceptedScopesHeader: true,
        addAuthorizedScopesHeader: false,
        model: model,
        scope: 'foo bar'
      });
      const response = new Response({ body: {}, headers: {} });

      handler.updateResponse(response, { scope: 'foo biz' });

      response.get('X-Accepted-OAuth-Scopes').should.equal('foo bar');
    });

    it('should not set the `X-Authorized-OAuth-Scopes` header if `scope` is not specified', function() {
      const model = {
        getAccessToken: function() {},
        verifyScope: function() {}
      };
      const handler = new AuthenticateHandler({
        addAcceptedScopesHeader: false,
        addAuthorizedScopesHeader: true,
        model: model
      });
      const response = new Response({ body: {}, headers: {} });

      handler.updateResponse(response, { scope: 'foo biz' });

      response.headers.should.not.have.property('x-oauth-scopes');
    });

    it('should set the `X-Authorized-OAuth-Scopes` header', function() {
      const model = {
        getAccessToken: function() {},
        verifyScope: function() {}
      };
      const handler = new AuthenticateHandler({
        addAcceptedScopesHeader: false,
        addAuthorizedScopesHeader: true,
        model: model,
        scope: 'foo bar'
      });
      const response = new Response({ body: {}, headers: {} });

      handler.updateResponse(response, { scope: 'foo biz' });

      response.get('X-OAuth-Scopes').should.equal('foo biz');
    });

  });
});

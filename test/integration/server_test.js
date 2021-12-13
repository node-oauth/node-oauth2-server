'use strict';

/**
 * Module dependencies.
 */

const InvalidArgumentError = require('../../lib/errors/invalid-argument-error');
const Promise = require('bluebird');
const Request = require('../../lib/request');
const Response = require('../../lib/response');
const Server = require('../../lib/server');
const should = require('chai').should();

/**
 * Test `Server` integration.
 */

describe('Server integration', function() {

  describe('constructor()', function() {

    it('should throw an error if `model` is missing', function() {
      try {
        new Server({});
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should set the `model`', function() {
      const model = {};
      const server = new Server({ model: model });
      server.options.model.should.equal(model);
    });

  });

  describe('authenticate()', function() {

    it('should set the default `options`', function() {

      const model = {
        getAccessToken: function() {
          return {
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
          };
        }
      };

      const server = new Server({
        model: model
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

      return server.authenticate(request, response)
        .then( function() {
          this.addAcceptedScopesHeader.should.be.true;
          this.addAuthorizedScopesHeader.should.be.true;
          this.allowBearerTokensInQueryString.should.be.false;
        })
        .catch(should.fail);
    });

  });

  describe('authorize()', function() {
    it('should set the default `options`', function() {
      const model = {
        getAccessToken: function() {
          return {
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
          };
        },
        getClient: function() {
          return { grants: ['authorization_code'], redirectUris: ['http://example.com/cb'] };
        },
        saveAuthorizationCode: function() {
          return { authorizationCode: 123 };
        }
      };
      const server = new Server({ model: model });
      const request = new Request({ body: { client_id: 1234, client_secret: 'secret', response_type: 'code' }, headers: { 'Authorization': 'Bearer foo' }, method: {}, query: { state: 'foobar' } });
      const response = new Response({ body: {}, headers: {} });

      return server.authorize(request, response)
        .then(function() {
          this.allowEmptyState.should.be.false;
          this.authorizationCodeLifetime.should.equal(300);
        })
        .catch(should.fail);
    });

    it('should return a promise', function() {
      const model = {
        getAccessToken: function() {
          return {
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
          };
        },
        getClient: function() {
          return { grants: ['authorization_code'], redirectUris: ['http://example.com/cb'] };
        },
        saveAuthorizationCode: function() {
          return { authorizationCode: 123 };
        }
      };
      const server = new Server({ model: model });
      const request = new Request({ body: { client_id: 1234, client_secret: 'secret', response_type: 'code' }, headers: { 'Authorization': 'Bearer foo' }, method: {}, query: { state: 'foobar' } });
      const response = new Response({ body: {}, headers: {} });
      const handler = server.authorize(request, response);

      handler.should.be.an.instanceOf(Promise);
    });

  });

  describe('token()', function() {
    it('should set the default `options`', function() {
      const model = {
        getClient: function() {
          return { grants: ['password'] };
        },
        getUser: function() {
          return {};
        },
        saveToken: function() {
          return { accessToken: 1234, client: {}, user: {} };
        },
        validateScope: function() { return 'foo'; }
      };
      const server = new Server({ model: model });
      const request = new Request({ body: { client_id: 1234, client_secret: 'secret', grant_type: 'password', username: 'foo', password: 'pass', scope: 'foo' }, headers: { 'content-type': 'application/x-www-form-urlencoded', 'transfer-encoding': 'chunked' }, method: 'POST', query: {} });
      const response = new Response({ body: {}, headers: {} });

      return server.token(request, response)
        .then(function() {
          this.accessTokenLifetime.should.equal(3600);
          this.refreshTokenLifetime.should.equal(1209600);
        })
        .catch(should.fail);
    });

    it('should return a promise', function() {
      const model = {
        getClient: function() {
          return { grants: ['password'] };
        },
        getUser: function() {
          return {};
        },
        saveToken: function() {
          return { accessToken: 1234, client: {}, user: {} };
        }
      };
      const server = new Server({ model: model });
      const request = new Request({ body: { client_id: 1234, client_secret: 'secret', grant_type: 'password', username: 'foo', password: 'pass' }, headers: { 'content-type': 'application/x-www-form-urlencoded', 'transfer-encoding': 'chunked' }, method: 'POST', query: {} });
      const response = new Response({ body: {}, headers: {} });
      const handler = server.token(request, response);

      handler.should.be.an.instanceOf(Promise);
    });

  });
});

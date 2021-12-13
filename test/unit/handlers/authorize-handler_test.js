'use strict';

/**
 * Module dependencies.
 */

const AuthorizeHandler = require('../../../lib/handlers/authorize-handler');
const Request = require('../../../lib/request');
const Response = require('../../../lib/response');
const sinon = require('sinon');
const should = require('chai').should();

/**
 * Test `AuthorizeHandler`.
 */

describe('AuthorizeHandler', function() {

  describe('generateAuthorizationCode()', function() {

    it('should call `model.generateAuthorizationCode()`', function() {

      const model = {
        generateAuthorizationCode: sinon.stub().resolves({}),
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };

      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model: model
      });

      return handler.generateAuthorizationCode()
        .then(function() {
          model.generateAuthorizationCode.callCount.should.equal(1);
          model.generateAuthorizationCode.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);

    });

  });

  describe('getClient()', function() {

    it('should call `model.getClient()`', function() {

      const model = {
        getAccessToken: function() {},
        getClient: sinon.stub().resolves({
          grants: ['authorization_code'],
          redirectUris: ['http://example.com/cb']
        }),
        saveAuthorizationCode: function() {}
      };

      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model: model
      });

      const request = new Request({
        body: { client_id: 12345, client_secret: 'secret' },
        headers: {},
        method: {},
        query: {},
      });

      return handler.getClient(request)
        .then(function() {
          model.getClient.callCount.should.equal(1);
          model.getClient.firstCall.args.should.have.length(2);
          model.getClient.firstCall.args[0].should.equal(12345);
          model.getClient.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);
    });
  });

  describe('getUser()', function() {

    it('should call `authenticateHandler.getUser()`', function() {

      const authenticateHandler = { 
        handle: sinon.stub().resolves({id:'1234'})
      };

      const model = {
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };

      const handler = new AuthorizeHandler({
        authenticateHandler: authenticateHandler,
        authorizationCodeLifetime: 120,
        model: model
      });

      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {}
      });

      const response = new Response();

      return handler.getUser(request, response)
        .then(function() {
          authenticateHandler.handle.callCount.should.equal(1);
          authenticateHandler.handle.firstCall.args.should.have.length(2);
          authenticateHandler.handle.firstCall.args[0].should.equal(request);
          authenticateHandler.handle.firstCall.args[1].should.equal(response);
        })
        .catch(should.fail);

    });

  });

  describe('saveAuthorizationCode()', function() {

    it('should call `model.saveAuthorizationCode()`', function() {

      const authorizationCode = 'foo';
      const expiresAt = 'bar';
      const redirectUri = 'baz';
      const scope = 'qux';
      const client = 'client';
      const user = 'user';
      
      const model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: sinon.stub().resolves({})
      };
      
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model: model
      });

      return handler.saveAuthorizationCode(authorizationCode, expiresAt, scope, client, redirectUri, user)
        .then(function() {
          model.saveAuthorizationCode.callCount.should.equal(1);
          model.saveAuthorizationCode.firstCall.args.should.have.length(3);
          model.saveAuthorizationCode.firstCall.args[0].should.eql({
            authorizationCode: authorizationCode, 
            expiresAt: expiresAt, 
            redirectUri: redirectUri, 
            scope: scope 
          });
          model.saveAuthorizationCode.firstCall.args[1].should.equal(client);
          model.saveAuthorizationCode.firstCall.args[2].should.equal(user);
          model.saveAuthorizationCode.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);

    });


  });
});

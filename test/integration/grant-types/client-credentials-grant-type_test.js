'use strict';

/**
 * Module dependencies.
 */

const ClientCredentialsGrantType = require('../../../lib/grant-types/client-credentials-grant-type');
const InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
const InvalidGrantError = require('../../../lib/errors/invalid-grant-error');
const Request = require('../../../lib/request');
const should = require('chai').should();
const sinon = require('sinon');

/**
 * Test `ClientCredentialsGrantType` integration.
 */

describe('ClientCredentialsGrantType integration', function() {
  describe('constructor()', function() {
    it('should throw an error if `model` is missing', function() {
      try {
        new ClientCredentialsGrantType();
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should throw an error if the model does not implement `getUserFromClient()`', function() {
      try {
        new ClientCredentialsGrantType({ model: {} });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `getUserFromClient()`');
      }
    });

    it('should throw an error if the model does not implement `saveToken()`', function() {
      try {
        const model = {
          getUserFromClient: function() {}
        };

        new ClientCredentialsGrantType({ model: model });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `saveToken()`');
      }
    });
  });

  describe('handle()', function() {

    it('should throw an error if `request` is missing', async function() {

      const model = {
        getUserFromClient: function() {},
        saveToken: function() {}
      };

      const grantType = new ClientCredentialsGrantType({ accessTokenLifetime: 120, model: model });

      let res;

      try {
        res = await grantType.handle();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `request`');
      }

      should.not.exist(res);

    });

    it('should throw an error if `client` is missing', async function() {

      const model = {
        getUserFromClient: function() {},
        saveToken: function() {}
      };
      const grantType = new ClientCredentialsGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      let res;

      try {
        res = await grantType.handle(request);
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `client`');
      }

      should.not.exist(res);

    });

    it('should return a token', async function() {
      const token = {};
      const model = {
        getUserFromClient: sinon.stub().returns({}),
        saveToken: sinon.stub().returns(token),
        validateScope: sinon.stub().returns('foo'),
      };
      const grantType = new ClientCredentialsGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      let res;

      try {
        res = await grantType.handle(request, {});
      } catch (e) { 
        should.not.exist(e, e.stack);
      }
      res.should.eql(token);

    });


  });

  describe('getUserFromClient()', function() {
    it('should throw an error if `user` is missing', function() {
      const model = {
        getUserFromClient: function() {},
        saveToken: function() {}
      };
      const grantType = new ClientCredentialsGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      return grantType.getUserFromClient(request, {})
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: user credentials are invalid');
        });
    });

    it('should return a user', function() {
      const user = { email: 'foo@bar.com' };
      const model = {
        getUserFromClient: sinon.stub().returns(user),
        saveToken: sinon.stub().returns({})
      };
      const grantType = new ClientCredentialsGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      return grantType.getUserFromClient(request, {})
        .then(function(data) {
          data.should.equal(user);
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      const user = { email: 'foo@bar.com' };
      const model = {
        getUserFromClient: sinon.stub().returns(user),
        saveToken: function() {}
      };
      const grantType = new ClientCredentialsGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      grantType.getUserFromClient(request, {}).should.be.an.instanceOf(Promise);
    });

  });

  describe('saveToken()', function() {

    it('should save the token', async function() {

      const token = {};

      const model = {
        getUserFromClient: sinon.stub().returns({}),
        saveToken: sinon.stub().returns(token),
        validateScope: sinon.stub().returns('foo')
      };

      const grantType = new ClientCredentialsGrantType({
        accessTokenLifetime: 123,
        model: model
      });

      let res;

      try {
        res = await grantType.saveToken(token);
      } catch (err) {
        should.fail(err);
      }

      model.validateScope.callCount.should.equal(1);
      model.saveToken.callCount.should.equal(1);
      model.saveToken.firstCall.args.should.have.length(3);
      res.should.equal(token);

    });


  });
});

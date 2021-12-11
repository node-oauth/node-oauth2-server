'use strict';

/**
 * Module dependencies.
 */

const InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
const InvalidGrantError = require('../../../lib/errors/invalid-grant-error');
const InvalidRequestError = require('../../../lib/errors/invalid-request-error');
const PasswordGrantType = require('../../../lib/grant-types/password-grant-type');
const Request = require('../../../lib/request');
const should = require('chai').should();
const sinon = require('sinon');
/**
 * Test `PasswordGrantType` integration.
 */

describe('PasswordGrantType integration', function() {

  describe('constructor()', function() {

    it('should throw an error if `model` is missing', async function() {

      let passwordGrantType;

      try {
        passwordGrantType = new PasswordGrantType();
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }

      should.not.exist(passwordGrantType);

    });

    it('should throw an error if the model does not implement `getUser()`', function() {
      try {
        new PasswordGrantType({ model: {} });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `getUser()`');
      }
    });

    it('should throw an error if the model does not implement `saveToken()`', function() {
      try {
        const model = {
          getUser: function() {}
        };

        new PasswordGrantType({ model: model });

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
        getUser: function() {},
        saveToken: function() {}
      };

      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model: model
      });

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
        getUser: function() {},
        saveToken: function() {}
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });

      let res;

      try {
        res = await grantType.handle({});
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `client`');
      }

      should.not.exist(res);
    });

    it('should return a token', function() {
      const client = { id: 'foobar' };
      const token = {};
      const model = {
        getUser: sinon.stub().resolves({}),
        saveToken: sinon.stub().resolves(token),
        validateScope: sinon.stub().resolves('baz'),
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { username: 'foo', password: 'bar', scope: 'baz' }, headers: {}, method: {}, query: {} });

      return grantType.handle(request, client)
        .then(function(data) {
          data.should.equal(token);
        })
        .catch(should.fail);
    });


  });

  describe('getUser()', function() {
    it('should throw an error if the request body does not contain `username`', async function() {

      const model = {
        getUser: sinon.stub().resolves({}),
        saveToken: sinon.stub().resolves({}),
      };

      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model: model 
      });

      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {}
      });

      let user;

      try {
        user = await grantType.getUser(request);
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `username`');
      }

      should.not.exist(user);

    });

    it('should throw an error if the request body does not contain `password`', async function() {

      const model = {
        getUser: sinon.stub().resolves({}),
        saveToken: sinon.stub().resolves({}),
      };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model: model
      });
      const request = new Request({
        body: { username: 'foo' },
        headers: {},
        method: {},
        query: {}
      });

      let user;
      try {
        user = await grantType.getUser(request);
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `password`');
      }

      should.not.exist(user);
    });

    it('should throw an error if `username` is invalid', async function() {

      const model = {
        getUser: sinon.stub().resolves({}),
        saveToken: sinon.stub().resolves({}),
      };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model: model
      });
      const request = new Request({
        body: { 
          password: 'foobar',
          username: '\r\n', 
        },
        headers: {},
        method: {},
        query: {}
      });

      let user;
      try {
        user = await grantType.getUser(request);
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `username`');
      }
      should.not.exist(user);
    });

    it('should throw an error if `password` is invalid', async function() {
      const model = {
        getUser: sinon.stub().resolves({}),
        saveToken: sinon.stub().resolves({}),
      };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model: model
      });
      const request = new Request({
        body: {
          username: 'foobar',
          password: '\r\n'
        },
        headers: {},
        method: {},
        query: {}
      });

      let user;

      try {
        user = await grantType.getUser(request);
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `password`');
      }
      should.not.exist(user);

    });

    it('should throw an error if `user` is missing', function() {
      const model = {
        getUser: function() {},
        saveToken: function() {}
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      return grantType.getUser(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: user credentials are invalid');
        });
    });

    it('should return a user', function() {
      const user = { email: 'foo@bar.com' };
      const model = {
        getUser: function() { return user; },
        saveToken: function() {}
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      return grantType.getUser(request)
        .then(function(data) {
          data.should.equal(user);
        })
        .catch(should.fail);
    });


  });

  describe('saveToken()', function() {

    it('should save the token', async function() {

      const token = {};

      const model = {
        getUser: sinon.stub().resolves({}),
        saveToken: sinon.stub().resolves(token),
        validateScope: sinon.stub().resolves('foo'),
      };

      const grantType = new PasswordGrantType({ 
        accessTokenLifetime: 123,
        model: model
      });

      let res;

      try {
        res = await grantType.saveToken(token);
      } catch (err) {
        should.fail(err);
      }
      should.exist(res);
      res.should.equal(token);

    });


  });
});

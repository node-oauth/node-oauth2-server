'use strict';

/**
 * Module dependencies.
 */

const InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
const InvalidGrantError = require('../../../lib/errors/invalid-grant-error');
const InvalidRequestError = require('../../../lib/errors/invalid-request-error');
const RefreshTokenGrantType = require('../../../lib/grant-types/refresh-token-grant-type');
const Request = require('../../../lib/request');
const ServerError = require('../../../lib/errors/server-error');
const should = require('chai').should();
const sinon = require('sinon');
/**
 * Test `RefreshTokenGrantType` integration.
 */

describe('RefreshTokenGrantType integration', function() {

  describe('constructor()', function() {

    it('should throw an error if `model` is missing', function() {

      let refreshTokenGrantType;

      try {
        refreshTokenGrantType = new RefreshTokenGrantType();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }

      should.not.exist(refreshTokenGrantType);

    });

    it('should throw an error if the model does not implement `getRefreshToken()`', function() {

      let refreshTokenGrantType;

      try {
        refreshTokenGrantType = new RefreshTokenGrantType({ model: {} });
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `getRefreshToken()`');
      }
      should.not.exist(refreshTokenGrantType);

    });

    it('should throw an error if the model does not implement `revokeToken()`', function() {
      
      let refreshTokenGrantType;

      try {
        refreshTokenGrantType = new RefreshTokenGrantType({
          model: {
            getRefreshToken: function() {}
          } 
        });
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `revokeToken()`');
      }
      should.not.exist(refreshTokenGrantType);
    });

    it('should throw an error if the model does not implement `saveToken()`', function() {

      let refreshTokenGrantType;

      try {
        refreshTokenGrantType = new RefreshTokenGrantType({ 
          model: {
            getRefreshToken: function() {},
            revokeToken: function() {}
          }
        });
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `saveToken()`');
      }

      should.not.exist(refreshTokenGrantType);

    });
  });

  describe('handle()', function() {

    it('should throw an error if `request` is missing', async function() {

      const model = {
        getRefreshToken: function() {},
        revokeToken: function() {},
        saveToken: function() {}
      };

      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model });

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
        getRefreshToken: function() {},
        revokeToken: function() {},
        saveToken: function() {}
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model });
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

    it('should return a token', function() {

      const client = { id: 123 };
      const token = { accessToken: 'foo', client: { id: 123 }, user: {} };
      const model = {
        getRefreshToken: function() { return token; },
        revokeToken: function() { return { accessToken: 'foo', client: { id: 123 }, refreshTokenExpiresAt: new Date(new Date() / 2), user: {} }; },
        saveToken: function() { return token; }
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { refresh_token: 'foobar' }, headers: {}, method: {}, query: {} });

      return grantType.handle(request, client)
        .then(function(data) {
          data.should.equal(token);
        })
        .catch(should.fail);
    });

  });

  describe('getRefreshToken()', function() {

    it('should throw an error if the `refreshToken` parameter is missing from the request body', async function() {

      const client = {};
      const model = {
        getRefreshToken: sinon.stub().resolves({}),
        revokeToken: sinon.stub().resolves({}),
        saveToken: sinon.stub().resolves({})
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model: model
      });
      
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {}
      });

      let res;

      try {
        res = await grantType.getRefreshToken(request, client);
      } catch (err) {
        err.should.be.an.instanceOf(InvalidRequestError);
        err.message.should.equal('Missing parameter: `refresh_token`');
      }

      should.not.exist(res);

    });

    it('should throw an error if `refreshToken` is not found', async function() {

      const client = { id: 123 };
      const model = {
        getRefreshToken: sinon.stub().resolves(null),
        revokeToken: sinon.stub().resolves({}),
        saveToken: sinon.stub().resolves({})
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: { refresh_token: '12345' }, headers: {}, method: {}, query: {} });

      let res;

      try {
        res = await grantType.getRefreshToken(request, client);
      } catch (err) {
        err.should.be.an.instanceOf(InvalidGrantError);
        err.message.should.equal('Invalid grant: refresh token is invalid');
      }

      should.not.exist(res);

    });

    it('should throw an error if `refreshToken.client` is missing', function() {
      const client = {};
      const model = {
        getRefreshToken: function() { return {}; },
        revokeToken: function() {},
        saveToken: function() {}
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: { refresh_token: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getRefreshToken(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: `getRefreshToken()` did not return a `client` object');
        });
    });

    it('should throw an error if `refreshToken.user` is missing', function() {
      const client = {};
      const model = {
        getRefreshToken: function() {
          return { accessToken: 'foo', client: {} };
        },
        revokeToken: function() {},
        saveToken: function() {}
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: { refresh_token: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getRefreshToken(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: `getRefreshToken()` did not return a `user` object');
        });
    });

    it('should throw an error if the client id does not match', function() {
      const client = { id: 123 };
      const model = {
        getRefreshToken: function() {
          return { accessToken: 'foo', client: { id: 456 }, user: {} };
        },
        revokeToken: function() {},
        saveToken: function() {}
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: { refresh_token: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getRefreshToken(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: refresh token is invalid');
        });
    });

    it('should throw an error if `refresh_token` contains invalid characters', async function() {
      const client = {};
      const model = {
        getRefreshToken: function() {
          return { client: { id: 456 }, user: {} };
        },
        revokeToken: function() {},
        saveToken: function() {}
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: { refresh_token: 'øå€£‰' }, headers: {}, method: {}, query: {} });

      let token;

      try {
        token  = await grantType.getRefreshToken(request, client);
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `refresh_token`');
      }

      should.not.exist(token);

    });

    it('should throw an error if `refresh_token` is missing', function() {
      const client = {};
      const model = {
        getRefreshToken: function() {
          return { accessToken: 'foo', client: { id: 456 }, user: {} };
        },
        revokeToken: function() {},
        saveToken: function() {}
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: { refresh_token: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getRefreshToken(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: refresh token is invalid');
        });
    });

    it('should throw an error if `refresh_token` is expired', function() {
      const client = { id: 123 };
      const date = new Date(new Date() / 2);
      const model = {
        getRefreshToken: function() {
          return { accessToken: 'foo', client: { id: 123 }, refreshTokenExpiresAt: date, user: {} };
        },
        revokeToken: function() {},
        saveToken: function() {}
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: { refresh_token: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getRefreshToken(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: refresh token has expired');
        });
    });

    it('should throw an error if `refreshTokenExpiresAt` is not a date value', function() {
      const client = { id: 123 };
      const model = {
        getRefreshToken: function() {
          return { accessToken: 'foo', client: { id: 123 }, refreshTokenExpiresAt: 'stringvalue', user: {} };
        },
        revokeToken: function() {},
        saveToken: function() {}
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: { refresh_token: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getRefreshToken(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: `refreshTokenExpiresAt` must be a Date instance');
        });
    });

    it('should return a token', function() {
      const client = { id: 123 };
      const token = { accessToken: 'foo', client: { id: 123 }, user: {} };
      const model = {
        getRefreshToken: function() { return token; },
        revokeToken: function() {},
        saveToken: function() {}
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { refresh_token: 'foobar' }, headers: {}, method: {}, query: {} });

      return grantType.getRefreshToken(request, client)
        .then(function(data) {
          data.should.equal(token);
        })
        .catch(should.fail);
    });

  });

  describe('revokeToken()', function() {

    it('should throw an error if the `token` is invalid', async function() {
      const model = {
        getRefreshToken: function() {},
        revokeToken: function() {},
        saveToken: function() {}
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model });
      
      let res;

      try {
        res = await grantType.revokeToken({});
      } catch (err) {
        err.should.be.an.instanceOf(InvalidGrantError);
        err.message.should.equal('Invalid grant: refresh token is invalid');
      }

      should.not.exist(res);
      

    });

    it('should revoke the token', async function() {
      const token = { accessToken: 'foo', client: {}, refreshTokenExpiresAt: new Date(new Date() / 2), user: {} };
      const model = {
        getRefreshToken: function() {},
        revokeToken: function() { return token; },
        saveToken: function() {}
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model: model });
      
      let res;

      try {
        res = await grantType.revokeToken(token);
      } catch (err) {
        should.fail(err);
      }
      
      res.should.equal(token);

    });

  });

  describe('saveToken()', function() {

    it('should save the token', async function() {
      const token = {};
      const model = {
        getRefreshToken: function() {},
        revokeToken: function() {},
        saveToken: function() { return token; }
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model: model });
      
      let res;

      try {
        res = await grantType.saveToken(token);
      } catch (err) {
        should.fail(err);
      }

      res.should.equal(token);

    });

  });

});

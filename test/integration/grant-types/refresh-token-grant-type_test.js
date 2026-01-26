'use strict';

/**
 * Module dependencies.
 */

const InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
const InvalidGrantError = require('../../../lib/errors/invalid-grant-error');
const InvalidRequestError = require('../../../lib/errors/invalid-request-error');
const RefreshTokenGrantType = require('../../../lib/grant-types/refresh-token-grant-type');
const Model = require('../../../lib/model');
const Request = require('../../../lib/request');
const ServerError = require('../../../lib/errors/server-error');
const should = require('chai').should();

/**
 * Test `RefreshTokenGrantType` integration.
 */

describe('RefreshTokenGrantType integration', function() {
  describe('constructor()', function() {
    it('should throw an error if `model` is missing', function() {
      try {
        new RefreshTokenGrantType();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should throw an error if the model does not implement `getRefreshToken()`', function() {
      try {
        new RefreshTokenGrantType({ model: {} });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `getRefreshToken()`');
      }
    });

    it('should throw an error if the model does not implement `revokeToken()`', function() {
      try {
        const model = Model.from({
          getRefreshToken: () => should.fail()
        });

        new RefreshTokenGrantType({ model });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `revokeToken()`');
      }
    });

    it('should throw an error if the model does not implement `saveToken()`', function() {
      try {
        const model = Model.from({
          getRefreshToken: () => should.fail(),
          revokeToken: () => should.fail()
        });

        new RefreshTokenGrantType({ model });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `saveToken()`');
      }
    });
  });

  describe('handle()', function() {
    it('should throw an error if `request` is missing', async function() {
      const model = Model.from({
        getRefreshToken: () => should.fail(),
        revokeToken: () => should.fail(),
        saveToken: () => should.fail()
      });
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model });

      try {
        await grantType.handle();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `request`');
      }
    });

    it('should throw an error if `client` is missing', async function() {
      const model = Model.from({
        getRefreshToken: () => should.fail(),
        revokeToken: () => should.fail(),
        saveToken: () => should.fail()
      });
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model });
      const request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      try {
        await grantType.handle(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `client`');
      }
    });

    it('should return a token', async function() {
      const client = { id: '123' };
      const token = {
        accessToken: 'foo',
        client: { id: '123' },
        user: { name: 'foo' },
        scope: ['read', 'write'],
        refreshTokenExpiresAt: new Date( new Date() * 2)
      };
      const model = Model.from({
        getRefreshToken: async function(_refreshToken) {
          _refreshToken.should.equal('foobar_refresh');
          return token;
        },
        revokeToken: async function(_token) {
          _token.should.deep.equal(token);
          return true;
        },
        generateAccessToken: async function (_client, _user, _scope) {
          _user.should.deep.equal({ name: 'foo' });
          _client.should.deep.equal({ id: '123' });
          _scope.should.eql(['read', 'write']);
          return 'new-access-token';
        },
        generateRefreshToken: async function (_client, _user, _scope) {
          _user.should.deep.equal({ name: 'foo' });
          _client.should.deep.equal({ id: '123' });
          _scope.should.eql(['read', 'write']);
          return 'new-refresh-token';
        },
        saveToken: async function(_token, _client, _user) {
          _user.should.deep.equal({ name: 'foo' });
          _client.should.deep.equal({ id: '123' });
          _token.accessToken.should.equal('new-access-token');
          _token.refreshToken.should.equal('new-refresh-token');
          _token.accessTokenExpiresAt.should.be.instanceOf(Date);
          _token.refreshTokenExpiresAt.should.be.instanceOf(Date);
          return token;
        }
      });

      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model });
      const request = new Request({ body: { refresh_token: 'foobar_refresh' }, headers: {}, method: {}, query: {} });
      const data = await grantType.handle(request, client);
      data.should.equal(token);
    });

    it('should support promises', function() {
      const client = { id: '123' };
      const model = Model.from({
        getRefreshToken: async function() { return { accessToken: 'foo', client: { id: '123' }, user: {} }; },
        revokeToken: async function() { return { accessToken: 'foo', client: {}, refreshTokenExpiresAt: new Date(new Date() / 2), user: {} }; },
        saveToken: async function() { return { accessToken: 'foo', client: {}, user: {} }; }
      });
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model });
      const request = new Request({ body: { refresh_token: 'foobar' }, headers: {}, method: {}, query: {} });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      const client = { id: '123' };
      const model = Model.from({
        getRefreshToken: async function() { return { accessToken: 'foo', client: { id: '123' }, user: {} }; },
        revokeToken: async function() { return { accessToken: 'foo', client: {}, refreshTokenExpiresAt: new Date(new Date() / 2), user: {} }; },
        saveToken: async function() { return { accessToken: 'foo', client: {}, user: {} }; }
      });
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model });
      const request = new Request({ body: { refresh_token: 'foobar' }, headers: {}, method: {}, query: {} });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });
  });

  describe('getRefreshToken()', function() {
    it('should throw an error if the `refreshToken` parameter is missing from the request body', async function() {
      const client = {};
      const model = Model.from({
        getRefreshToken: () => should.fail(),
        revokeToken: () => should.fail(),
        saveToken: () => should.fail()
      });
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model });
      const request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      try {
        await grantType.getRefreshToken(request, client);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `refresh_token`');
      }
    });

    it('should throw an error if `refreshToken` is not found', async function() {
      const client = { id: '123' };
      const model = Model.from({
        getRefreshToken: async function() {} ,
        revokeToken: () => should.fail(),
        saveToken: () => should.fail()
      });
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model });
      const request = new Request({ body: { refresh_token: '12345' }, headers: {}, method: {}, query: {} });

      try {
        await grantType.getRefreshToken(request, client);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidGrantError);
        e.message.should.equal('Invalid grant: refresh token is invalid');
      }
    });

    it('should throw an error if `refreshToken.client` is missing', async function() {
      const client = {};
      const model = Model.from({
        getRefreshToken: async function() { return {}; },
        revokeToken: () => should.fail(),
        saveToken: () => should.fail()
      });
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model });
      const request = new Request({ body: { refresh_token: '12345' }, headers: {}, method: {}, query: {} });

      try {
        await grantType.getRefreshToken(request, client);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(ServerError);
        e.message.should.equal('Server error: `getRefreshToken()` did not return a `client` object');
      }
    });

    it('should throw an error if `refreshToken.user` is missing', async function() {
      const client = {};
      const model = Model.from({
        getRefreshToken: async function() {
          return { accessToken: 'foo', client: {} };
        },
        revokeToken: () => should.fail(),
        saveToken: () => should.fail()
      });
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model });
      const request = new Request({ body: { refresh_token: '12345' }, headers: {}, method: {}, query: {} });

      try {
        await grantType.getRefreshToken(request, client);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(ServerError);
        e.message.should.equal('Server error: `getRefreshToken()` did not return a `user` object');
      }
    });

    it('should throw an error if the client id does not match', async function() {
      const client = { id: '123' };
      const model = Model.from({
        getRefreshToken: async function() {
          return { accessToken: 'foo', client: { id: '456' }, user: {} };
        },
        revokeToken: () => should.fail(),
        saveToken: () => should.fail()
      });
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model });
      const request = new Request({ body: { refresh_token: '12345' }, headers: {}, method: {}, query: {} });

      try {
        await grantType.getRefreshToken(request, client);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidGrantError);
        e.message.should.equal('Invalid grant: refresh token was issued to another client');
      }
    });

    it('should throw an error if `refresh_token` contains invalid characters', async function() {
      const client = {};
      const model = Model.from({
        getRefreshToken: async function() {
          return { client: { id: '456' }, user: {} };
        },
        revokeToken: () => should.fail(),
        saveToken: () => should.fail()
      });
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model });
      const request = new Request({ body: { refresh_token: 'øå€£‰' }, headers: {}, method: {}, query: {} });

      try {
        await grantType.getRefreshToken(request, client);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `refresh_token`');
      }
    });

    it('should throw an error if `refresh_token` is missing', async function() {
      const client = {};
      const model = Model.from({
        getRefreshToken: async function() {
          return { accessToken: 'foo', client: { id: '456' }, user: {} };
        },
        revokeToken: () => should.fail(),
        saveToken: () => should.fail()
      });
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model });
      const request = new Request({ body: { refresh_token: '12345' }, headers: {}, method: {}, query: {} });

      try {
        await grantType.getRefreshToken(request, client);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidGrantError);
        e.message.should.equal('Invalid grant: refresh token was issued to another client');
      }
    });

    it('should throw an error if `refresh_token` is expired', async function() {
      const client = { id: '123' };
      const date = new Date(new Date() / 2);
      const model = Model.from({
        getRefreshToken: async function() {
          return { accessToken: 'foo', client: { id: '123' }, refreshTokenExpiresAt: date, user: {} };
        },
        revokeToken: () => should.fail(),
        saveToken: () => should.fail()
      });
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model });
      const request = new Request({ body: { refresh_token: '12345' }, headers: {}, method: {}, query: {} });

      try {
        await grantType.getRefreshToken(request, client);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidGrantError);
        e.message.should.equal('Invalid grant: refresh token has expired');
      }
    });

    it('should throw an error if `refreshTokenExpiresAt` is not a date value', async function() {
      const client = { id: '123' };
      const model = Model.from({
        getRefreshToken: async function() {
          return { accessToken: 'foo', client: { id: '123' }, refreshTokenExpiresAt: 'stringvalue', user: {} };
        },
        revokeToken: () => should.fail(),
        saveToken: () => should.fail()
      });
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model });
      const request = new Request({ body: { refresh_token: '12345' }, headers: {}, method: {}, query: {} });

      try {
        await grantType.getRefreshToken(request, client);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(ServerError);
        e.message.should.equal('Server error: `refreshTokenExpiresAt` must be a Date instance');
      }
    });

    it('should return a token', async function() {
      const client = { id: '123' };
      const token = { accessToken: 'foo', client: { id: '123' }, user: { name: 'foobar' } };
      const model = Model.from({
        getRefreshToken: async function(_refreshToken) {
          _refreshToken.should.equal('foobar_refresh');
          return token;
        },
        revokeToken: async function(_token) {
          _token.should.deep.equal(token);
          return true;
        },
        saveToken: async function(_token, _client, _user) {
          _user.should.deep.equal(token.user);
          _client.should.deep.equal(client);
          _token.accessToken.should.be.a.sha256();
          _token.refreshToken.should.be.a.sha256();
          _token.accessTokenExpiresAt.should.be.instanceOf(Date);
          _token.refreshTokenExpiresAt.should.be.instanceOf(Date);
          return token;
        }
      });
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model });
      const request = new Request({ body: { refresh_token: 'foobar_refresh' }, headers: {}, method: {}, query: {} });

      const data = await grantType.getRefreshToken(request, client);
      data.should.equal(token);
    });

    it('should support promises', function() {
      const client = { id: '123' };
      const token = { accessToken: 'foo', client: { id: '123' }, user: {} };
      const model = Model.from({
        getRefreshToken: async function() { return token; },
        revokeToken: async function() {},
        saveToken: async function() {}
      });
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model });
      const request = new Request({ body: { refresh_token: 'foobar' }, headers: {}, method: {}, query: {} });

      grantType.getRefreshToken(request, client).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      const client = { id: '123' };
      const token = { accessToken: 'foo', client: { id: '123' }, user: {} };
      const model = Model.from({
        getRefreshToken: async function() { return token; },
        revokeToken: async function() {},
        saveToken: async function() {}
      });
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model });
      const request = new Request({ body: { refresh_token: 'foobar' }, headers: {}, method: {}, query: {} });

      grantType.getRefreshToken(request, client).should.be.an.instanceOf(Promise);
    });
  });

  describe('revokeToken()', function() {
    it('should throw an error if the `token` is invalid', async function() {
      const model = Model.from({
        getRefreshToken: () => should.fail(),
        revokeToken: async () => {},
        saveToken: () => should.fail()
      });
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model });

      try {
        await grantType.revokeToken({});
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidGrantError);
        e.message.should.equal('Invalid grant: refresh token is invalid or could not be revoked');
      }
    });

    it('should revoke the token', async function() {
      const token = { accessToken: 'foo', client: {}, refreshTokenExpiresAt: new Date(new Date() / 2), user: {} };
      const model = Model.from({
        getRefreshToken: () => should.fail(),
        revokeToken: async function(_token) {
          _token.should.deep.equal(token);
          return token;
        },
        saveToken: () => should.fail()
      });
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model });

      const data = await grantType.revokeToken(token);
      data.should.equal(token);
    });

    it('should support promises', function() {
      const token = { accessToken: 'foo', client: {}, refreshTokenExpiresAt: new Date(new Date() / 2), user: {} };
      const model = Model.from({
        getRefreshToken: () => should.fail(),
        revokeToken: async function() { return token; },
        saveToken: () => should.fail()
      });
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model });

      grantType.revokeToken(token).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      const token = { accessToken: 'foo', client: {}, refreshTokenExpiresAt: new Date(new Date() / 2), user: {} };
      const model = Model.from({
        getRefreshToken: () => should.fail(),
        revokeToken: function() { return token; },
        saveToken: () => should.fail()
      });
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model });

      grantType.revokeToken(token).should.be.an.instanceOf(Promise);
    });
  });

  describe('saveToken()', function() {
    it('should save the token', async function() {
      const user = { name: 'foo' };
      const client = { id: '123465' };
      const scope = ['foo', 'bar'];
      const model = Model.from({
        getRefreshToken: () => should.fail(),
        revokeToken: () => should.fail(),
        saveToken: async function(_token, _client, _user) {
          _user.should.deep.equal(user);
          _client.should.deep.equal(client);
          _token.scope.should.deep.eql(scope);
          _token.accessToken.should.be.a.sha256();
          _token.refreshToken.should.be.a.sha256();
          _token.accessTokenExpiresAt.should.be.instanceOf(Date);
          _token.refreshTokenExpiresAt.should.be.instanceOf(Date);
          return { ..._token };
        }
      });
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model });

      const data = await grantType.saveToken(user, client, scope);
      data.accessToken.should.be.a.sha256();
      data.refreshToken.should.be.a.sha256();
      data.accessTokenExpiresAt.should.be.instanceOf(Date);
      data.refreshTokenExpiresAt.should.be.instanceOf(Date);
      data.scope.should.deep.equal(scope);
    });

    it('should support promises', function() {
      const token = {};
      const model = Model.from({
        getRefreshToken: () => should.fail(),
        revokeToken: () => should.fail(),
        saveToken: async function() { return token; }
      });
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      const token = {};
      const model = Model.from({
        getRefreshToken: () => should.fail(),
        revokeToken: () => should.fail(),
        saveToken: function() { return token; }
      });
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });
  });
});

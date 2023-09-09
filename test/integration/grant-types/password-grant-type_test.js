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

/**
 * Test `PasswordGrantType` integration.
 */

describe('PasswordGrantType integration', function() {
  describe('constructor()', function() {
    it('should throw an error if `model` is missing', function() {
      try {
        new PasswordGrantType();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
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

        new PasswordGrantType({ model });

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
        getUser: () => should.fail(),
        saveToken: () => should.fail()
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model });

      try {
        await grantType.handle();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `request`');
      }
    });

    it('should throw an error if `client` is missing', async function() {
      const model = {
        getUser: () => should.fail(),
        saveToken: () => should.fail()
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model });

      try {
        await grantType.handle({});

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `client`');
      }
    });

    it('should return a token', async function() {
      const client = { id: 'foobar' };
      const scope = ['baz'];
      const token = {};
      const user = {
        id: 123456,
        username: 'foo',
        email: 'foo@example.com'
      };

      const model = {
        getUser: async function(username, password) {
          username.should.equal('foo');
          password.should.equal('bar');
          return user;
        },
        validateScope: async function(_user, _client, _scope) {
          _client.should.equal(client);
          _user.should.equal(user);
          _scope.should.eql(scope);
          return scope;
        },
        generateAccessToken: async function (_client, _user, _scope) {
          _client.should.equal(client);
          _user.should.equal(user);
          _scope.should.eql(scope);
          return 'long-access-token-hash';
        },
        generateRefreshToken: async function (_client, _user, _scope) {
          _client.should.equal(client);
          _user.should.equal(user);
          _scope.should.eql(scope);
          return 'long-refresh-token-hash';
        },
        saveToken: async function(_token, _client, _user) {
          _client.should.equal(client);
          _user.should.equal(user);
          _token.accessToken.should.equal('long-access-token-hash');
          _token.refreshToken.should.equal('long-refresh-token-hash');
          _token.accessTokenExpiresAt.should.be.instanceOf(Date);
          _token.refreshTokenExpiresAt.should.be.instanceOf(Date);
          return token;
        }
      };

      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model });
      const request = new Request({ body: { username: 'foo', password: 'bar', scope: 'baz' }, headers: {}, method: {}, query: {} });

      const data = await grantType.handle(request, client);
      data.should.equal(token);
    });

    it('should support promises', async function() {
      const client = { id: 'foobar' };
      const token = {};
      const model = {
        getUser: async function() { return {}; },
        saveToken: async function() { return token; }
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model });
      const request = new Request({ body: { username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      const result = await grantType.handle(request, client);
      result.should.deep.equal({});
    });

    it('should support non-promises', async function() {
      const client = { id: 'foobar' };
      const token = {};
      const model = {
        getUser: function() { return {}; },
        saveToken: function() { return token; }
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model });
      const request = new Request({ body: { username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      const result = await grantType.handle(request, client);
      result.should.deep.equal({});
    });
  });

  describe('getUser()', function() {
    it('should throw an error if the request body does not contain `username`', async function() {
      const model = {
        getUser: () => should.fail(),
        saveToken: () => should.fail()
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model });
      const request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      try {
        await grantType.getUser(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `username`');
      }
    });

    it('should throw an error if the request body does not contain `password`', async function() {
      const model = {
        getUser: () => should.fail(),
        saveToken: () => should.fail()
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model });
      const request = new Request({ body: { username: 'foo' }, headers: {}, method: {}, query: {} });

      try {
        await grantType.getUser(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `password`');
      }
    });

    it('should throw an error if `username` is invalid', async function() {
      const model = {
        getUser: () => should.fail(),
        saveToken: () => should.fail()
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model });
      const request = new Request({ body: { username: '\r\n', password: 'foobar' }, headers: {}, method: {}, query: {} });

      try {
        await grantType.getUser(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `username`');
      }
    });

    it('should throw an error if `password` is invalid', async function() {
      const model = {
        getUser: () => should.fail(),
        saveToken: () => should.fail()
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model });
      const request = new Request({ body: { username: 'foobar', password: '\r\n' }, headers: {}, method: {}, query: {} });

      try {
        await grantType.getUser(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `password`');
      }
    });

    it('should throw an error if `user` is missing', async function() {
      const model = {
        getUser: async () => undefined,
        saveToken: () => should.fail()
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model });
      const request = new Request({ body: { username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      try {
        await grantType.getUser(request);
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidGrantError);
        e.message.should.equal('Invalid grant: user credentials are invalid');
      }
    });

    it('should return a user', async function() {
      const user = { email: 'foo@bar.com' };
      const model = {
        getUser: function(username, password) {
          username.should.equal('foo');
          password.should.equal('bar');
          return user;
        },
        saveToken: () => should.fail()
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model });
      const request = new Request({ body: { username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      const data = await grantType.getUser(request);
      data.should.equal(user);
    });

    it('should support promises', function() {
      const user = { email: 'foo@bar.com' };
      const model = {
        getUser: async function() { return user; },
        saveToken: () => should.fail()
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model });
      const request = new Request({ body: { username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      grantType.getUser(request).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      const user = { email: 'foo@bar.com' };
      const model = {
        getUser: function() { return user; },
        saveToken: () => should.fail()
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model });
      const request = new Request({ body: { username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      grantType.getUser(request).should.be.an.instanceOf(Promise);
    });
  });

  describe('saveToken()', function() {
    it('should save the token', async function() {
      const token = {};
      const model = {
        getUser: () => should.fail(),
        saveToken: async function(_token, _client = 'fallback', _user = 'fallback') {
          _token.accessToken.should.be.a.sha256();
          _token.accessTokenExpiresAt.should.be.instanceOf(Date);
          _token.refreshTokenExpiresAt.should.be.instanceOf(Date);
          _token.refreshToken.should.be.a.sha256();
          _token.scope.should.eql(['foo']);
          _client.should.equal('fallback');
          _user.should.equal('fallback');
          return token;
        },
        validateScope: async function(_scope = ['fallback']) {
          _scope.should.eql(['fallback']);
          return ['foo'];
        }
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model });

      const data = await grantType.saveToken();
      data.should.equal(token);
    });

    it('should support promises', function() {
      const token = {};
      const model = {
        getUser: () => should.fail(),
        saveToken: async function() { return token; }
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      const token = {};
      const model = {
        getUser: () => should.fail(),
        saveToken: function() { return token; }
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });
  });
});

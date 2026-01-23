'use strict';

/**
 * Module dependencies.
 */

const AuthorizationCodeGrantType = require('../../../lib/grant-types/authorization-code-grant-type');
const InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
const InvalidGrantError = require('../../../lib/errors/invalid-grant-error');
const InvalidRequestError = require('../../../lib/errors/invalid-request-error');
const Model = require('../../../lib/model');
const Request = require('../../../lib/request');
const ServerError = require('../../../lib/errors/server-error');
const should = require('chai').should();

/**
 * Test `AuthorizationCodeGrantType` integration.
 */

describe('AuthorizationCodeGrantType integration', function() {
  describe('constructor()', function() {
    it('should throw an error if `model` is missing', function() {
      try {
        new AuthorizationCodeGrantType();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should throw an error if the model does not implement `getAuthorizationCode()`', function() {
      try {
        new AuthorizationCodeGrantType({ model: {} });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `getAuthorizationCode()`');
      }
    });

    it('should throw an error if the model does not implement `revokeAuthorizationCode()`', function() {
      try {
        const model = Model.from({
          getAuthorizationCode: function() {}
        });

        new AuthorizationCodeGrantType({ model: model });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `revokeAuthorizationCode()`');
      }
    });

    it('should throw an error if the model does not implement `saveToken()`', function() {
      try {
        const model = Model.from({
          getAuthorizationCode: function() {},
          revokeAuthorizationCode: function() {}
        });

        new AuthorizationCodeGrantType({ model: model });

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
        getAuthorizationCode: () => should.fail(),
        revokeAuthorizationCode: () => should.fail(),
        saveToken: () => should.fail()
      });
      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });

      try {
        await grantType.handle();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `request`');
      }
    });

    it('should throw an error if `client` is invalid (not in code)', async function() {
      const client = { id: 1234 };
      const model = Model.from({
        getAuthorizationCode: function(code) {
          code.should.equal(123456789);
          return { authorizationCode: 12345, expiresAt: new Date(new Date() * 2), user: {} };
        },
        revokeAuthorizationCode: () => should.fail(),
        saveToken: () => should.fail()
      });
      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { code: 123456789 }, headers: {}, method: {}, query: {} });

      try {
        await grantType.handle(request, client);
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(ServerError);
        e.message.should.equal('Server error: `getAuthorizationCode()` did not return a `client` object');
      }
    });

    it('should throw an error if `client` is missing', function() {
      const model = Model.from({
        getAuthorizationCode: () => should.fail(),
        revokeAuthorizationCode: () => should.fail(),
        saveToken: () => should.fail()
      });
      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      try {
        grantType.handle(request, null);
      }
      catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `client`');
      }
    });

    it('should return a token', async function() {
      const client = { id: 'foobar' };
      const scope = ['fooscope'];
      const user = { name: 'foouser' };
      const codeDoc = {
        authorizationCode: 12345,
        expiresAt: new Date(new Date() * 2),
        client,
        user,
        scope
      };
      const model = Model.from({
        getAuthorizationCode: async function (code) {
          code.should.equal('code-1234');

          return codeDoc;
        },
        revokeAuthorizationCode: async function (_codeDoc) {
          _codeDoc.should.deep.equal(codeDoc);
          return true;
        },
        validateScope: async function (_user, _client, _scope) {
          _user.should.deep.equal(user);
          _client.should.deep.equal(client);
          _scope.should.eql(scope);
          return scope;
        },
        generateAccessToken: async function (_client, _user, _scope) {
          _user.should.deep.equal(user);
          _client.should.deep.equal(client);
          _scope.should.eql(scope);
          return 'long-access-token-hash';
        },
        generateRefreshToken: async function (_client, _user, _scope) {
          _user.should.deep.equal(user);
          _client.should.deep.equal(client);
          _scope.should.eql(scope);
          return 'long-refresh-token-hash';
        },
        saveToken: async function (_token, _client, _user) {
          _user.should.deep.equal(user);
          _client.should.deep.equal(client);
          _token.accessToken.should.equal('long-access-token-hash');
          _token.refreshToken.should.equal('long-refresh-token-hash');
          _token.authorizationCode.should.equal(codeDoc.authorizationCode);
          _token.accessTokenExpiresAt.should.be.instanceOf(Date);
          _token.refreshTokenExpiresAt.should.be.instanceOf(Date);
          return _token;
        },
      });

      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { code: 'code-1234' }, headers: {}, method: {}, query: {} });

      const token = await grantType.handle(request, client);
      token.accessToken.should.equal('long-access-token-hash');
      token.refreshToken.should.equal('long-refresh-token-hash');
      token.authorizationCode.should.equal(codeDoc.authorizationCode);
      token.accessTokenExpiresAt.should.be.instanceOf(Date);
      token.refreshTokenExpiresAt.should.be.instanceOf(Date);
    });

    it('should support promises', function() {
      const client = { id: 'foobar' };
      const model = Model.from({
        getAuthorizationCode: function() { return { authorizationCode: 12345, client: { id: 'foobar' }, expiresAt: new Date(new Date() * 2), user: {} }; },
        revokeAuthorizationCode: function() { return true; },
        saveToken: function() {}
      });
      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      const client = { id: 'foobar' };
      const model = Model.from({
        getAuthorizationCode: function() { return { authorizationCode: 12345, client: { id: 'foobar' }, expiresAt: new Date(new Date() * 2), user: {} }; },
        revokeAuthorizationCode: function() { return true; },
        saveToken: function() {}
      });
      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });
  });

  describe('getAuthorizationCode()', function() {
    it('should throw an error if the request body does not contain `code`', async function() {
      const client = {};
      const model = Model.from({
        getAuthorizationCode: () => should.fail(),
        revokeAuthorizationCode: () => should.fail(),
        saveToken: () => should.fail()
      });
      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      try {
        await grantType.getAuthorizationCode(request, client);
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `code`');
      }
    });

    it('should throw an error if `code` is invalid', async function() {
      const client = {};
      const model = Model.from({
        getAuthorizationCode: () => should.fail(),
        revokeAuthorizationCode: () => should.fail(),
        saveToken: () => should.fail()
      });
      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { code: 'øå€£‰' }, headers: {}, method: {}, query: {} });

      try {
        await grantType.getAuthorizationCode(request, client);
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `code`');
      }
    });

    it('should throw an error if `authorizationCode` is missing', async function() {
      const client = {};
      const model = Model.from({
        getAuthorizationCode: async function() {},
        revokeAuthorizationCode: () => should.fail(),
        saveToken: () => should.fail()
      });
      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      try {
        await grantType.getAuthorizationCode(request, client);
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidGrantError);
        e.message.should.equal('Invalid grant: authorization code is invalid');
      }
    });

    it('should throw an error if `authorizationCode.client` is missing', async function() {
      const client = {};
      const model = Model.from({
        getAuthorizationCode: async function() { return { authorizationCode: 12345 }; },
        revokeAuthorizationCode: () => should.fail(),
        saveToken: () => should.fail()
      });
      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      try {
        await grantType.getAuthorizationCode(request, client);
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(ServerError);
        e.message.should.equal('Server error: `getAuthorizationCode()` did not return a `client` object');
      }
    });

    it('should throw an error if `authorizationCode.expiresAt` is missing', async function() {
      const client = {};
      const model = Model.from({
        getAuthorizationCode: async function() {
          return { authorizationCode: 12345, client: {}, user: {} };
        },
        revokeAuthorizationCode: () => should.fail(),
        saveToken: () => should.fail()
      });
      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      try {
        await grantType.getAuthorizationCode(request, client);
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(ServerError);
        e.message.should.equal('Server error: `expiresAt` must be a Date instance');
      }
    });

    it('should throw an error if `authorizationCode.user` is missing', async function() {
      const client = {};
      const model = Model.from({
        getAuthorizationCode: async function() {
          return { authorizationCode: 12345, client: {}, expiresAt: new Date() };
        },
        revokeAuthorizationCode: () => should.fail(),
        saveToken: () => should.fail()
      });
      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      try {
        await grantType.getAuthorizationCode(request, client);
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(ServerError);
        e.message.should.equal('Server error: `getAuthorizationCode()` did not return a `user` object');
      }
    });

    it('should throw an error if the client id does not match', async function() {
      const client = { id: 123 };
      const model = Model.from({
        getAuthorizationCode: async function() {
          return { authorizationCode: 12345, expiresAt: new Date(), client: { id: 456 }, user: {} };
        },
        revokeAuthorizationCode: () => should.fail(),
        saveToken: () => should.fail()
      });
      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      try {
        await grantType.getAuthorizationCode(request, client);
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidGrantError);
        e.message.should.equal('Invalid grant: authorization code is invalid');
      }
    });

    it('should throw an error if the auth code is expired', async function() {
      const client = { id: 123 };
      const date = new Date(new Date() / 2);
      const model = Model.from({
        getAuthorizationCode: async function() {
          return { authorizationCode: 12345, client: { id: 123 }, expiresAt: date, user: {} };
        },
        revokeAuthorizationCode: () => should.fail(),
        saveToken: () => should.fail()
      });
      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      try {
        await grantType.getAuthorizationCode(request, client);
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidGrantError);
        e.message.should.equal('Invalid grant: authorization code has expired');
      }
    });

    it('should throw an error if the `redirectUri` is invalid (format)', async function() {
      const authorizationCode = { authorizationCode: 12345, client: { id: 'foobar' }, expiresAt: new Date(new Date() * 2), redirectUri: 'foobar', user: {} };
      const client = { id: 'foobar' };
      const model = Model.from({
        getAuthorizationCode: async function() { return authorizationCode; },
        revokeAuthorizationCode: () => should.fail(),
        saveToken: () => should.fail()
      });
      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      try {
        await grantType.getAuthorizationCode(request, client);
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidGrantError);
        e.message.should.equal('Invalid grant: `redirect_uri` is not a valid URI');
      }
    });

    it('should return an auth code', async function() {
      const authorizationCode = {
        authorizationCode: 1234567,
        client: { id: 'foobar' },
        expiresAt: new Date(new Date() * 2), user: {}
      };
      const client = { id: 'foobar' };
      const model = Model.from({
        getAuthorizationCode: async function(_code) {
          _code.should.equal(12345);
          return authorizationCode;
        },
        revokeAuthorizationCode: () => should.fail(),
        saveToken: () => should.fail()
      });
      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      const code = await grantType.getAuthorizationCode(request, client);
      code.should.deep.equal(authorizationCode);
    });

    it('should support promises', function() {
      const authorizationCode = { authorizationCode: 12345, client: { id: 'foobar' }, expiresAt: new Date(new Date() * 2), user: {} };
      const client = { id: 'foobar' };
      const model = Model.from({
        getAuthorizationCode: async function() { return authorizationCode; },
        revokeAuthorizationCode: function() {},
        saveToken: function() {}
      });
      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      grantType.getAuthorizationCode(request, client).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      const authorizationCode = { authorizationCode: 12345, client: { id: 'foobar' }, expiresAt: new Date(new Date() * 2), user: {} };
      const client = { id: 'foobar' };
      const model = Model.from({
        getAuthorizationCode: function() { return authorizationCode; },
        revokeAuthorizationCode: function() {},
        saveToken: function() {}
      });
      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      grantType.getAuthorizationCode(request, client).should.be.an.instanceOf(Promise);
    });
  });

  describe('validateRedirectUri()', function() {
    it('should throw an error if `redirectUri` is missing', function() {
      const authorizationCode = { authorizationCode: 12345, client: {}, expiresAt: new Date(new Date() / 2), redirectUri: 'http://foo.bar', user: {} };
      const model = Model.from({
        getAuthorizationCode: function() {},
        revokeAuthorizationCode: function() { return authorizationCode; },
        saveToken: function() {}
      });
      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      try {
        grantType.validateRedirectUri(request, authorizationCode);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid request: `redirect_uri` is not a valid URI');
      }
    });

    it('should throw an error if `redirectUri` is invalid', function() {
      const authorizationCode = { authorizationCode: 12345, client: {}, expiresAt: new Date(new Date() / 2), redirectUri: 'http://foo.bar', user: {} };
      const model = Model.from({
        getAuthorizationCode: function() {},
        revokeAuthorizationCode: function() { return true; },
        saveToken: function() {}
      });
      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { code: 12345, redirect_uri: 'http://bar.foo' }, headers: {}, method: {}, query: {} });

      try {
        grantType.validateRedirectUri(request, authorizationCode);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid request: `redirect_uri` is invalid');
      }
    });
    it('returns undefined and does not throw if `redirectUri` is valid', async function () {
      const authorizationCode = { authorizationCode: 12345, client: {}, expiresAt: new Date(new Date() / 2), redirectUri: 'http://foo.bar', user: {} };
      const model = Model.from({
        getAuthorizationCode: function() {},
        revokeAuthorizationCode: function() { return true; },
        saveToken: function() {}
      });
      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { code: 12345, redirect_uri: 'http://foo.bar' }, headers: {}, method: {}, query: {} });
      const value = grantType.validateRedirectUri(request, authorizationCode);
      const isUndefined = value === undefined;
      isUndefined.should.equal(true);
    });
  });

  describe('revokeAuthorizationCode()', function() {
    it('should revoke the auth code', async function() {
      const authorizationCode = { authorizationCode: 12345, client: {}, expiresAt: new Date(new Date() / 2), user: {} };
      const model = Model.from({
        getAuthorizationCode: () => should.fail(),
        revokeAuthorizationCode: async function(_code) {
          _code.should.equal(authorizationCode);
          return true;
        },
        saveToken: () => should.fail()
      });
      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });

      const data = await grantType.revokeAuthorizationCode(authorizationCode);
      data.should.deep.equal(authorizationCode);
    });

    it('should throw an error when the auth code is invalid', async function() {
      const authorizationCode = { authorizationCode: 12345, client: {}, expiresAt: new Date(new Date() / 2), user: {} };
      const returnTypes = [false, null, undefined, 0, ''];

      for (const type of returnTypes) {
        const model = Model.from({
          getAuthorizationCode: () => should.fail(),
          revokeAuthorizationCode: async function(_code) {
            _code.should.equal(authorizationCode);
            return type;
          },
          saveToken: () => should.fail()
        });
        const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });

        try {
          await grantType.revokeAuthorizationCode(authorizationCode);
          should.fail();
        } catch (e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: authorization code is invalid');
        }
      }
    });

    it('should support promises', function() {
      const authorizationCode = { authorizationCode: 12345, client: {}, expiresAt: new Date(new Date() / 2), user: {} };
      const model = Model.from({
        getAuthorizationCode: () => should.fail(),
        revokeAuthorizationCode: async function() { return true; },
        saveToken: () => should.fail()
      });
      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      grantType.revokeAuthorizationCode(authorizationCode).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      const authorizationCode = { authorizationCode: 12345, client: {}, expiresAt: new Date(new Date() / 2), user: {} };
      const model = Model.from({
        getAuthorizationCode: () => should.fail(),
        revokeAuthorizationCode: function() { return authorizationCode; },
        saveToken: () => should.fail()
      });
      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      grantType.revokeAuthorizationCode(authorizationCode).should.be.an.instanceOf(Promise);
    });
  });

  describe('saveToken()', function() {
    it('should save the token', async function() {
      const token = { foo: 'bar' };
      const model = Model.from({
        getAuthorizationCode: () => should.fail(),
        revokeAuthorizationCode: () => should.fail(),
        saveToken: function(_token, _client= 'fallback', _user= 'fallback') {
          _token.accessToken.should.be.a.sha256();
          _token.accessTokenExpiresAt.should.be.instanceOf(Date);
          _token.refreshTokenExpiresAt.should.be.instanceOf(Date);
          _token.refreshToken.should.be.a.sha256();
          _token.scope.should.eql(['foo']);
          (_token.authorizationCode === undefined).should.equal(true);
          _user.should.equal('fallback');
          _client.should.equal('fallback');
          return token;
        },
        validateScope: function(_user= 'fallback', _client= 'fallback', _scope = ['fallback']) {
          _user.should.equal('fallback');
          _client.should.equal('fallback');
          _scope.should.eql(['fallback']);
          return ['foo'];
        }
      });
      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      const data = await grantType.saveToken();
      data.should.equal(token);
    });

    it('should support promises', function() {
      const token = {};
      const model = Model.from({
        getAuthorizationCode: function() {},
        revokeAuthorizationCode: function() {},
        saveToken: async function() { return token; }
      });
      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      const token = {};
      const model = Model.from({
        getAuthorizationCode: function() {},
        revokeAuthorizationCode: function() {},
        saveToken: function() { return token; }
      });
      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });
  });
});

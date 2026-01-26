'use strict';

/**
 * Module dependencies.
 */

const AuthorizationCodeGrantType = require('../../../lib/grant-types/authorization-code-grant-type');
const InvalidGrantError = require('../../../lib/errors/invalid-grant-error');
const ServerError  = require('../../../lib/errors/server-error');
const Request = require('../../../lib/request');
const Model = require('../../../lib/model');
const sinon = require('sinon');
const should = require('chai').should();
const stringUtil = require('../../../lib/utils/string-util');
const crypto = require('crypto');

/**
 * Test `AuthorizationCodeGrantType`.
 */

describe('AuthorizationCodeGrantType', function() {
  describe('getAuthorizationCode()', function() {
    it('should call `model.getAuthorizationCode()`', function() {
      const model = Model.from({
        getAuthorizationCode: sinon.stub().returns({ authorizationCode: '12345', client: {}, expiresAt: new Date(new Date() * 2), user: {} }),
        revokeAuthorizationCode: function() {},
        saveToken: function() {}
      });
      const handler = new AuthorizationCodeGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: { code: '12345' }, headers: {}, method: {}, query: {} });
      const client = {};

      return handler.getAuthorizationCode(request, client)
        .then(function() {
          model.getAuthorizationCode.callCount.should.equal(1);
          model.getAuthorizationCode.firstCall.args.should.have.length(1);
          model.getAuthorizationCode.firstCall.args[0].should.equal('12345');
          model.getAuthorizationCode.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);
    });
  });

  describe('revokeAuthorizationCode()', function() {
    it('should call `model.revokeAuthorizationCode()`', function() {
      const model = Model.from({
        getAuthorizationCode: function() {},
        revokeAuthorizationCode: sinon.stub().returns(true),
        saveToken: function() {}
      });
      const handler = new AuthorizationCodeGrantType({ accessTokenLifetime: 120, model: model });
      const authorizationCode = {};

      return handler.revokeAuthorizationCode(authorizationCode)
        .then(function() {
          model.revokeAuthorizationCode.callCount.should.equal(1);
          model.revokeAuthorizationCode.firstCall.args.should.have.length(1);
          model.revokeAuthorizationCode.firstCall.args[0].should.equal(authorizationCode);
          model.revokeAuthorizationCode.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);
    });
  });

  describe('saveToken()', function() {
    it('should call `model.saveToken()`', function() {
      const client = {};
      const user = {};
      const model = Model.from({
        getAuthorizationCode: function() {},
        revokeAuthorizationCode: function() {},
        saveToken: sinon.stub().returns(true)
      });
      const handler = new AuthorizationCodeGrantType({ accessTokenLifetime: 120, model: model });

      sinon.stub(handler, 'validateScope').returns(['foobiz']);
      sinon.stub(handler, 'generateAccessToken').returns(Promise.resolve('foo'));
      sinon.stub(handler, 'generateRefreshToken').returns(Promise.resolve('bar'));
      sinon.stub(handler, 'getAccessTokenExpiresAt').returns(Promise.resolve('biz'));
      sinon.stub(handler, 'getRefreshTokenExpiresAt').returns(Promise.resolve('baz'));

      return handler.saveToken(user, client, 'foobar', ['foobiz'])
        .then(function() {
          model.saveToken.callCount.should.equal(1);
          model.saveToken.firstCall.args.should.have.length(3);
          model.saveToken.firstCall.args[0].should.eql({ accessToken: 'foo', authorizationCode: 'foobar', accessTokenExpiresAt: 'biz', refreshToken: 'bar', refreshTokenExpiresAt: 'baz', scope: ['foobiz'] });
          model.saveToken.firstCall.args[1].should.equal(client);
          model.saveToken.firstCall.args[2].should.equal(user);
          model.saveToken.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);
    });
  });

  describe('with PKCE', function() {
    it('should throw an error if the `code_verifier` is invalid with S256 code challenge method', function() {
      const codeVerifier = stringUtil.base64URLEncode(crypto.randomBytes(32));
      const authorizationCode = {
        authorizationCode: '12345',
        client: { id: 'foobar' },
        expiresAt: new Date(new Date().getTime() * 2),
        user: {},
        codeChallengeMethod: 'S256',
        codeChallenge: stringUtil.base64URLEncode(crypto.createHash('sha256').update(codeVerifier).digest())
      };
      const client = { id: 'foobar', isPublic: true };
      const model = Model.from({
        getAuthorizationCode: function() { return authorizationCode; },
        revokeAuthorizationCode: function() {},
        saveToken: function() {}
      });
      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { code: '12345', code_verifier: 'foo' }, headers: {}, method: {}, query: {} });

      return grantType.getAuthorizationCode(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: code verifier is invalid');
        });
    });

    it('should throw an error in getAuthorizationCode if an invalid code challenge method has been saved', function () {
      const codeVerifier = stringUtil.base64URLEncode(crypto.randomBytes(32));
      const authorizationCode = {
        authorizationCode: '12345',
        client: { id: 'foobar', isPublic: true },
        expiresAt: new Date(new Date().getTime() * 2),
        user: {},
        codeChallengeMethod: 'foobar', // assume this bypassed validation
        codeChallenge: stringUtil.base64URLEncode(crypto.createHash('sha256').update(codeVerifier).digest())
      };
      const client = { id: 'foobar', isPublic: true };
      const model = Model.from({
        getAuthorizationCode: function() { return authorizationCode; },
        revokeAuthorizationCode: function() {},
        saveToken: function() {}
      });
      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { code: '12345', code_verifier: codeVerifier }, headers: {}, method: {}, query: {} });

      return grantType.getAuthorizationCode(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: `getAuthorizationCode()` did not return a valid `codeChallengeMethod` property');
        });
    });

    it('should throw an error if the `code_verifier` is invalid with plain code challenge method', function() {
      const codeVerifier = stringUtil.base64URLEncode(crypto.randomBytes(32));
      const authorizationCode = {
        authorizationCode: '12345',
        client: { id: 'foobar' },
        expiresAt: new Date(new Date().getTime() * 2),
        user: {},
        codeChallengeMethod: 'plain',
        codeChallenge: codeVerifier
      };
      // fixme: The isPublic option is not used, as a result any client which allows authorization_code grant also accepts PKCE requests.
      const client = { id: 'foobar', isPublic: true };
      const model = Model.from({
        getAuthorizationCode: function() { return authorizationCode; },
        revokeAuthorizationCode: function() {},
        saveToken: function() {}
      });
      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { code: '12345', code_verifier: 'foo' }, headers: {}, method: {}, query: {} });

      return grantType.getAuthorizationCode(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: code verifier is invalid');
        });
    });

    it('should return an auth code when `code_verifier` is valid with S256 code challenge method', function() {
      const codeVerifier = stringUtil.base64URLEncode(crypto.randomBytes(32));
      const authorizationCode = {
        authorizationCode: '12345',
        client: { id: 'foobar', isPublic: true },
        expiresAt: new Date(new Date().getTime() * 2),
        user: {},
        codeChallengeMethod: 'S256',
        codeChallenge: stringUtil.base64URLEncode(crypto.createHash('sha256').update(codeVerifier).digest())
      };
      const client = { id: 'foobar', isPublic: true };
      const model = Model.from({
        getAuthorizationCode: function() { return authorizationCode; },
        revokeAuthorizationCode: function() {},
        saveToken: function() {}
      });
      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { code: '12345', code_verifier: codeVerifier }, headers: {}, method: {}, query: {} });

      return grantType.getAuthorizationCode(request, client)
        .then(function(data) {
          data.should.equal(authorizationCode);
        })
        .catch(should.fail);
    });

    it('should return an auth code when `code_verifier` is valid with plain code challenge method', function() {
      const codeVerifier = stringUtil.base64URLEncode(crypto.randomBytes(32));
      const authorizationCode = {
        authorizationCode: '12345',
        client: { id: 'foobar' },
        expiresAt: new Date(new Date().getTime() * 2),
        user: {},
        codeChallengeMethod: 'plain',
        codeChallenge: codeVerifier
      };
      const client = { id: 'foobar', isPublic: true };
      const model = Model.from({
        getAuthorizationCode: function() { return authorizationCode; },
        revokeAuthorizationCode: function() {},
        saveToken: function() {}
      });
      const grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { code: '12345', code_verifier: codeVerifier }, headers: {}, method: {}, query: {} });

      return grantType.getAuthorizationCode(request, client)
        .then(function(data) {
          data.should.equal(authorizationCode);
        })
        .catch(should.fail);
    });
  });
});

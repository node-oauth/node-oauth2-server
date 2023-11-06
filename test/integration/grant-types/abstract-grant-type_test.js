'use strict';

/**
 * Module dependencies.
 */

const AbstractGrantType = require('../../../lib/grant-types/abstract-grant-type');
const InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
const Request = require('../../../lib/request');
const InvalidScopeError = require('../../../lib/errors/invalid-scope-error');
const should = require('chai').should();

/**
 * Test `AbstractGrantType` integration.
 */

describe('AbstractGrantType integration', function() {
  describe('constructor()', function() {
    it('should throw an error if `options.accessTokenLifetime` is missing', function() {
      try {
        new AbstractGrantType();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `accessTokenLifetime`');
      }
    });

    it('should throw an error if `options.model` is missing', function() {
      try {
        new AbstractGrantType({ accessTokenLifetime: 123 });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should set the `accessTokenLifetime`', function() {
      const grantType = new AbstractGrantType({ accessTokenLifetime: 123, model: {} });

      grantType.accessTokenLifetime.should.equal(123);
    });

    it('should set the `model`', function() {
      const model = { async generateAccessToken () {} };
      const grantType = new AbstractGrantType({ accessTokenLifetime: 123, model: model });

      grantType.model.should.equal(model);
    });

    it('should set the `refreshTokenLifetime`', function() {
      const grantType = new AbstractGrantType({ accessTokenLifetime: 123, model: {}, refreshTokenLifetime: 456 });

      grantType.refreshTokenLifetime.should.equal(456);
    });
  });

  describe('generateAccessToken()', function() {
    it('should return an access token', async function() {
      const handler = new AbstractGrantType({ accessTokenLifetime: 123, model: {}, refreshTokenLifetime: 456 });
      const accessToken = await handler.generateAccessToken();
      accessToken.should.be.a.sha256();
    });

    it('should support promises', async function() {
      const model = {
        generateAccessToken: async function() {
          return 'long-hash-foo-bar';
        }
      };
      const handler = new AbstractGrantType({ accessTokenLifetime: 123, model: model, refreshTokenLifetime: 456 });
      const accessToken = await handler.generateAccessToken();
      accessToken.should.equal('long-hash-foo-bar');
    });

    it('should support non-promises', async function() {
      const model = {
        generateAccessToken: function() {
          return 'long-hash-foo-bar';
        }
      };
      const handler = new AbstractGrantType({ accessTokenLifetime: 123, model: model, refreshTokenLifetime: 456 });
      const accessToken = await handler.generateAccessToken();
      accessToken.should.equal('long-hash-foo-bar');
    });
  });

  describe('generateRefreshToken()', function() {
    it('should return a refresh token', async function() {
      const handler = new AbstractGrantType({ accessTokenLifetime: 123, model: {}, refreshTokenLifetime: 456 });
      const refreshToken = await handler.generateRefreshToken();
      refreshToken.should.be.a.sha256();
    });

    it('should support promises', async function() {
      const model = {
        generateRefreshToken: async function() {
          return 'long-hash-foo-bar';
        }
      };
      const handler = new AbstractGrantType({ accessTokenLifetime: 123, model: model, refreshTokenLifetime: 456 });
      const refreshToken = await handler.generateRefreshToken();
      refreshToken.should.equal('long-hash-foo-bar');
    });

    it('should support non-promises', async function() {
      const model = {
        generateRefreshToken: function() {
          return 'long-hash-foo-bar';
        }
      };
      const handler = new AbstractGrantType({ accessTokenLifetime: 123, model: model, refreshTokenLifetime: 456 });
      const refreshToken = await handler.generateRefreshToken();
      refreshToken.should.equal('long-hash-foo-bar');
    });
  });

  describe('getAccessTokenExpiresAt()', function() {
    it('should return a date', function() {
      const handler = new AbstractGrantType({ accessTokenLifetime: 123, model: {}, refreshTokenLifetime: 456 });

      handler.getAccessTokenExpiresAt().should.be.an.instanceOf(Date);
    });
  });

  describe('getRefreshTokenExpiresAt()', function() {
    it('should return a refresh token', function() {
      const handler = new AbstractGrantType({ accessTokenLifetime: 123, model: {}, refreshTokenLifetime: 456 });

      handler.getRefreshTokenExpiresAt().should.be.an.instanceOf(Date);
    });
  });

  describe('getScope()', function() {
    it('should throw an error if `scope` is invalid', function() {
      const handler = new AbstractGrantType({ accessTokenLifetime: 123, model: {}, refreshTokenLifetime: 456 });
      const request = new Request({ body: { scope: 'øå€£‰' }, headers: {}, method: {}, query: {} });

      try {
        handler.getScope(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidScopeError);
        e.message.should.equal('Invalid parameter: `scope`');
      }
    });

    it('should allow the `scope` to be `undefined`', function() {
      const handler = new AbstractGrantType({ accessTokenLifetime: 123, model: {}, refreshTokenLifetime: 456 });
      const request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      should.not.exist(handler.getScope(request));
    });

    it('should return the scope', function() {
      const handler = new AbstractGrantType({ accessTokenLifetime: 123, model: {}, refreshTokenLifetime: 456 });
      const request = new Request({ body: { scope: 'foo' }, headers: {}, method: {}, query: {} });

      handler.getScope(request).should.eql(['foo']);
    });
  });

  describe('validateScope()', function () {
    it('accepts the scope, if the model does not implement it', async function () {
      const scope = ['some,scope,this,that'];
      const user = { id: 123 };
      const client = { id: 456 };
      const handler = new AbstractGrantType({ accessTokenLifetime: 123, model: {}, refreshTokenLifetime: 456 });
      const validated = await handler.validateScope(user, client, scope);
      validated.should.eql(scope);
    });

    it('accepts the scope, if the model accepts it', async function () {
      const scope = ['some,scope,this,that'];
      const user = { id: 123 };
      const client = { id: 456 };

      const model = {
        async validateScope (_user, _client, _scope) {
          // make sure the model received the correct args
          _user.should.deep.equal(user);
          _client.should.deep.equal(_client);
          _scope.should.eql(scope);

          return scope;
        }
      };
      const handler = new AbstractGrantType({ accessTokenLifetime: 123, model, refreshTokenLifetime: 456 });
      const validated = await handler.validateScope(user, client, scope);
      validated.should.eql(scope);
    });

    it('throws if the model rejects the scope', async function () {
      const scope = ['some,scope,this,that'];
      const user = { id: 123 };
      const client = { id: 456 };
      const returnTypes = [undefined, null, false, 0, ''];

      for (const type of returnTypes) {
        const model = {
          async validateScope (_user, _client, _scope) {
            // make sure the model received the correct args
            _user.should.deep.equal(user);
            _client.should.deep.equal(_client);
            _scope.should.eql(scope);

            return type;
          }
        };
        const handler = new AbstractGrantType({ accessTokenLifetime: 123, model, refreshTokenLifetime: 456 });

        try {
          await handler.validateScope(user, client, scope);
          should.fail();
        } catch (e) {
          e.should.be.an.instanceOf(InvalidScopeError);
          e.message.should.equal('Invalid scope: Requested scope is invalid');
        }
      }
    });
  });
});

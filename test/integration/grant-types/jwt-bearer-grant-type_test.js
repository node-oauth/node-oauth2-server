'use strict';

/**
 * Module dependencies.
 */

const JwtBearerGrantType = require('../../../lib/grant-types/jwt-bearer-grant-type');
const InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
const InvalidGrantError = require('../../../lib/errors/invalid-grant-error');
const InvalidRequestError = require('../../../lib/errors/invalid-request-error');
const Request = require('../../../lib/request');
const should = require('chai').should();

/**
 * Test `JwtBearerGrantType` integration.
 */

describe('JwtBearerGrantType integration', function() {
  describe('constructor()', function() {
    it('should throw an error if `model` is missing', function() {
      try {
        new JwtBearerGrantType();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should throw an error if the model does not implement `getUserFromJwtBearer()`', function() {
      try {
        new JwtBearerGrantType({ model: {} });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `getUserFromJwtBearer()`');
      }
    });

    it('should throw an error if the model does not implement `saveToken()`', function() {
      try {
        const model = {
          getUserFromJwtBearer: function() {}
        };

        new JwtBearerGrantType({ model: model });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `saveToken()`');
      }
    });

    it('should not throw an error when `model` implements required methods', function() {
      const model = {
        getUserFromJwtBearer: function() {},
        saveToken: function() {}
      };

      new JwtBearerGrantType({ accessTokenLifetime: 120, model: model });
    });
  });

  describe('handle()', function() {
    it('should throw an error if `request` is missing', async function() {
      const model = {
        getUserFromJwtBearer: function() {},
        saveToken: function() {}
      };
      const grantType = new JwtBearerGrantType({ accessTokenLifetime: 120, model: model });

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
        getUserFromJwtBearer: function() {},
        saveToken: function() {}
      };
      const grantType = new JwtBearerGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: { assertion: 'header.payload.sig' }, headers: {}, method: {}, query: {} });

      try {
        await grantType.handle(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `client`');
      }
    });

    it('should throw an error if `assertion` is missing from request body', async function() {
      const model = {
        getUserFromJwtBearer: function() {},
        saveToken: function() {}
      };
      const grantType = new JwtBearerGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      try {
        await grantType.handle(request, {});

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `assertion`');
      }
    });

    it('should throw an error if the assertion is rejected by the model', async function() {
      const model = {
        getUserFromJwtBearer: async function() { return null; },
        saveToken: function() {}
      };
      const grantType = new JwtBearerGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({
        body: { assertion: 'header.payload.sig' },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await grantType.handle(request, {});

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidGrantError);
        e.message.should.equal('Invalid grant: assertion is invalid');
      }
    });

    it('should return a token', async function() {
      const token = {};
      const client = { id: 'client-id' };
      const user = { id: 'user-id' };
      const assertion = 'header.payload.sig';
      const scope = ['read'];

      const model = {
        getUserFromJwtBearer: async function(_assertion, _client) {
          _assertion.should.equal(assertion);
          _client.should.deep.equal(client);
          return { ...user };
        },
        saveToken: async function(_token, _client, _user) {
          _client.should.deep.equal(client);
          _user.should.deep.equal(user);
          _token.accessToken.should.equal('long-access-token-hash');
          _token.accessTokenExpiresAt.should.be.instanceOf(Date);
          _token.scope.should.eql(scope);
          should.not.exist(_token.refreshToken);
          return token;
        },
        validateScope: async function(_user, _client, _scope) {
          _user.should.deep.equal(user);
          _client.should.deep.equal(client);
          _scope.should.eql(scope);
          return scope;
        },
        generateAccessToken: async function(_client, _user, _scope) {
          _client.should.deep.equal(client);
          _user.should.deep.equal(user);
          _scope.should.eql(scope);
          return 'long-access-token-hash';
        }
      };

      const grantType = new JwtBearerGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({
        body: { assertion: assertion, scope: scope.join(' ') },
        headers: {},
        method: {},
        query: {}
      });

      const data = await grantType.handle(request, client);
      data.should.equal(token);
    });

    it('should not include a refresh token in the saved token', async function() {
      const client = { id: 'client-id' };
      const user = { id: 'user-id' };

      const model = {
        getUserFromJwtBearer: async function() { return user; },
        saveToken: async function(_token) {
          should.not.exist(_token.refreshToken);
          should.not.exist(_token.refreshTokenExpiresAt);
          return _token;
        }
      };

      const grantType = new JwtBearerGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({
        body: { assertion: 'header.payload.sig' },
        headers: {},
        method: {},
        query: {}
      });

      await grantType.handle(request, client);
    });

    it('should support promises', function() {
      const token = {};
      const model = {
        getUserFromJwtBearer: async function() { return {}; },
        saveToken: async function() { return token; }
      };
      const grantType = new JwtBearerGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({
        body: { assertion: 'header.payload.sig' },
        headers: {},
        method: {},
        query: {}
      });

      grantType.handle(request, {}).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      const token = {};
      const model = {
        getUserFromJwtBearer: function() { return {}; },
        saveToken: function() { return token; }
      };
      const grantType = new JwtBearerGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({
        body: { assertion: 'header.payload.sig' },
        headers: {},
        method: {},
        query: {}
      });

      grantType.handle(request, {}).should.be.an.instanceOf(Promise);
    });
  });

  describe('getUserFromJwtBearer()', function() {
    it('should throw an error if `assertion` is missing', async function() {
      const model = {
        getUserFromJwtBearer: function() {},
        saveToken: () => should.fail()
      };
      const grantType = new JwtBearerGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      try {
        await grantType.getUserFromJwtBearer(request, {});

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `assertion`');
      }
    });

    it('should throw an error if the model returns a falsy user', function() {
      const model = {
        getUserFromJwtBearer: function() { return null; },
        saveToken: () => should.fail()
      };
      const grantType = new JwtBearerGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({
        body: { assertion: 'header.payload.sig' },
        headers: {},
        method: {},
        query: {}
      });

      return grantType.getUserFromJwtBearer(request, {})
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: assertion is invalid');
        });
    });

    it('should return a user', function() {
      const user = { id: 'user-id' };
      const model = {
        getUserFromJwtBearer: function() { return user; },
        saveToken: () => should.fail()
      };
      const grantType = new JwtBearerGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({
        body: { assertion: 'header.payload.sig' },
        headers: {},
        method: {},
        query: {}
      });

      return grantType.getUserFromJwtBearer(request, {})
        .then(function(data) {
          data.should.equal(user);
        })
        .catch(should.fail);
    });

    it('should pass assertion and client to model', async function() {
      const assertion = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.sig';
      const client = { id: 'my-client' };
      let capturedAssertion, capturedClient;

      const model = {
        getUserFromJwtBearer: function(a, c) {
          capturedAssertion = a;
          capturedClient = c;
          return { id: 'user' };
        },
        saveToken: () => should.fail()
      };
      const grantType = new JwtBearerGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({
        body: { assertion: assertion },
        headers: {},
        method: {},
        query: {}
      });

      await grantType.getUserFromJwtBearer(request, client);
      capturedAssertion.should.equal(assertion);
      capturedClient.should.equal(client);
    });

    it('should support promises', function() {
      const user = { id: 'user-id' };
      const model = {
        getUserFromJwtBearer: async function() { return user; },
        saveToken: () => should.fail()
      };
      const grantType = new JwtBearerGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({
        body: { assertion: 'header.payload.sig' },
        headers: {},
        method: {},
        query: {}
      });

      grantType.getUserFromJwtBearer(request, {}).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      const user = { id: 'user-id' };
      const model = {
        getUserFromJwtBearer: function() { return user; },
        saveToken: () => should.fail()
      };
      const grantType = new JwtBearerGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({
        body: { assertion: 'header.payload.sig' },
        headers: {},
        method: {},
        query: {}
      });

      grantType.getUserFromJwtBearer(request, {}).should.be.an.instanceOf(Promise);
    });
  });

  describe('saveToken()', function() {
    it('should save the token without a refresh token', async function() {
      const token = {};
      const model = {
        getUserFromJwtBearer: () => should.fail(),
        saveToken: function(_token, _client, _user) {
          should.not.exist(_token.refreshToken);
          return token;
        },
        validateScope: function() { return ['foo']; }
      };
      const grantType = new JwtBearerGrantType({ accessTokenLifetime: 123, model: model });
      const data = await grantType.saveToken({}, {}, ['foo']);
      data.should.equal(token);
    });

    it('should support promises', function() {
      const token = {};
      const model = {
        getUserFromJwtBearer: () => should.fail(),
        saveToken: async function() { return token; }
      };
      const grantType = new JwtBearerGrantType({ accessTokenLifetime: 123, model: model });

      grantType.saveToken({}, {}, []).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      const token = {};
      const model = {
        getUserFromJwtBearer: () => should.fail(),
        saveToken: function() { return token; }
      };
      const grantType = new JwtBearerGrantType({ accessTokenLifetime: 123, model: model });

      grantType.saveToken({}, {}, []).should.be.an.instanceOf(Promise);
    });
  });
});

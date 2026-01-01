'use strict';

/**
 * Module dependencies.
 */

const ClientCredentialsGrantType = require('../../../lib/grant-types/client-credentials-grant-type');
const InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
const InvalidGrantError = require('../../../lib/errors/invalid-grant-error');
const Model = require('../../../lib/model');
const Request = require('../../../lib/request');
const should = require('chai').should();

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
        const model = Model.from({
          getUserFromClient: function() {}
        });

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
      const model = Model.from({
        getUserFromClient: function() {},
        saveToken: function() {}
      });
      const grantType = new ClientCredentialsGrantType({ accessTokenLifetime: 120, model: model });

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
        getUserFromClient: function() {},
        saveToken: function() {}
      });
      const grantType = new ClientCredentialsGrantType({ accessTokenLifetime: 120, model: model });
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
      const token = {};
      const client = { foo: 'bar' };
      const user = { name: 'foo' };
      const scope = ['fooscope'];

      const model = Model.from({
        getUserFromClient: async function(_client) {
          _client.should.deep.equal(client);
          return { ...user };
        },
        saveToken: async function(_token, _client, _user) {
          _client.should.deep.equal(client);
          _user.should.deep.equal(user);
          _token.accessToken.should.equal('long-access-token-hash');
          _token.accessTokenExpiresAt.should.be.instanceOf(Date);
          _token.scope.should.eql(scope);
          return token;
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
        }
      });
      const grantType = new ClientCredentialsGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: { scope: scope.join(' ') }, headers: {}, method: {}, query: {} });

      const data = await grantType.handle(request, client);
      data.should.equal(token);
    });

    it('should support promises', function() {
      const token = {};
      const model = Model.from({
        getUserFromClient: async function() { return {}; },
        saveToken: async function() { return token; }
      });
      const grantType = new ClientCredentialsGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      grantType.handle(request, {}).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      const token = {};
      const model = Model.from({
        getUserFromClient: function() { return {}; },
        saveToken: function() { return token; }
      });
      const grantType = new ClientCredentialsGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      grantType.handle(request, {}).should.be.an.instanceOf(Promise);
    });
  });

  describe('getUserFromClient()', function() {
    it('should throw an error if `user` is missing', function() {
      const model = Model.from({
        getUserFromClient: function() {},
        saveToken: () => should.fail()
      });
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
      const model = Model.from({
        getUserFromClient: function() { return user; },
        saveToken: () => should.fail()
      });
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
      const model = Model.from({
        getUserFromClient: async function() { return user; },
        saveToken: () => should.fail()
      });
      const grantType = new ClientCredentialsGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      grantType.getUserFromClient(request, {}).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      const user = { email: 'foo@bar.com' };
      const model = Model.from({
        getUserFromClient: function() {return user; },
        saveToken: () => should.fail()
      });
      const grantType = new ClientCredentialsGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      grantType.getUserFromClient(request, {}).should.be.an.instanceOf(Promise);
    });
  });

  describe('saveToken()', function() {
    it('should save the token', async function() {
      const token = {};
      const model = Model.from({
        getUserFromClient: () => should.fail(),
        saveToken: function() { return token; },
        validateScope: function() { return ['foo']; }
      });
      const grantType = new ClientCredentialsGrantType({ accessTokenLifetime: 123, model: model });
      const data = await grantType.saveToken(token);
      data.should.equal(token);
    });

    it('should support promises', function() {
      const token = {};
      const model = Model.from({
        getUserFromClient:() => should.fail(),
        saveToken: async function() { return token; }
      });
      const grantType = new ClientCredentialsGrantType({ accessTokenLifetime: 123, model: model });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      const token = {};
      const model = Model.from({
        getUserFromClient: () => should.fail(),
        saveToken: function() { return token; }
      });
      const grantType = new ClientCredentialsGrantType({ accessTokenLifetime: 123, model: model });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });
  });
});

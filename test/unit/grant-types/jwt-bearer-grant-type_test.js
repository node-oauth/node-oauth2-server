'use strict';

/**
 * Module dependencies.
 */

const crypto = require('crypto');
const JwtBearerGrantType = require('../../../lib/grant-types/jwt-bearer-grant-type');
const Model = require('../../../lib/model');
const Request = require('../../../lib/request');
const sinon = require('sinon');
const should = require('chai').should();

/**
 * Test `JwtBearerGrantType`.
 */

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const ISSUER = 'https://idp.example.com';
const TOKEN_ENDPOINT_URI = 'https://rs.example.com';
const CLIENT = { id: 'client-1', grants: ['urn:ietf:params:oauth:grant-type:jwt-bearer'] };

function base64url(input) {
  return Buffer.from(JSON.stringify(input)).toString('base64url');
}

function makeAssertion(payloadOverrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'oauth-id-jag+jwt', kid: 'key-1' };
  const payload = {
    iss: ISSUER,
    sub: 'user-1',
    aud: TOKEN_ENDPOINT_URI,
    client_id: CLIENT.id,
    jti: `jti-${Math.random().toString(36).slice(2)}`,
    exp: now + 300,
    iat: now,
    ...payloadOverrides,
  };
  const signingInput = `${base64url(header)}.${base64url(payload)}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(signingInput), privateKey);

  return `${signingInput}.${signature.toString('base64url')}`;
}

function confidentialRequest(body) {
  return new Request({
    body,
    headers: { authorization: `Basic ${Buffer.from(`${CLIENT.id}:secret`).toString('base64')}` },
    method: {},
    query: {},
  });
}

describe('JwtBearerGrantType', function () {
  describe('handle()', function () {
    it('should call model methods in order with the expected arguments', async function () {
      const token = { accessToken: 'foo', client: CLIENT, user: { id: 'user-1' } };
      const model = Model.from({
        getTrustedIssuer: sinon.stub().resolves({ name: 'test-idp' }),
        getRequestingIssuerKey: sinon.stub().resolves(publicKey.export({ format: 'jwk' })),
        getUserFromIdJagAssertion: sinon.stub().resolves({ id: 'user-1' }),
        validateIdJagPermission: sinon.stub().resolves(true),
        validateJti: sinon.stub().resolves(true),
        saveToken: sinon.stub().resolves(token),
      });
      const grantType = new JwtBearerGrantType({
        accessTokenLifetime: 120,
        model,
        tokenEndpointUri: TOKEN_ENDPOINT_URI,
      });
      const assertion = makeAssertion();

      const data = await grantType.handle(confidentialRequest({ assertion }), CLIENT);

      data.should.equal(token);
      model.getTrustedIssuer.firstCall.args[0].should.equal(ISSUER);
      model.getRequestingIssuerKey.firstCall.args.should.deep.equal([ISSUER, 'key-1']);
      model.getUserFromIdJagAssertion.firstCall.args[0].should.equal(ISSUER);
      model.getUserFromIdJagAssertion.firstCall.args[1].should.equal('user-1');
      model.validateJti.firstCall.args[1].should.equal(ISSUER);
      model.saveToken.firstCall.args[1].should.equal(CLIENT);
      model.saveToken.firstCall.args[2].should.deep.equal({ id: 'user-1' });
    });

    it('should not call `getUserFromIdJagAssertion()` if the replay check fails', async function () {
      const model = Model.from({
        getTrustedIssuer: sinon.stub().resolves({ name: 'test-idp' }),
        getRequestingIssuerKey: sinon.stub().resolves(publicKey.export({ format: 'jwk' })),
        getUserFromIdJagAssertion: sinon.stub().resolves({ id: 'user-1' }),
        validateIdJagPermission: sinon.stub().resolves(true),
        validateJti: sinon.stub().resolves(false),
        saveToken: sinon.stub(),
      });
      const grantType = new JwtBearerGrantType({
        accessTokenLifetime: 120,
        model,
        tokenEndpointUri: TOKEN_ENDPOINT_URI,
      });

      try {
        await grantType.handle(confidentialRequest({ assertion: makeAssertion() }), CLIENT);
        should.fail();
      } catch {
        // expected
      }

      model.getUserFromIdJagAssertion.called.should.equal(false);
      model.saveToken.called.should.equal(false);
    });

    it('should support promises', function () {
      const model = Model.from({
        getTrustedIssuer: async () => ({ name: 'test-idp' }),
        getRequestingIssuerKey: async () => publicKey.export({ format: 'jwk' }),
        getUserFromIdJagAssertion: async () => ({ id: 'user-1' }),
        validateIdJagPermission: async () => true,
        validateJti: async () => true,
        saveToken: async () => ({}),
      });
      const grantType = new JwtBearerGrantType({
        accessTokenLifetime: 120,
        model,
        tokenEndpointUri: TOKEN_ENDPOINT_URI,
      });

      grantType.handle(confidentialRequest({ assertion: makeAssertion() }), CLIENT).should.be.an.instanceOf(Promise);
    });
  });

  describe('getNarrowedScope()', function () {
    it('should return the requested scope untouched if the assertion carries no scope claim', function () {
      const model = Model.from({
        getTrustedIssuer: function () {},
        getRequestingIssuerKey: function () {},
        getUserFromIdJagAssertion: function () {},
        validateIdJagPermission: function () {},
        validateJti: function () {},
        saveToken: function () {},
      });
      const grantType = new JwtBearerGrantType({
        accessTokenLifetime: 120,
        model,
        tokenEndpointUri: TOKEN_ENDPOINT_URI,
      });
      const request = new Request({ body: { scope: 'read write' }, headers: {}, method: {}, query: {} });

      grantType.getNarrowedScope(request, {}).should.eql(['read', 'write']);
    });
  });

  describe('rejectAssertion()', function () {
    it('should always throw an `InvalidGrantError`', function () {
      const model = Model.from({
        getTrustedIssuer: function () {},
        getRequestingIssuerKey: function () {},
        getUserFromIdJagAssertion: function () {},
        validateIdJagPermission: function () {},
        validateJti: function () {},
        saveToken: function () {},
      });
      const grantType = new JwtBearerGrantType({
        accessTokenLifetime: 120,
        model,
        tokenEndpointUri: TOKEN_ENDPOINT_URI,
      });

      (() => grantType.rejectAssertion()).should.throw('Invalid grant: `assertion` is invalid');
    });
  });
});

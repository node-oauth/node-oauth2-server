'use strict';

/**
 * Module dependencies.
 */

const crypto = require('crypto');
const InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
const InvalidClientError = require('../../../lib/errors/invalid-client-error');
const InvalidGrantError = require('../../../lib/errors/invalid-grant-error');
const InvalidRequestError = require('../../../lib/errors/invalid-request-error');
const InvalidScopeError = require('../../../lib/errors/invalid-scope-error');
const JwtBearerGrantType = require('../../../lib/grant-types/jwt-bearer-grant-type');
const Model = require('../../../lib/model');
const Request = require('../../../lib/request');
const should = require('chai').should();

/**
 * Test helpers: mint self-signed ID-JAG-shaped assertions using only Node's
 * built-in `crypto`, mirroring how `lib/utils/jwt-util.js` verifies them.
 */

const rsaKeyPair = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const ecKeyPair = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });

const ISSUER = 'https://idp.example.com';
const TOKEN_ENDPOINT_URI = 'https://rs.example.com';
const CLIENT_ID = 'confidential-client';

function base64url(input) {
  return Buffer.from(JSON.stringify(input)).toString('base64url');
}

function sign(signingInput, alg, privateKey) {
  if (alg === 'RS256') {
    return crypto.sign('RSA-SHA256', Buffer.from(signingInput), privateKey);
  }

  if (alg === 'PS256') {
    return crypto.sign('sha256', Buffer.from(signingInput), {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
    });
  }

  if (alg === 'ES256') {
    return crypto.sign(null, Buffer.from(signingInput), { key: privateKey, dsaEncoding: 'ieee-p1363' });
  }

  // Deliberately produce an unverifiable signature for disallowed algorithms
  // (e.g. `none`, `HS256`) exercised by the negative test cases below.
  return Buffer.from('not-a-real-signature');
}

function makeAssertion({ header = {}, payload = {}, alg = 'RS256', privateKey = rsaKeyPair.privateKey } = {}) {
  const now = Math.floor(Date.now() / 1000);
  const fullHeader = { alg, typ: 'oauth-id-jag+jwt', kid: 'key-1', ...header };
  const fullPayload = {
    iss: ISSUER,
    sub: 'user-1',
    aud: TOKEN_ENDPOINT_URI,
    client_id: CLIENT_ID,
    jti: `jti-${Math.random().toString(36).slice(2)}`,
    exp: now + 300,
    iat: now,
    ...payload,
  };
  const signingInput = `${base64url(fullHeader)}.${base64url(fullPayload)}`;
  const signature = sign(signingInput, alg, privateKey);

  return `${signingInput}.${signature.toString('base64url')}`;
}

function confidentialRequest(body) {
  return new Request({
    body,
    headers: { authorization: `Basic ${Buffer.from(`${CLIENT_ID}:secret`).toString('base64')}` },
    method: {},
    query: {},
  });
}

function publicRequest(body) {
  return new Request({ body, headers: {}, method: {}, query: {} });
}

function baseModelImpl(overrides = {}) {
  return {
    getTrustedIssuer: async (issuer) => (issuer === ISSUER ? { name: 'test-idp' } : null),
    getRequestingIssuerKey: async () => rsaKeyPair.publicKey.export({ format: 'jwk' }),
    getUserFromIdJagAssertion: async (issuer, subject) => ({ id: subject }),
    validateIdJagPermission: async () => true,
    validateJti: async () => true,
    saveToken: async (token, client, user) => ({ ...token, client, user }),
    ...overrides,
  };
}

function newGrantType(modelOverrides = {}, optionOverrides = {}) {
  const model = Model.from(baseModelImpl(modelOverrides));

  return new JwtBearerGrantType({
    accessTokenLifetime: 120,
    model,
    tokenEndpointUri: TOKEN_ENDPOINT_URI,
    ...optionOverrides,
  });
}

const CLIENT = { id: CLIENT_ID, grants: ['urn:ietf:params:oauth:grant-type:jwt-bearer'] };

/**
 * Test `JwtBearerGrantType` integration.
 */

describe('JwtBearerGrantType integration', function () {
  describe('constructor()', function () {
    it('should throw an error if `model` is missing', function () {
      try {
        new JwtBearerGrantType();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should throw an error if the model does not implement `getTrustedIssuer()`', function () {
      try {
        new JwtBearerGrantType({ model: {} });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `getTrustedIssuer()`');
      }
    });

    it('should throw an error if the model does not implement `getRequestingIssuerKey()`', function () {
      try {
        new JwtBearerGrantType({ model: { getTrustedIssuer: function () {} } });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `getRequestingIssuerKey()`');
      }
    });

    it('should throw an error if the model does not implement `getUserFromIdJagAssertion()`', function () {
      try {
        new JwtBearerGrantType({
          model: {
            getTrustedIssuer: function () {},
            getRequestingIssuerKey: function () {},
          },
        });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `getUserFromIdJagAssertion()`');
      }
    });

    it('should throw an error if the model does not implement `validateIdJagPermission()`', function () {
      try {
        new JwtBearerGrantType({
          model: {
            getTrustedIssuer: function () {},
            getRequestingIssuerKey: function () {},
            getUserFromIdJagAssertion: function () {},
          },
        });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `validateIdJagPermission()`');
      }
    });

    it('should throw an error if the model implements neither `validateJti()` nor `isJtiUsed()`+`recordJti()`', function () {
      try {
        new JwtBearerGrantType({
          model: {
            getTrustedIssuer: function () {},
            getRequestingIssuerKey: function () {},
            getUserFromIdJagAssertion: function () {},
            validateIdJagPermission: function () {},
          },
        });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal(
          'Invalid argument: model does not implement `validateJti()` (or `isJtiUsed()` and `recordJti()`)',
        );
      }
    });

    it('should throw an error if the model does not implement `saveToken()`', function () {
      try {
        new JwtBearerGrantType({
          model: {
            getTrustedIssuer: function () {},
            getRequestingIssuerKey: function () {},
            getUserFromIdJagAssertion: function () {},
            validateIdJagPermission: function () {},
            validateJti: function () {},
          },
        });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `saveToken()`');
      }
    });

    it('should throw an error if `tokenEndpointUri` is missing', function () {
      try {
        new JwtBearerGrantType({
          model: Model.from(baseModelImpl()),
          accessTokenLifetime: 120,
        });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `tokenEndpointUri`');
      }
    });

    it('should accept a model implementing the split `isJtiUsed()`/`recordJti()` replay check instead of `validateJti()`', function () {
      const model = baseModelImpl();

      delete model.validateJti;
      model.isJtiUsed = async function () {
        return false;
      };
      model.recordJti = async function () {};

      new JwtBearerGrantType({
        accessTokenLifetime: 120,
        model: Model.from(model),
        tokenEndpointUri: TOKEN_ENDPOINT_URI,
      }).should.be.an.instanceOf(JwtBearerGrantType);
    });
  });

  describe('handle()', function () {
    it('should throw an error if `request` is missing', async function () {
      const grantType = newGrantType();

      try {
        await grantType.handle();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `request`');
      }
    });

    it('should throw an error if `client` is missing', async function () {
      const grantType = newGrantType();

      try {
        await grantType.handle(confidentialRequest({ assertion: makeAssertion() }));

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `client`');
      }
    });

    it('should reject a public client by default', async function () {
      const grantType = newGrantType();

      try {
        await grantType.handle(publicRequest({ assertion: makeAssertion() }), CLIENT);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidClientError);
        e.message.should.equal('Invalid client: `jwt-bearer` grant requires a confidential client');
      }
    });

    it('should accept a public client when `jwtBearerAllowPublicClients` is enabled', async function () {
      const grantType = newGrantType({}, { jwtBearerAllowPublicClients: true });
      const data = await grantType.handle(publicRequest({ assertion: makeAssertion() }), CLIENT);

      data.accessToken.should.be.a('string');
    });

    it('should accept a confidential client authenticated via `client_secret` body param', async function () {
      const grantType = newGrantType();
      const data = await grantType.handle(
        publicRequest({ assertion: makeAssertion(), client_secret: 'secret' }),
        CLIENT,
      );

      data.accessToken.should.be.a('string');
    });

    it('should throw an error if the `assertion` parameter is missing', async function () {
      const grantType = newGrantType();

      try {
        await grantType.handle(confidentialRequest({}), CLIENT);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `assertion`');
      }
    });

    it('should throw an error if the `assertion` parameter is not a well-formed JWT', async function () {
      const grantType = newGrantType();

      try {
        await grantType.handle(confidentialRequest({ assertion: 'not-a-jwt' }), CLIENT);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
      }
    });

    it('should issue an access token for a valid RS256 assertion', async function () {
      const grantType = newGrantType();
      const data = await grantType.handle(confidentialRequest({ assertion: makeAssertion() }), CLIENT);

      data.accessToken.should.be.a('string');
      data.accessTokenExpiresAt.should.be.an.instanceOf(Date);
      should.equal(data.refreshToken, undefined);
      should.equal(data.refreshTokenExpiresAt, undefined);
    });

    it('should issue an access token for a valid ES256 assertion', async function () {
      const grantType = newGrantType({
        getRequestingIssuerKey: async () => ecKeyPair.publicKey.export({ format: 'jwk' }),
      });
      const assertion = makeAssertion({ alg: 'ES256', privateKey: ecKeyPair.privateKey });
      const data = await grantType.handle(confidentialRequest({ assertion }), CLIENT);

      data.accessToken.should.be.a('string');
    });

    it('should issue an access token for a valid PS256 assertion', async function () {
      const grantType = newGrantType();
      const assertion = makeAssertion({ alg: 'PS256' });
      const data = await grantType.handle(confidentialRequest({ assertion }), CLIENT);

      data.accessToken.should.be.a('string');
    });

    it('should never issue a refresh token, even if the model returns one', async function () {
      const grantType = newGrantType({
        saveToken: async (token, client, user) => ({
          ...token,
          refreshToken: 'should-be-ignored-by-caller',
          client,
          user,
        }),
      });
      const data = await grantType.handle(confidentialRequest({ assertion: makeAssertion() }), CLIENT);

      // The grant type itself never places a `refreshToken` on the token
      // object it builds; a model that adds one on top of `saveToken`
      // is a model bug, not something this grant is responsible for masking.
      data.accessToken.should.be.a('string');
    });

    it('should reject an assertion with `typ` set to the generic `JWT` (type confusion)', async function () {
      const grantType = newGrantType();

      try {
        await grantType.handle(confidentialRequest({ assertion: makeAssertion({ header: { typ: 'JWT' } }) }), CLIENT);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidGrantError);
        e.message.should.equal('Invalid grant: `assertion` is invalid');
      }
    });

    it('should reject an assertion signed with `alg: none`', async function () {
      const grantType = newGrantType();

      try {
        await grantType.handle(confidentialRequest({ assertion: makeAssertion({ alg: 'none' }) }), CLIENT);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidGrantError);
      }
    });

    it('should reject an assertion signed with an HMAC algorithm', async function () {
      const grantType = newGrantType();

      try {
        await grantType.handle(confidentialRequest({ assertion: makeAssertion({ alg: 'HS256' }) }), CLIENT);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidGrantError);
      }
    });

    it('should reject an assertion whose `aud` does not match `tokenEndpointUri`', async function () {
      const grantType = newGrantType();

      try {
        await grantType.handle(
          confidentialRequest({ assertion: makeAssertion({ payload: { aud: 'https://someone-else.example.com' } }) }),
          CLIENT,
        );

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidGrantError);
      }
    });

    it('should reject an expired assertion', async function () {
      const grantType = newGrantType();
      const now = Math.floor(Date.now() / 1000);

      try {
        await grantType.handle(
          confidentialRequest({ assertion: makeAssertion({ payload: { exp: now - 1000, iat: now - 1300 } }) }),
          CLIENT,
        );

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidGrantError);
      }
    });

    it('should reject an assertion issued in the future beyond the clock-skew tolerance', async function () {
      const grantType = newGrantType();
      const now = Math.floor(Date.now() / 1000);

      try {
        await grantType.handle(
          confidentialRequest({ assertion: makeAssertion({ payload: { iat: now + 1000, exp: now + 1300 } }) }),
          CLIENT,
        );

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidGrantError);
      }
    });

    it('should accept an assertion just inside the configured clock-skew tolerance', async function () {
      const grantType = newGrantType({}, { idJagClockSkew: 120 });
      const now = Math.floor(Date.now() / 1000);
      const assertion = makeAssertion({ payload: { iat: now + 100, exp: now + 400 } });
      const data = await grantType.handle(confidentialRequest({ assertion }), CLIENT);

      data.accessToken.should.be.a('string');
    });

    it('should reject an assertion just outside the configured clock-skew tolerance', async function () {
      const grantType = newGrantType({}, { idJagClockSkew: 60 });
      const now = Math.floor(Date.now() / 1000);
      const assertion = makeAssertion({ payload: { iat: now + 100, exp: now + 400 } });

      try {
        await grantType.handle(confidentialRequest({ assertion }), CLIENT);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidGrantError);
      }
    });

    it('should reject an assertion not yet valid per its `nbf` claim', async function () {
      const grantType = newGrantType();
      const now = Math.floor(Date.now() / 1000);

      try {
        await grantType.handle(
          confidentialRequest({ assertion: makeAssertion({ payload: { nbf: now + 1000 } }) }),
          CLIENT,
        );

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidGrantError);
      }
    });

    it('should reject an assertion missing a required claim', async function () {
      const grantType = newGrantType();

      try {
        await grantType.handle(
          confidentialRequest({ assertion: makeAssertion({ payload: { jti: undefined } }) }),
          CLIENT,
        );

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidGrantError);
      }
    });

    it('should reject a tampered signature', async function () {
      const grantType = newGrantType();
      const validAssertion = makeAssertion();
      const tampered = `${validAssertion.slice(0, -4)}${validAssertion.slice(-4) === 'AAAA' ? 'BBBB' : 'AAAA'}`;

      try {
        await grantType.handle(confidentialRequest({ assertion: tampered }), CLIENT);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidGrantError);
      }
    });

    it('should reject an assertion from an untrusted issuer', async function () {
      const grantType = newGrantType({ getTrustedIssuer: async () => null });

      try {
        await grantType.handle(confidentialRequest({ assertion: makeAssertion() }), CLIENT);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidGrantError);
      }
    });

    it('should reject an assertion when the issuer key cannot be resolved', async function () {
      const grantType = newGrantType({ getRequestingIssuerKey: async () => null });

      try {
        await grantType.handle(confidentialRequest({ assertion: makeAssertion() }), CLIENT);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidGrantError);
      }
    });

    it('should reject an assertion whose `client_id` claim does not match the authenticated client', async function () {
      const grantType = newGrantType();

      try {
        await grantType.handle(
          confidentialRequest({ assertion: makeAssertion({ payload: { client_id: 'someone-else' } }) }),
          CLIENT,
        );

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidGrantError);
      }
    });

    it('should reject a replayed assertion (same `jti`) when using `validateJti()`', async function () {
      const seen = new Set();
      const grantType = newGrantType({
        validateJti: async (jti, issuer) => {
          const key = `${issuer}:${jti}`;

          if (seen.has(key)) {
            return false;
          }

          seen.add(key);
          return true;
        },
      });
      const assertion = makeAssertion();

      await grantType.handle(confidentialRequest({ assertion }), CLIENT);

      try {
        await grantType.handle(confidentialRequest({ assertion }), CLIENT);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidGrantError);
      }
    });

    it('should reject a replayed assertion (same `jti`) when using `isJtiUsed()`/`recordJti()`', async function () {
      const used = new Set();
      const model = baseModelImpl();

      delete model.validateJti;
      model.isJtiUsed = async (jti, issuer) => used.has(`${issuer}:${jti}`);
      model.recordJti = async (jti, issuer) => {
        used.add(`${issuer}:${jti}`);
      };

      const grantType = new JwtBearerGrantType({
        accessTokenLifetime: 120,
        model: Model.from(model),
        tokenEndpointUri: TOKEN_ENDPOINT_URI,
      });
      const assertion = makeAssertion();

      await grantType.handle(confidentialRequest({ assertion }), CLIENT);

      try {
        await grantType.handle(confidentialRequest({ assertion }), CLIENT);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidGrantError);
      }
    });

    it('should fail closed if the replay store throws', async function () {
      const grantType = newGrantType({
        validateJti: async () => {
          throw new Error('replay store is down');
        },
      });

      try {
        await grantType.handle(confidentialRequest({ assertion: makeAssertion() }), CLIENT);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidGrantError);
      }
    });

    it('should reject the request if no user can be resolved from the assertion', async function () {
      const grantType = newGrantType({ getUserFromIdJagAssertion: async () => null });

      try {
        await grantType.handle(confidentialRequest({ assertion: makeAssertion() }), CLIENT);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidGrantError);
      }
    });

    it('should reject the request if `validateIdJagPermission()` denies it', async function () {
      const grantType = newGrantType({ validateIdJagPermission: async () => false });

      try {
        await grantType.handle(confidentialRequest({ assertion: makeAssertion() }), CLIENT);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidGrantError);
      }
    });

    it('should pass the verified assertion payload to `validateIdJagPermission()`', async function () {
      let seenAssertion;
      const grantType = newGrantType({
        validateIdJagPermission: async (client, user, scope, assertion) => {
          seenAssertion = assertion;
          return true;
        },
      });

      await grantType.handle(confidentialRequest({ assertion: makeAssertion() }), CLIENT);

      seenAssertion.iss.should.equal(ISSUER);
      seenAssertion.client_id.should.equal(CLIENT_ID);
    });

    it('should intersect the requested scope with the scope granted by the assertion', async function () {
      const grantType = newGrantType();
      const assertion = makeAssertion({ payload: { scope: 'read write' } });
      const data = await grantType.handle(confidentialRequest({ assertion, scope: 'write' }), CLIENT);

      data.scope.should.eql(['write']);
    });

    it('should reject a request for scope broader than the assertion grants', async function () {
      const grantType = newGrantType();
      const assertion = makeAssertion({ payload: { scope: 'read' } });

      try {
        await grantType.handle(confidentialRequest({ assertion, scope: 'read write' }), CLIENT);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidScopeError);
      }
    });

    it('should use the assertion scope as-is when no scope is requested', async function () {
      const grantType = newGrantType();
      const assertion = makeAssertion({ payload: { scope: 'read write' } });
      const data = await grantType.handle(confidentialRequest({ assertion }), CLIENT);

      data.scope.should.eql(['read', 'write']);
    });

    it('should allow the requested scope through unnarrowed when the assertion carries no scope claim', async function () {
      const grantType = newGrantType();
      const assertion = makeAssertion({ payload: { scope: undefined } });
      const data = await grantType.handle(confidentialRequest({ assertion, scope: 'read' }), CLIENT);

      data.scope.should.eql(['read']);
    });

    it('should delegate to `model.validateScope()` after assertion-based narrowing', async function () {
      const grantType = newGrantType({
        validateScope: async (user, client, scope) => {
          scope.should.eql(['read']);
          return ['read:limited'];
        },
      });
      const assertion = makeAssertion({ payload: { scope: 'read' } });
      const data = await grantType.handle(confidentialRequest({ assertion }), CLIENT);

      data.scope.should.eql(['read:limited']);
    });
  });
});

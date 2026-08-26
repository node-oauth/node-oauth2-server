'use strict';

/**
 * JWT bearer authorization grant (RFC 7521 §4.1 / RFC 7523 §2.1/§3), driven
 * end-to-end through `OAuth2Server#token`.
 */

const OAuth2Server = require('../../..');
const Response = require('../../../lib/response');
const JwtBearerGrantType = require('../../../lib/grant-types/jwt-bearer-grant-type');
const createRequest = require('../../helpers/request');
const { SignJWT, generateKeyPair, exportJWK } = require('jose');

require('chai').should();

const GRANT_TYPE = JwtBearerGrantType.GRANT_TYPE;
const TOKEN_URL = 'https://as.example.com/oauth/token';
const ISSUER = 'https://idp.example.com';

describe('JWT bearer authorization grant integration', function () {
  const client = { id: 'client-1', grants: [GRANT_TYPE] };
  const clientNoGrant = { id: 'client-no-grant', grants: ['password'] };
  const user = { id: 'user-42' };
  const HMAC_ISSUER = 'https://hmac-idp.example.com';
  const HMAC_SECRET = 'issuer-shared-secret-value';

  let issuerPrivateKey;
  let jwks;
  let server;

  before(async function () {
    const { publicKey, privateKey } = await generateKeyPair('RS256');
    issuerPrivateKey = privateKey;
    const jwk = await exportJWK(publicKey);
    jwks = { keys: [{ ...jwk, kid: 'k1', alg: 'RS256', use: 'sig' }] };

    const model = {
      getClient: async (id) => {
        if (id === client.id) return client;
        if (id === clientNoGrant.id) return clientNoGrant;
        return undefined;
      },
      getJWTBearerIssuer: async (issuer) => {
        if (issuer === ISSUER) return { jwks, audience: TOKEN_URL };
        if (issuer === HMAC_ISSUER) return { secret: HMAC_SECRET, audience: TOKEN_URL };
        if (issuer === 'https://no-audience.example.com') return { jwks };
        if (issuer === 'https://empty-audience.example.com') return { jwks, audience: [] };
        if (issuer === 'https://no-keys.example.com') return { audience: TOKEN_URL };
        return undefined;
      },
      getJWTBearerUser: async ({ subject }) => (subject === user.id ? user : undefined),
      saveToken: async (token, tokenClient, tokenUser) => ({ ...token, client: tokenClient, user: tokenUser }),
      validateScope: async (u, c, scope) => scope,
    };

    server = new OAuth2Server({
      model,
      extendedGrantTypes: { [GRANT_TYPE]: JwtBearerGrantType },
      requireClientAuthentication: { [GRANT_TYPE]: false },
    });
  });

  function tokenRequest(assertion, extra) {
    return createRequest({
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: Object.assign(
        {
          grant_type: GRANT_TYPE,
          client_id: client.id,
          scope: 'read',
          assertion,
        },
        extra,
      ),
    });
  }

  function assertion(overrides = {}) {
    return new SignJWT({})
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
      .setIssuer(overrides.iss || ISSUER)
      .setSubject(overrides.sub || user.id)
      .setAudience(overrides.aud || TOKEN_URL)
      .setIssuedAt()
      .setExpirationTime(overrides.exp || '2m');
  }

  it('issues an access token (and no refresh token) for a valid assertion', async function () {
    const jwt = await assertion().sign(issuerPrivateKey);

    const token = await server.token(tokenRequest(jwt), new Response({}));

    token.accessToken.should.be.a('string');
    token.user.id.should.equal(user.id);
    token.client.id.should.equal(client.id);
    (token.scope || []).should.eql(['read']);
    (token.refreshToken === undefined).should.equal(true);
  });

  it('rejects an assertion from an untrusted issuer', async function () {
    const jwt = await assertion({ iss: 'https://evil.example.com' }).sign(issuerPrivateKey);

    await server
      .token(tokenRequest(jwt), new Response({}))
      .then(() => {
        throw new Error('should not issue a token');
      })
      .catch((e) => e.name.should.equal('invalid_grant'));
  });

  it('rejects an assertion with the wrong audience', async function () {
    const jwt = await assertion({ aud: 'https://attacker.example.com' }).sign(issuerPrivateKey);

    await server
      .token(tokenRequest(jwt), new Response({}))
      .then(() => {
        throw new Error('should not issue a token');
      })
      .catch((e) => e.name.should.equal('invalid_grant'));
  });

  it('rejects an expired assertion', async function () {
    const now = Math.floor(Date.now() / 1000);
    const jwt = await assertion({ exp: now - 300 }).sign(issuerPrivateKey);

    await server
      .token(tokenRequest(jwt), new Response({}))
      .then(() => {
        throw new Error('should not issue a token');
      })
      .catch((e) => e.name.should.equal('invalid_grant'));
  });

  it('rejects an assertion signed with the wrong key', async function () {
    const { privateKey: otherKey } = await generateKeyPair('RS256');
    const jwt = await assertion().sign(otherKey);

    await server
      .token(tokenRequest(jwt), new Response({}))
      .then(() => {
        throw new Error('should not issue a token');
      })
      .catch((e) => e.name.should.equal('invalid_grant'));
  });

  it('rejects an unauthorized subject', async function () {
    const jwt = await assertion({ sub: 'unknown-user' }).sign(issuerPrivateKey);

    await server
      .token(tokenRequest(jwt), new Response({}))
      .then(() => {
        throw new Error('should not issue a token');
      })
      .catch((e) => e.name.should.equal('invalid_grant'));
  });

  it('rejects a request without an `assertion`', async function () {
    await server
      .token(tokenRequest(undefined), new Response({}))
      .then(() => {
        throw new Error('should not issue a token');
      })
      .catch((e) => e.name.should.equal('invalid_request'));
  });

  it('issues a token for a client_secret_jwt (HMAC) issuer', async function () {
    const jwt = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer(HMAC_ISSUER)
      .setSubject(user.id)
      .setAudience(TOKEN_URL)
      .setIssuedAt()
      .setExpirationTime('2m')
      .sign(new TextEncoder().encode(HMAC_SECRET));

    const token = await server.token(tokenRequest(jwt), new Response({}));

    token.accessToken.should.be.a('string');
    token.user.id.should.equal(user.id);
  });

  it('returns server_error when the issuer has no configured audience', async function () {
    const jwt = await new SignJWT({})
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
      .setIssuer('https://no-audience.example.com')
      .setSubject(user.id)
      .setAudience(TOKEN_URL)
      .setIssuedAt()
      .setExpirationTime('2m')
      .sign(issuerPrivateKey);

    await server
      .token(tokenRequest(jwt), new Response({}))
      .then(() => {
        throw new Error('should not issue a token');
      })
      .catch((e) => e.name.should.equal('server_error'));
  });

  it('returns server_error when the issuer audience is an empty array', async function () {
    const jwt = await new SignJWT({})
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
      .setIssuer('https://empty-audience.example.com')
      .setSubject(user.id)
      .setAudience(TOKEN_URL)
      .setIssuedAt()
      .setExpirationTime('2m')
      .sign(issuerPrivateKey);

    await server
      .token(tokenRequest(jwt), new Response({}))
      .then(() => {
        throw new Error('should not issue a token');
      })
      .catch((e) => e.name.should.equal('server_error'));
  });

  it('returns server_error when the issuer has no keys', async function () {
    const jwt = await new SignJWT({})
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
      .setIssuer('https://no-keys.example.com')
      .setSubject(user.id)
      .setAudience(TOKEN_URL)
      .setIssuedAt()
      .setExpirationTime('2m')
      .sign(issuerPrivateKey);

    await server
      .token(tokenRequest(jwt), new Response({}))
      .then(() => {
        throw new Error('should not issue a token');
      })
      .catch((e) => e.name.should.equal('server_error'));
  });

  it('rejects a request without a client_id', async function () {
    const jwt = await assertion().sign(issuerPrivateKey);
    const request = createRequest({
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: { grant_type: GRANT_TYPE, scope: 'read', assertion: jwt },
    });

    await server
      .token(request, new Response({}))
      .then(() => {
        throw new Error('should not issue a token');
      })
      .catch((e) => e.name.should.equal('invalid_client'));
  });

  it('rejects a client not authorized for the grant', async function () {
    const jwt = await assertion().sign(issuerPrivateKey);

    await server
      .token(tokenRequest(jwt, { client_id: clientNoGrant.id }), new Response({}))
      .then(() => {
        throw new Error('should not issue a token');
      })
      .catch((e) => e.name.should.equal('unauthorized_client'));
  });

  it('rejects a malformed assertion', async function () {
    await server
      .token(tokenRequest('not-a-jwt'), new Response({}))
      .then(() => {
        throw new Error('should not issue a token');
      })
      .catch((e) => e.name.should.equal('invalid_grant'));
  });

  it('rejects an assertion missing the `iss` claim', async function () {
    const jwt = await new SignJWT({})
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
      .setSubject(user.id)
      .setAudience(TOKEN_URL)
      .setIssuedAt()
      .setExpirationTime('2m')
      .sign(issuerPrivateKey);

    await server
      .token(tokenRequest(jwt), new Response({}))
      .then(() => {
        throw new Error('should not issue a token');
      })
      .catch((e) => e.name.should.equal('invalid_grant'));
  });

  it('lets the model enforce replay via assertionId for assertions without a jti', async function () {
    const used = new Set();
    const replayServer = new OAuth2Server({
      model: {
        getClient: async () => client,
        getJWTBearerIssuer: async () => ({ jwks, audience: TOKEN_URL }),
        getJWTBearerUser: async ({ subject, assertionId }) => {
          if (used.has(assertionId)) return false;
          used.add(assertionId);
          return subject === user.id ? user : undefined;
        },
        saveToken: async (token, c, u) => ({ ...token, client: c, user: u }),
        validateScope: async (u, c, scope) => scope,
      },
      extendedGrantTypes: { [GRANT_TYPE]: JwtBearerGrantType },
      requireClientAuthentication: { [GRANT_TYPE]: false },
    });

    const jwt = await assertion().sign(issuerPrivateKey); // no jti

    await replayServer.token(tokenRequest(jwt), new Response({}));

    await replayServer
      .token(tokenRequest(jwt), new Response({}))
      .then(() => {
        throw new Error('replay should be rejected');
      })
      .catch((e) => e.name.should.equal('invalid_grant'));
  });

  describe('getKey()', function () {
    const grant = new JwtBearerGrantType({
      accessTokenLifetime: 120,
      model: { getJWTBearerIssuer() {}, getJWTBearerUser() {}, saveToken() {} },
    });

    it('derives an HMAC key from the issuer secret', async function () {
      (await grant.getKey({ secret: 'shhh' }, { alg: 'HS256' })).should.be.an.instanceOf(Uint8Array);
    });

    it('returns a lazy remote key resolver for a jwksUri issuer', async function () {
      (await grant.getKey({ jwksUri: 'https://issuer.example.com/jwks.json' }, { alg: 'RS256' })).should.be.a(
        'function',
      );
    });

    it('throws server_error when the issuer has no key material (HMAC alg)', async function () {
      await grant
        .getKey({}, { alg: 'HS256' })
        .then(() => {
          throw new Error('should throw');
        })
        .catch((e) => e.name.should.equal('server_error'));
    });

    it('throws server_error when the issuer has no key material (asymmetric alg)', async function () {
      await grant
        .getKey({}, { alg: 'RS256' })
        .then(() => {
          throw new Error('should throw');
        })
        .catch((e) => e.name.should.equal('server_error'));
    });

    it('rejects (invalid_grant) an HS256 assertion when the issuer is asymmetric-only', async function () {
      await grant
        .getKey({ jwks: { keys: [] } }, { alg: 'HS256' })
        .then(() => {
          throw new Error('should throw');
        })
        .catch((e) => e.name.should.equal('invalid_grant'));
    });

    it('rejects (invalid_grant) an RS256 assertion when the issuer is HMAC-only', async function () {
      await grant
        .getKey({ secret: 'shhh' }, { alg: 'RS256' })
        .then(() => {
          throw new Error('should throw');
        })
        .catch((e) => e.name.should.equal('invalid_grant'));
    });
  });

  describe('constructor and argument guards', function () {
    const okModel = { getJWTBearerIssuer() {}, getJWTBearerUser() {}, saveToken() {} };

    it('throws without a model', function () {
      (() => new JwtBearerGrantType({ accessTokenLifetime: 120 })).should.throw(/model/);
    });

    it('throws when the model lacks getJWTBearerIssuer', function () {
      (() =>
        new JwtBearerGrantType({
          accessTokenLifetime: 120,
          model: { getJWTBearerUser() {}, saveToken() {} },
        })).should.throw(/getJWTBearerIssuer/);
    });

    it('throws when the model lacks getJWTBearerUser', function () {
      (() =>
        new JwtBearerGrantType({
          accessTokenLifetime: 120,
          model: { getJWTBearerIssuer() {}, saveToken() {} },
        })).should.throw(/getJWTBearerUser/);
    });

    it('throws when the model lacks saveToken', function () {
      (() =>
        new JwtBearerGrantType({
          accessTokenLifetime: 120,
          model: { getJWTBearerIssuer() {}, getJWTBearerUser() {} },
        })).should.throw(/saveToken/);
    });

    it('rejects handle() without a request', async function () {
      const grant = new JwtBearerGrantType({ accessTokenLifetime: 120, model: okModel });
      await grant
        .handle(undefined, client)
        .then(() => {
          throw new Error('should reject');
        })
        .catch((e) => e.message.should.match(/request/));
    });

    it('rejects handle() without a client', async function () {
      const grant = new JwtBearerGrantType({ accessTokenLifetime: 120, model: okModel });
      await grant
        .handle({ body: {} }, undefined)
        .then(() => {
          throw new Error('should reject');
        })
        .catch((e) => e.message.should.match(/client/));
    });
  });
});

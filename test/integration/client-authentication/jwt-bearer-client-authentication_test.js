'use strict';

/**
 * JWT client authentication (RFC 7521 §4.2 / RFC 7523 §2.2 / §3), covering
 * both `private_key_jwt` (asymmetric) and `client_secret_jwt` (HMAC), driven
 * end-to-end through `OAuth2Server#token`.
 */

const OAuth2Server = require('../../..');
const Response = require('../../../lib/response');
const JwtBearerClientAuthentication = require('../../../lib/client-authentication/jwt-bearer-client-authentication');
const createRequest = require('../../helpers/request');
const { SignJWT, generateKeyPair, exportJWK } = require('jose');

require('chai').should();

const CLIENT_ASSERTION_TYPE = JwtBearerClientAuthentication.CLIENT_ASSERTION_TYPE;
const TOKEN_URL = 'https://as.example.com/oauth/token';

describe('JWT client authentication integration', function () {
  const rsaClient = { id: 'rsa-client', grants: ['client_credentials'] };
  const hmacClient = { id: 'hmac-client', grants: ['client_credentials'], secret: 'super-secret-shared-value' };
  const pinnedClient = {
    id: 'pinned-client',
    grants: ['client_credentials'],
    secret: 'pinned-hmac-secret',
    tokenEndpointAuthMethod: 'private_key_jwt',
  };
  const keylessClient = { id: 'keyless-client', grants: ['client_credentials'] };
  const user = { id: 'service-user' };

  let rsaPrivateKey;
  let server;

  before(async function () {
    const { publicKey, privateKey } = await generateKeyPair('RS256');
    rsaPrivateKey = privateKey;

    const jwk = await exportJWK(publicKey);
    rsaClient.jwks = { keys: [{ ...jwk, kid: 'k1', alg: 'RS256', use: 'sig' }] };
    pinnedClient.jwks = rsaClient.jwks;

    const model = {
      getClient: async (id) => {
        if (id === rsaClient.id) return rsaClient;
        if (id === hmacClient.id) return hmacClient;
        if (id === pinnedClient.id) return pinnedClient;
        if (id === keylessClient.id) return keylessClient;
        return undefined;
      },
      getUserFromClient: async () => user,
      saveToken: async (token, client, tokenUser) => ({ ...token, client, user: tokenUser }),
      validateScope: async (u, c, scope) => scope,
    };

    server = new OAuth2Server({
      model,
      extendedClientAuthentication: {
        jwt_bearer: new JwtBearerClientAuthentication({ audience: TOKEN_URL }),
      },
    });
  });

  function tokenRequest(clientAssertion, extra) {
    return createRequest({
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: Object.assign(
        {
          grant_type: 'client_credentials',
          scope: 'read',
          client_assertion_type: CLIENT_ASSERTION_TYPE,
          client_assertion: clientAssertion,
        },
        extra,
      ),
    });
  }

  function assertionFor(clientId) {
    return new SignJWT({})
      .setIssuer(clientId)
      .setSubject(clientId)
      .setAudience(TOKEN_URL)
      .setIssuedAt()
      .setExpirationTime('2m')
      .setJti('jti-' + clientId + '-' + process.hrtime.bigint().toString());
  }

  it('authenticates a client using private_key_jwt (RS256)', async function () {
    const assertion = await assertionFor(rsaClient.id)
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
      .sign(rsaPrivateKey);

    const token = await server.token(tokenRequest(assertion), new Response({}));

    token.accessToken.should.be.a('string');
    token.client.id.should.equal(rsaClient.id);
  });

  it('authenticates a client using client_secret_jwt (HS256)', async function () {
    const key = new TextEncoder().encode(hmacClient.secret);
    const assertion = await assertionFor(hmacClient.id).setProtectedHeader({ alg: 'HS256' }).sign(key);

    const token = await server.token(tokenRequest(assertion), new Response({}));

    token.client.id.should.equal(hmacClient.id);
  });

  it('rejects an assertion with the wrong audience', async function () {
    const assertion = await new SignJWT({})
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
      .setIssuer(rsaClient.id)
      .setSubject(rsaClient.id)
      .setAudience('https://attacker.example.com')
      .setIssuedAt()
      .setExpirationTime('2m')
      .sign(rsaPrivateKey);

    await server
      .token(tokenRequest(assertion), new Response({}))
      .then(() => {
        throw new Error('should not authenticate');
      })
      .catch((e) => e.name.should.equal('invalid_client'));
  });

  it('rejects an expired assertion', async function () {
    const now = Math.floor(Date.now() / 1000);
    const assertion = await new SignJWT({})
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
      .setIssuer(rsaClient.id)
      .setSubject(rsaClient.id)
      .setAudience(TOKEN_URL)
      .setIssuedAt(now - 600)
      .setExpirationTime(now - 300)
      .sign(rsaPrivateKey);

    await server
      .token(tokenRequest(assertion), new Response({}))
      .then(() => {
        throw new Error('should not authenticate');
      })
      .catch((e) => e.name.should.equal('invalid_client'));
  });

  it('rejects an assertion signed with the wrong key', async function () {
    const { privateKey: otherKey } = await generateKeyPair('RS256');
    const assertion = await assertionFor(rsaClient.id).setProtectedHeader({ alg: 'RS256', kid: 'k1' }).sign(otherKey);

    await server
      .token(tokenRequest(assertion), new Response({}))
      .then(() => {
        throw new Error('should not authenticate');
      })
      .catch((e) => e.name.should.equal('invalid_client'));
  });

  it('rejects a request presenting more than one client authentication mechanism', async function () {
    const assertion = await assertionFor(rsaClient.id)
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
      .sign(rsaPrivateKey);

    const request = tokenRequest(assertion, { client_id: rsaClient.id, client_secret: 'whatever' });

    await server
      .token(request, new Response({}))
      .then(() => {
        throw new Error('should not authenticate');
      })
      .catch((e) => e.name.should.equal('invalid_request'));
  });

  it('accepts a client pinned to private_key_jwt signing with its key', async function () {
    const assertion = await assertionFor(pinnedClient.id)
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
      .sign(rsaPrivateKey);

    const token = await server.token(tokenRequest(assertion), new Response({}));

    token.client.id.should.equal(pinnedClient.id);
  });

  it('rejects a client pinned to private_key_jwt that downgrades to client_secret_jwt', async function () {
    // A validly-signed HMAC assertion (client_secret_jwt) — rejected purely
    // because the client registered private_key_jwt.
    const key = new TextEncoder().encode(pinnedClient.secret);
    const assertion = await assertionFor(pinnedClient.id).setProtectedHeader({ alg: 'HS256' }).sign(key);

    await server
      .token(tokenRequest(assertion), new Response({}))
      .then(() => {
        throw new Error('should not authenticate');
      })
      .catch((e) => e.name.should.equal('invalid_client'));
  });

  describe('assertion error cases', function () {
    it('rejects a malformed client_assertion', async function () {
      await server
        .token(tokenRequest('not-a-jwt'), new Response({}))
        .then(() => {
          throw new Error('should not authenticate');
        })
        .catch((e) => e.name.should.equal('invalid_client'));
    });

    it('rejects an assertion missing the `sub` claim', async function () {
      const assertion = await new SignJWT({})
        .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
        .setIssuer(rsaClient.id)
        .setAudience(TOKEN_URL)
        .setIssuedAt()
        .setExpirationTime('2m')
        .sign(rsaPrivateKey);

      await server
        .token(tokenRequest(assertion), new Response({}))
        .then(() => {
          throw new Error('should not authenticate');
        })
        .catch((e) => e.name.should.equal('invalid_client'));
    });

    it('rejects when body `client_id` does not match the assertion subject', async function () {
      const assertion = await assertionFor(rsaClient.id)
        .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
        .sign(rsaPrivateKey);

      await server
        .token(tokenRequest(assertion, { client_id: 'someone-else' }), new Response({}))
        .then(() => {
          throw new Error('should not authenticate');
        })
        .catch((e) => e.name.should.equal('invalid_client'));
    });

    it('rejects a private_key_jwt assertion when the client has no registered keys', async function () {
      const assertion = await assertionFor(keylessClient.id)
        .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
        .sign(rsaPrivateKey);

      await server
        .token(tokenRequest(assertion), new Response({}))
        .then(() => {
          throw new Error('should not authenticate');
        })
        .catch((e) => e.name.should.equal('invalid_client'));
    });

    it('rejects a client_secret_jwt assertion when the client has no secret', async function () {
      const assertion = await assertionFor(keylessClient.id)
        .setProtectedHeader({ alg: 'HS256' })
        .sign(new TextEncoder().encode('whatever'));

      await server
        .token(tokenRequest(assertion), new Response({}))
        .then(() => {
          throw new Error('should not authenticate');
        })
        .catch((e) => e.name.should.equal('invalid_client'));
    });
  });

  describe('operational failures map to server_error', function () {
    it('returns server_error when key resolution fails operationally', async function () {
      const opServer = new OAuth2Server({
        model: {
          getClient: async () => rsaClient,
          getUserFromClient: async () => user,
          saveToken: async (token, c, u) => ({ ...token, client: c, user: u }),
          validateScope: async (u, c, scope) => scope,
        },
        extendedClientAuthentication: {
          jwt_bearer: new JwtBearerClientAuthentication({
            audience: TOKEN_URL,
            getKey: () => () => {
              throw new Error('jwks endpoint unreachable');
            },
          }),
        },
      });

      const assertion = await assertionFor(rsaClient.id)
        .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
        .sign(rsaPrivateKey);

      await opServer
        .token(tokenRequest(assertion), new Response({}))
        .then(() => {
          throw new Error('should not authenticate');
        })
        .catch((e) => e.name.should.equal('server_error'));
    });
  });

  describe('replay protection (jti)', function () {
    function jtiServer(jtiHooks) {
      return new OAuth2Server({
        model: Object.assign(
          {
            getClient: async () => rsaClient,
            getUserFromClient: async () => user,
            saveToken: async (token, c, u) => ({ ...token, client: c, user: u }),
            validateScope: async (u, c, scope) => scope,
          },
          jtiHooks,
        ),
        extendedClientAuthentication: {
          jwt_bearer: new JwtBearerClientAuthentication({ audience: TOKEN_URL }),
        },
      });
    }

    it('accepts an assertion once and rejects its replay', async function () {
      const used = new Set();
      const replayServer = jtiServer({
        isClientAssertionJtiUsed: async (jti) => used.has(jti),
        saveClientAssertionJti: async (jti) => {
          used.add(jti);
        },
      });
      const assertion = await assertionFor(rsaClient.id)
        .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
        .sign(rsaPrivateKey);

      await replayServer.token(tokenRequest(assertion), new Response({}));

      await replayServer
        .token(tokenRequest(assertion), new Response({}))
        .then(() => {
          throw new Error('replay should be rejected');
        })
        .catch((e) => e.name.should.equal('invalid_client'));
    });

    it('protects assertions without a `jti` via a signing-input fingerprint', async function () {
      const used = new Set();
      const replayServer = jtiServer({
        isClientAssertionJtiUsed: async (id) => used.has(id),
        saveClientAssertionJti: async (id) => {
          used.add(id);
        },
      });
      const assertion = await new SignJWT({})
        .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
        .setIssuer(rsaClient.id)
        .setSubject(rsaClient.id)
        .setAudience(TOKEN_URL)
        .setIssuedAt()
        .setExpirationTime('2m')
        .sign(rsaPrivateKey); // deliberately no jti

      await replayServer.token(tokenRequest(assertion), new Response({}));

      await replayServer
        .token(tokenRequest(assertion), new Response({}))
        .then(() => {
          throw new Error('replay should be rejected');
        })
        .catch((e) => e.name.should.equal('invalid_client'));
    });

    it('returns server_error when only one jti hook is implemented', async function () {
      const replayServer = jtiServer({ isClientAssertionJtiUsed: async () => false });
      const assertion = await assertionFor(rsaClient.id)
        .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
        .sign(rsaPrivateKey);

      await replayServer
        .token(tokenRequest(assertion), new Response({}))
        .then(() => {
          throw new Error('should not authenticate');
        })
        .catch((e) => e.name.should.equal('server_error'));
    });
  });
});

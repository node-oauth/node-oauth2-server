'use strict';

/**
 * Unit tests for the pluggable client-authentication layer: the built-in
 * adapters and the orchestrator's method selection. These replace the former
 * `TokenHandler#getClientCredentials` unit coverage and lock in the
 * selection/behaviour deltas introduced by the refactor.
 */

const {
  AbstractClientAuthentication,
  authenticateClient,
  defaultClientAuthenticationMethods,
  ClientSecretBasic,
  ClientSecretPost,
  None,
  JwtBearerClientAuthentication,
} = require('../../../lib/client-authentication');
const Response = require('../../../lib/response');
const createRequest = require('../../helpers/request');

require('chai').should();

function basicHeader(id, secret) {
  return 'Basic ' + Buffer.from(id + ':' + secret).toString('base64');
}

function clientWith(grants) {
  return { id: 'a', grants: grants || [] };
}

function authenticate(request, { model, methods, clientAuthenticationRequired = true, isPKCE = false } = {}) {
  return authenticateClient(request, new Response({}), {
    model,
    methods: methods || defaultClientAuthenticationMethods(),
    clientAuthenticationRequired,
    isPKCE,
  });
}

describe('Client authentication', function () {
  describe('built-in adapters', function () {
    it('client_secret_basic matches a Basic header and is credentialed', function () {
      const adapter = new ClientSecretBasic();
      adapter.requiresCredentials.should.equal(true);
      adapter.presentedMethod(createRequest({})).should.equal('client_secret_basic');
      adapter.matches(createRequest({ headers: { authorization: basicHeader('a', 'b') } })).should.equal(true);
      adapter.matches(createRequest({ headers: {} })).should.equal(false);
    });

    it('client_secret_post matches client_id + client_secret in the body', function () {
      const adapter = new ClientSecretPost();
      adapter.matches(createRequest({ body: { client_id: 'a', client_secret: 'b' } })).should.equal(true);
      adapter.matches(createRequest({ body: { client_id: 'a' } })).should.equal(false);
    });

    it('none is a public (non-credentialed) positive predicate on client_id', function () {
      const adapter = new None();
      adapter.requiresCredentials.should.equal(false);
      adapter.matches(createRequest({ body: { client_id: 'a' } })).should.equal(true);
      adapter.matches(createRequest({ body: {} })).should.equal(false);
    });
  });

  describe('selection', function () {
    it('authenticates via Basic auth', async function () {
      const client = clientWith();
      const model = { getClient: (id, secret) => (id === 'a' && secret === 'b' ? client : undefined) };
      const request = createRequest({ headers: { authorization: basicHeader('a', 'b') } });

      (await authenticate(request, { model })).should.equal(client);
    });

    it('authenticates via request-body credentials', async function () {
      const client = clientWith();
      const model = { getClient: (id, secret) => (id === 'a' && secret === 'b' ? client : undefined) };
      const request = createRequest({ body: { client_id: 'a', client_secret: 'b' } });

      (await authenticate(request, { model })).should.equal(client);
    });

    it('authenticates a public client for a PKCE request (no secret)', async function () {
      const client = clientWith();
      const model = { getClient: (id) => (id === 'a' ? client : undefined) };
      const request = createRequest({ body: { client_id: 'a', grant_type: 'authorization_code', code_verifier: 'x' } });

      (await authenticate(request, { model, isPKCE: true })).should.equal(client);
    });

    it('authenticates a public client when client authentication is not required', async function () {
      const client = clientWith();
      const model = { getClient: (id) => (id === 'a' ? client : undefined) };
      const request = createRequest({ body: { client_id: 'a', grant_type: 'password' } });

      (await authenticate(request, { model, clientAuthenticationRequired: false })).should.equal(client);
    });

    it('rejects more than one credentialed mechanism (Basic + body secret)', async function () {
      const model = { getClient: () => clientWith() };
      const request = createRequest({
        headers: { authorization: basicHeader('a', 'b') },
        body: { client_id: 'a', client_secret: 'b' },
      });

      await authenticate(request, { model })
        .then(() => {
          throw new Error('should not authenticate');
        })
        .catch((e) => e.name.should.equal('invalid_request'));
    });

    it('throws invalid_client when no credentials can be retrieved', async function () {
      const model = { getClient: () => clientWith() };
      const request = createRequest({ body: { grant_type: 'password' } });

      await authenticate(request, { model })
        .then(() => {
          throw new Error('should not authenticate');
        })
        .catch((e) => e.name.should.equal('invalid_client'));
    });

    it('sets WWW-Authenticate and a 401 when a Basic credential is invalid', async function () {
      const model = { getClient: () => undefined };
      const request = createRequest({ headers: { authorization: basicHeader('a', 'bad') } });
      const response = new Response({});

      await authenticateClient(request, response, {
        model,
        methods: defaultClientAuthenticationMethods(),
        clientAuthenticationRequired: true,
        isPKCE: false,
      })
        .then(() => {
          throw new Error('should not authenticate');
        })
        .catch((e) => {
          e.name.should.equal('invalid_client');
          e.code.should.equal(401);
          response.get('WWW-Authenticate').should.equal('Basic realm="Service"');
        });
    });

    it('validates the client `grants` shape', async function () {
      const model = { getClient: () => ({ id: 'a' }) };
      const request = createRequest({ body: { client_id: 'a', client_secret: 'b' } });

      await authenticate(request, { model })
        .then(() => {
          throw new Error('should not authenticate');
        })
        .catch((e) => {
          e.name.should.equal('server_error');
          e.message.should.equal('Server error: missing client `grants`');
        });
    });

    it('rejects an authentication method the client has not registered', async function () {
      const client = { id: 'a', grants: [], tokenEndpointAuthMethod: 'client_secret_basic' };
      const model = { getClient: () => client };
      const request = createRequest({ body: { client_id: 'a', client_secret: 'b' } });

      await authenticate(request, { model })
        .then(() => {
          throw new Error('should not authenticate');
        })
        .catch((e) => {
          e.name.should.equal('invalid_client');
          e.message.should.match(/not a permitted authentication method/);
        });
    });

    it('accepts the authentication method the client registered', async function () {
      const client = { id: 'a', grants: [], tokenEndpointAuthMethod: 'client_secret_basic' };
      const model = { getClient: () => client };
      const request = createRequest({ headers: { authorization: basicHeader('a', 'b') } });

      (await authenticate(request, { model })).should.equal(client);
    });
  });

  describe('JwtBearerClientAuthentication', function () {
    it('requires an `audience` to be configured', function () {
      (function () {
        new JwtBearerClientAuthentication();
      }).should.throw(/audience/);
    });

    it('matches a JWT client assertion and is credentialed', function () {
      const adapter = new JwtBearerClientAuthentication({ audience: 'https://as.example.com/token' });
      adapter.requiresCredentials.should.equal(true);
      adapter
        .matches(
          createRequest({
            body: {
              client_assertion: 'x.y.z',
              client_assertion_type: JwtBearerClientAuthentication.CLIENT_ASSERTION_TYPE,
            },
          }),
        )
        .should.equal(true);
      adapter.matches(createRequest({ body: { client_assertion: 'x.y.z' } })).should.equal(false);
    });
  });

  describe('AbstractClientAuthentication (port)', function () {
    it('defaults requiresCredentials to true and throws for unimplemented members', async function () {
      const port = new AbstractClientAuthentication();

      port.requiresCredentials.should.equal(true);
      (() => port.matches(createRequest({}))).should.throw(/must implement/);
      (() => port.presentedMethod(createRequest({}))).should.throw(/must implement/);

      await port
        .authenticate(createRequest({}), {})
        .then(() => {
          throw new Error('should reject');
        })
        .catch((e) => e.message.should.match(/must implement/));
    });
  });

  describe('None adapter resolution', function () {
    it('rejects an invalid `client_id` format', async function () {
      await new None()
        .authenticate(createRequest({ body: { client_id: 'øå€£‰' } }), {
          model: { getClient: async () => ({ grants: [] }) },
        })
        .then(() => {
          throw new Error('should not resolve');
        })
        .catch((e) => {
          e.name.should.equal('invalid_request');
          e.message.should.equal('Invalid parameter: `client_id`');
        });
    });

    it('rejects when the client cannot be found', async function () {
      await new None()
        .authenticate(createRequest({ body: { client_id: 'a' } }), { model: { getClient: async () => undefined } })
        .then(() => {
          throw new Error('should not resolve');
        })
        .catch((e) => e.name.should.equal('invalid_client'));
    });
  });

  describe('JwtBearerClientAuthentication.defaultGetKey()', function () {
    const adapter = new JwtBearerClientAuthentication({ audience: 'https://as.example.com/token' });

    it('derives an HMAC key from the client secret', async function () {
      const key = await adapter.defaultGetKey({ secret: 'shhh' }, { alg: 'HS256' });
      key.should.be.an.instanceOf(Uint8Array);
    });

    it('rejects an HMAC assertion when the client has no usable secret', async function () {
      await adapter
        .defaultGetKey({ secret: 123 }, { alg: 'HS256' })
        .then(() => {
          throw new Error('should throw');
        })
        .catch((e) => e.name.should.equal('invalid_client'));
    });

    it('returns a lazy remote key resolver for a jwksUri client', async function () {
      const resolver = await adapter.defaultGetKey(
        { jwksUri: 'https://client.example.com/jwks.json' },
        { alg: 'RS256' },
      );
      resolver.should.be.a('function');
    });

    it('rejects an asymmetric assertion when the client has no keys', async function () {
      await adapter
        .defaultGetKey({}, { alg: 'RS256' })
        .then(() => {
          throw new Error('should throw');
        })
        .catch((e) => e.name.should.equal('invalid_client'));
    });
  });
});

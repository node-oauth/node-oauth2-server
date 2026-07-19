'use strict';

/**
 * Minimal Express server demonstrating the built-in `jwt-bearer` (ID-JAG)
 * grant: it acts as the Resource Authorization Server side of a Cross App
 * Access exchange, consuming an ID-JAG assertion minted by an external
 * Identity Provider and exchanging it for a locally-scoped access token.
 *
 * This example is standalone and NOT part of the library's own dependency
 * tree — it requires `express` to run:
 *
 *   npm install express
 *   node examples/express-id-jag-server.js
 *
 * It then mints a self-signed test assertion and exchanges it, so it can be
 * run end-to-end with no external IdP.
 */

const crypto = require('crypto');
const express = require('express');
const OAuth2Server = require('../index');
const Request = require('../lib/request');
const Response = require('../lib/response');

const TOKEN_ENDPOINT_URI = 'https://rs.example.com';

/*
 * In a real deployment `getRequestingIssuerKey` would resolve the IdP's
 * public key from a JWKS endpoint (with caching), not from an in-memory
 * map keyed by a hardcoded issuer/kid pair.
 */
const { publicKey: idpPublicKey, privateKey: idpPrivateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const TRUSTED_ISSUER = 'https://idp.example.com';
const IDP_KEY_ID = 'idp-key-1';

const clients = new Map([['my-client', { id: 'my-client', secret: 'my-secret', grants: ['urn:ietf:params:oauth:grant-type:jwt-bearer'] }]]);
const usedJti = new Set();
const issuedTokens = new Map();

const model = {
  async getClient(clientId, clientSecret) {
    const client = clients.get(clientId);

    if (!client || (clientSecret && client.secret !== clientSecret)) {
      return null;
    }

    return client;
  },

  async saveToken(token, client, user) {
    const saved = { ...token, client, user };

    issuedTokens.set(token.accessToken, saved);
    return saved;
  },

  async getTrustedIssuer(issuer) {
    return issuer === TRUSTED_ISSUER ? { name: 'Example Corp IdP' } : null;
  },

  async getRequestingIssuerKey(issuer, kid) {
    if (issuer !== TRUSTED_ISSUER || kid !== IDP_KEY_ID) {
      return null;
    }

    return idpPublicKey.export({ format: 'jwk' });
  },

  async getUserFromIdJagAssertion(issuer, subject) {
    // Map the federated subject to a local user record.
    return { id: subject, issuer };
  },

  async validateIdJagPermission(client, user, scope) {
    // Apply your own authorization policy here.
    return true;
  },

  async validateJti(jti, issuer, exp) {
    const key = `${issuer}:${jti}`;

    if (usedJti.has(key)) {
      return false;
    }

    usedJti.add(key);
    return true;
  },
};

const oauth = new OAuth2Server({ model, tokenEndpointUri: TOKEN_ENDPOINT_URI });

const app = express();

app.use(express.urlencoded({ extended: false }));

app.post('/token', async (req, res) => {
  const request = new Request(req);
  const response = new Response(res);

  try {
    const token = await oauth.token(request, response);

    res.status(response.status).json(token);
  } catch (err) {
    res.status(err.code || 500).json({ error: err.name, error_description: err.message });
  }
});

/**
 * Mints a self-signed ID-JAG-shaped assertion for demonstration purposes.
 * A real IdP would produce this via RFC 8693 Token Exchange.
 */
function mintExampleAssertion(clientId, subject) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'oauth-id-jag+jwt', kid: IDP_KEY_ID };
  const payload = {
    iss: TRUSTED_ISSUER,
    sub: subject,
    aud: TOKEN_ENDPOINT_URI,
    client_id: clientId,
    jti: crypto.randomUUID(),
    iat: now,
    exp: now + 300,
  };
  const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const signingInput = `${encode(header)}.${encode(payload)}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(signingInput), idpPrivateKey);

  return `${signingInput}.${signature.toString('base64url')}`;
}

if (require.main === module) {
  const server = app.listen(0, async () => {
    const { port } = server.address();
    const assertion = mintExampleAssertion('my-client', 'alice@example.com');

    const body = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    });

    const response = await fetch(`http://localhost:${port}/token`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        authorization: `Basic ${Buffer.from('my-client:my-secret').toString('base64')}`,
      },
      body,
    });

    console.log(`POST /token -> ${response.status}`);
    console.log(await response.json());

    server.close();
  });
}

module.exports = { app, model, mintExampleAssertion };

/**
 * 4.4.  Client Credentials Grant
 *
 *    The client can request an access token using only its client
 *    credentials (or other supported means of authentication) when the
 *    client is requesting access to the protected resources under its
 *    control, or those of another resource owner that have been previously
 *    arranged with the authorization server (the method of which is beyond
 *    the scope of this specification).
 *
 *    The client credentials grant type MUST only be used by confidential
 *    clients.
 *
 *    @see https://www.rfc-editor.org/rfc/rfc6749#section-4.4
 */

const OAuth2Server = require('../..');
const DB = require('../helpers/db');
const createModel = require('../helpers/model');
const createRequest = require('../helpers/request');
const Response = require('../../lib/response');

require('chai').should();

const db = new DB();
// this user represents requests in the name of an external server
// TODO: we should discuss, if we can make user optional for client credential workflows
//   as it's not desired to have an extra fake-user representing a server just to pass validation
const userDoc = { id: 'machine2-123456789', name: 'machine2' };
db.saveUser(userDoc);

const oAuth2Server = new OAuth2Server({
  model: {
    ...createModel(db),
    getUserFromClient: async function (_client) {
      // in a machine2machine setup we might not have a dedicated "user"
      // but we need to return a truthy response to
      const client = db.findClient(_client.id, _client.secret);
      return client && { ...userDoc };
    }
  }
});

const clientDoc = db.saveClient({
  id: 'client-credential-test-client',
  secret: 'client-credential-test-secret',
  grants: ['client_credentials']
});

const enabledScope = 'read write';

describe('ClientCredentials Workflow Compliance (4.4)', function () {
  describe('Access Token Request (4.4.1)', function () {
    /**
     * 4.4.2.  Access Token Request
     *
     *    The client makes a request to the token endpoint by adding the
     *    following parameters using the "application/x-www-form-urlencoded"
     *    format per Appendix B with a character encoding of UTF-8 in the HTTP
     *    request entity-body:
     *
     *    grant_type
     *          REQUIRED.  Value MUST be set to "client_credentials".
     *
     *    scope
     *          OPTIONAL.  The scope of the access request as described by
     *          Section 3.3.
     *
     *    The client MUST authenticate with the authorization server as
     *    described in Section 3.2.1.
     */
    it('authenticates the client with valid credentials', async function () {
      const response = new Response();
      const request = createRequest({
        body: {
          grant_type: 'client_credentials',
          scope: enabledScope
        },
        headers: {
          'authorization': 'Basic ' + Buffer.from(clientDoc.id + ':' + clientDoc.secret).toString('base64'),
          'content-type': 'application/x-www-form-urlencoded'
        },
        method: 'POST',
      });

      const token = await oAuth2Server.token(request, response);

      response.status.should.equal(200);
      response.headers.should.deep.equal( { 'cache-control': 'no-store', pragma: 'no-cache' });
      response.body.token_type.should.equal('Bearer');
      response.body.access_token.should.equal(token.accessToken);
      response.body.expires_in.should.be.a('number');
      response.body.scope.should.equal(enabledScope);
      ('refresh_token' in response.body).should.equal(false);

      token.accessToken.should.be.a('string');
      token.accessTokenExpiresAt.should.be.a('date');
      ('refreshToken' in token).should.equal(false);
      ('refreshTokenExpiresAt' in token).should.equal(false);
      token.scope.should.equal(enabledScope);

      db.accessTokens.has(token.accessToken).should.equal(true);
      db.refreshTokens.has(token.refreshToken).should.equal(false);
    });

    /**
     * 7.  Accessing Protected Resources
     *
     *    The client accesses protected resources by presenting the access
     *    token to the resource server.  The resource server MUST validate the
     *    access token and ensure that it has not expired and that its scope
     *    covers the requested resource.  The methods used by the resource
     *    server to validate the access token (as well as any error responses)
     *    are beyond the scope of this specification but generally involve an
     *    interaction or coordination between the resource server and the
     *    authorization server.
     */
    it('enables an authenticated request using the access token', async function () {
      const [accessToken] = [...db.accessTokens.entries()][0];
      const response = new Response();
      const request = createRequest({
        query:  {},
        headers: {
          'authorization': `Bearer ${accessToken}`
        },
        method: 'GET',
      });

      const token = await oAuth2Server.authenticate(request, response);
      token.accessToken.should.equal(accessToken);
      token.user.should.deep.equal(userDoc);
      token.client.should.deep.equal(clientDoc);
      token.scope.should.equal(enabledScope);

      response.status.should.equal(200);
      // there should be no information in the response as it
      // should only add information, if permission is denied
      response.body.should.deep.equal({});
      response.headers.should.deep.equal({});
    });
  });
});
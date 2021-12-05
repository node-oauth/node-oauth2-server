const OAuth2Server = require('../../../');
const db = require('./db');
const model = require('./model');
const Request = require('../../../lib/request');
const Response = require('../../../lib/response');

require('chai').should();

const auth = new OAuth2Server({
  model: model
});

const user = db.saveUser({ id: 1, username: 'test', password: 'test'});
const client = db.saveClient({ id: 'a', secret: 'b', grants: ['password'] });
const scope = 'read write';

function createDefaultRequest () {
  const request = new Request({
    body: {
      grant_type: 'password',
      client_id: client.id,
      client_secret: client.secret,
      username: user.username,
      password: user.password,
      scope
    },
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    method: 'POST',
    query: {}
  });

  request.is = function (header) {
    return this.headers['content-type'] === header;
  };

  return request;
}

describe('PasswordGrantType Integration Flow', function () {
  describe('Authenticate', function () {

    it ('Succesfull authentication', async function () {
      const request = createDefaultRequest();
      const response = new Response({});

      const token = await auth.token(request, response, {});
      response.body.token_type.should.equal('Bearer');
      response.body.access_token.should.equal(token.accessToken);
      response.body.refresh_token.should.equal(token.refreshToken);
      response.body.expires_in.should.be.a('number');
      response.body.scope.should.equal(scope);

      token.accessToken.should.be.a('string');
      token.refreshToken.should.be.a('string');
      token.accessTokenExpiresAt.should.be.a('date');
      token.refreshTokenExpiresAt.should.be.a('date');
      token.scope.should.equal(scope);

      db.accessTokens.has(token.accessToken).should.equal(true);
      db.refreshTokens.has(token.refreshToken).should.equal(true);
    });

    it ('Username missing', async function () {
      const request = createDefaultRequest();
      const response = new Response({});

      delete request.body.username;

      await auth.token(request, response, {})
        .catch(err => {
          err.name.should.equal('invalid_request');
        });
    });

    it ('Password missing', async function () {
      const request = createDefaultRequest();
      const response = new Response({});

      delete request.body.password;

      await auth.token(request, response, {})
        .catch(err => {
          err.name.should.equal('invalid_request');
        });
    });

    it ('Wrong username', async function () {
      const request = createDefaultRequest();
      const response = new Response({});

      request.body.username = 'wrong';

      await auth.token(request, response, {})
        .catch(err => {
          err.name.should.equal('invalid_grant');
        });
    });

    it ('Wrong password', async function () {
      const request = createDefaultRequest();
      const response = new Response({});

      request.body.password = 'wrong';

      await auth.token(request, response, {})
        .catch(err => {
          err.name.should.equal('invalid_grant');
        });
    });

    it ('Client not found', async function () {
      const request = createDefaultRequest();
      const response = new Response({});

      request.body.client_id = 'wrong';

      await auth.token(request, response, {})
        .catch(err => {
          err.name.should.equal('invalid_client');
        });
    });

    it ('Client secret not required', async function () {
      const request = createDefaultRequest();
      const response = new Response({});

      delete request.body.client_secret;

      const token = await auth.token(request, response, {
        requireClientAuthentication: {
          password: false
        }
      });

      token.accessToken.should.be.a('string');
    });

    it ('Client secret required', async function () {
      const request = createDefaultRequest();
      const response = new Response({});

      delete request.body.client_secret;

      await auth.token(request, response, {
        requireClientAuthentication: {
          password: false
        }
      })
        .catch(err => {
          err.name.should.equal('invalid_client');
        });
    });
  });
});

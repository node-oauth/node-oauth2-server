'use strict';

/*
 * Module dependencies.
 */
const Request = require('../../../lib/request');
const Model = require('../../../lib/model');
const RevokeHandler = require('../../../lib/handlers/revoke-handler');
const sinon = require('sinon');
const InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
const InvalidClientError = require('../../../lib/errors/invalid-client-error');
const InvalidRequestError = require('../../../lib/errors/invalid-request-error');
const should = require('chai').should();

/**
 * Test `TokenHandler`.
 */

describe('RevokeHandler', () => {
  describe('constructor()', () => {
    it('should throw an error if `model` is missing', () => {
      (() => {
        new RevokeHandler({});
      }).should.throw(InvalidArgumentError, 'Missing parameter: `model`');
    });
    it('should throw an error if `model` does not implement `getClient()`', () => {
      (() => {
        new RevokeHandler({ model: {} });
      }).should.throw(InvalidArgumentError, 'Invalid argument: model does not implement `getClient()`');
    });
    it('should throw an error if `model` does not implement `revokeToken()`', () => {
      (() => {
        new RevokeHandler({
          model: {
            getClient: () => {}
          }
        });
      }).should.throw(InvalidArgumentError, 'Invalid argument: model does not implement `revokeToken()`');
    });
  });
  describe('getClient()', () => {
    it('should call `model.getClient()`', async () => {
      const model = Model.from({
        getClient: sinon.stub().returns({ grants: ['password'] }),
        saveToken: () => {
        },
        revokeToken: () => {
        }
      });
      const handler = new RevokeHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({
        body: { client_id: 12345, client_secret: 'secret' },
        headers: {},
        method: {},
        query: {}
      });

      await handler.getClient(request);
      model.getClient.callCount.should.equal(1);
      model.getClient.firstCall.args.should.have.length(2);
      model.getClient.firstCall.args[0].should.equal(12345);
      model.getClient.firstCall.args[1].should.equal('secret');
      model.getClient.firstCall.thisValue.should.equal(model);
    });
    it('throws an error if the client is invalid', async () => {
      const model = Model.from({
        getClient: sinon.stub().returns(null),
        saveToken: () => {
        },
        revokeToken: () => {
        }
      });
      const handler = new RevokeHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({
        body: { client_id: 12345, client_secret: 'secret' },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await handler.getClient(request);
        should.fail();
      } catch (e) {
        e.should.be.instanceOf(InvalidClientError);
        e.message.should.equal('Invalid client: client is invalid');
      }
    });
    it('throws an error if client id is using invalid chars', async () => {
      const model = Model.from({
        getClient: sinon.stub().returns({ grants: ['password'] }),
        saveToken: () => {
        },
        revokeToken: () => {
        }
      });
      const handler = new RevokeHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({
        body: { client_id: '12😵345', client_secret: 'secret' },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await handler.getClient(request);
        should.fail();
      } catch (e) {
        e.should.be.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `client_id`');
      }
    });
    it ('throws an error if client_secret is usind invalid chars', async () => {
      const model = Model.from({
        getClient: sinon.stub().returns({ grants: ['password'] }),
        saveToken: () => {
        },
        revokeToken: () => {
        }
      });
      const handler = new RevokeHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({
        body: { client_id: '12345', client_secret: 'sec😵ret' },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await handler.getClient(request);
        should.fail();
      } catch (e) {
        e.should.be.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `client_secret`');
      }
    });
  });
  describe('getClientCredentials()', () => {
    it('should throw an error if client credentials are missing on confidential clients', async () => {
      const model = Model.from({
        getClient: sinon.stub().returns({ grants: ['client_credentials'] }),
        saveToken: () => {
        },
        revokeToken: () => {
        }
      });
      const handler = new RevokeHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      try {
        await handler.getClientCredentials(request);
        should.fail();
      } catch (e) {
        e.should.be.instanceOf(InvalidClientError);
        e.message.should.equal('Invalid client: cannot retrieve client credentials');
      }
    });
  });
  describe('updateSuccessResponse', () => {
    it('updates the response with success information', () => {
      const model = Model.from({
        getClient: sinon.stub().returns({ grants: ['password'] }),
        saveToken: () => {
        },
        revokeToken: () => {
        }
      });
      const handler = new RevokeHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const response = {
        set: sinon.spy()
      };

      handler.updateSuccessResponse(response);
      response.body.should.deep.equal({});
      response.status.should.equal(200);
      response.set.callCount.should.equal(2);
      response.set.firstCall.args.should.have.length(2);
      response.set.firstCall.args[0].should.equal('Cache-Control');
      response.set.firstCall.args[1].should.equal('no-store');
      response.set.secondCall.args.should.have.length(2);
      response.set.secondCall.args[0].should.equal('Pragma');
      response.set.secondCall.args[1].should.equal('no-cache');
    });
  });
  describe('updateErrorResponse', () => {
    it('updates the response with error information', () => {
      const model = Model.from({
        getClient: sinon.stub().returns({ grants: ['password'] }),
        saveToken: () => {
        },
        revokeToken: () => {
        }
      });
      const handler = new RevokeHandler({ model: model });
      const response = {
        set: sinon.spy()
      };

      handler.updateErrorResponse(response, new InvalidRequestError('Invalid request 123'));
      response.body.should.deep.equal({
        error: 'invalid_request',
        error_description: 'Invalid request 123'
      });
      response.status.should.equal(400);
    });
  });
  describe('getToken', () => {
    const model = Model.from({
      getClient: () => {},
      saveToken: () => {},
      revokeToken: () => {}
    });
    const handler = new RevokeHandler({ model});

    it('throws an error if the token is missing');
    it('throws an error if the token is in an invalid format', () => {
      const missing = [false, null, undefined, '', 0];
      missing.forEach((token) => {
        try {
          handler.getToken({ body: { token } });
          should.fail();
        } catch (e) {
          e.should.be.instanceOf(InvalidRequestError);
          e.message.should.equal('Missing parameter: `token`');
        }
      });
      const invalid = ['123❤️45', {}, [], true];
      invalid.forEach((token) => {
        try {
          handler.getToken({ body: { token } });
          should.fail();
        } catch (e) {
          e.should.be.instanceOf(InvalidRequestError);
          e.message.should.equal('Invalid parameter: `token`');
        }
      });
    });
    it('returns the token and token_type_hint from the request body, if defined and valid', () => {

      const token = '123445';
      const invalid = [undefined, null, 'invalid', 'refresh-token', 'access-token'];
      invalid.forEach((tokenTypeHint) => {
        const result = handler.getToken({ body: { token, token_type_hing: tokenTypeHint } });
        result.token.should.equal(token);
        should.equal(result.tokenTypeHint, undefined);
      });

      const valid = ['access_token', 'refresh_token'];
      valid.forEach((tokenTypeHint) => {
        const result = handler.getToken({ body: { token, token_type_hint: tokenTypeHint } });
        result.token.should.equal(token);
        result.tokenTypeHint.should.equal(tokenTypeHint);
      });
    });
  });
  describe('revokeToken', () => {
    it('it ignores invalid token_type_hint values');
    it('it revokes access tokens when token_type_hint is access_token');
    it('it revokes refresh tokens when token_type_hint is refresh_token');
    it('it revokes tokens without a token_type_hint');
    it('it does not revoke tokens belonging to other clients');
    it('it does not throw an error if the token to be revoked is not found');
  });
});
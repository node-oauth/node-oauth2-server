'use strict';

/**
 * Module dependencies.
 */

const Request = require('../../../lib/request');
const Model = require('../../../lib/model');
const TokenHandler = require('../../../lib/handlers/token-handler');
const sinon = require('sinon');
const should = require('chai').should();

/**
 * Test `TokenHandler`.
 */

describe('TokenHandler', function () {
  describe('getClient()', function () {
    it('should call `model.getClient()` with the provided secret', function () {
      const model = Model.from({
        getClient: sinon.stub().returns({ grants: ['password'] }),
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { client_id: 12345, client_secret: 'secret' },
        headers: {},
        method: {},
        query: {},
      });

      return handler
        .getClient(request)
        .then(function () {
          model.getClient.callCount.should.equal(1);
          model.getClient.firstCall.args.should.have.length(2);
          model.getClient.firstCall.args[0].should.equal(12345);
          model.getClient.firstCall.args[1].should.equal('secret');
          model.getClient.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);
    });

    it('should call `model.getClient()` when no client secret is provided (public client)', function () {
      const model = Model.from({
        getClient: sinon.stub().returns({ grants: ['authorization_code'], type: 'public' }),
        saveToken: function () {},
      });
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { client_id: 'foo', grant_type: 'authorization_code' },
        headers: {},
        method: {},
        query: {},
      });

      return handler
        .getClient(request)
        .then(function () {
          model.getClient.callCount.should.equal(1);
          model.getClient.firstCall.args[0].should.equal('foo');
          should.equal(model.getClient.firstCall.args[1], null);
        })
        .catch(should.fail);
    });
  });
});

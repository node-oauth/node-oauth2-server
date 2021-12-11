'use strict';

/**
 * Module dependencies.
 */

const PasswordGrantType = require('../../../lib/grant-types/password-grant-type');
const Request = require('../../../lib/request');
const sinon = require('sinon');
const should = require('chai').should();

/**
 * Test `PasswordGrantType`.
 */

describe('PasswordGrantType', function() {

  describe('getUser()', function() {

    it('should call `model.getUser()`', async function() {
      const user = {};
      const model = {
        getUser: sinon.stub().resolves(user),
        saveToken: function() {}
      };

      const handler = new PasswordGrantType({
        accessTokenLifetime: 120,
        model: model
      });

      const request = new Request({
        body: { username: 'foo', password: 'bar' },
        headers: {},
        method: {},
        query: {}
      });

      let res;

      try {
        res = await handler.getUser(request);
      } catch (err) {
        should.fail(err);
      }
      should.exist(res);
      res.should.eql(user);
      model.getUser.callCount.should.equal(1);
      model.getUser.firstCall.args.should.have.length(2);
      model.getUser.firstCall.args[0].should.equal('foo');
      model.getUser.firstCall.args[1].should.equal('bar');
      model.getUser.firstCall.thisValue.should.equal(model);

    });
  });

  describe('saveToken()', function() {

    it('should call `model.saveToken()`', async function() {

      const client = {};
      const user = {};
      
      const model = {
        getUser: sinon.stub().resolves(user),
        saveToken: sinon.stub().resolves(true)
      };
      const handler = new PasswordGrantType({
        accessTokenLifetime: 120,
        model: model
      });

      sinon.stub(handler, 'validateScope').resolves('foobar');
      sinon.stub(handler, 'generateAccessToken').resolves('foo');
      sinon.stub(handler, 'generateRefreshToken').resolves('bar');
      sinon.stub(handler, 'getAccessTokenExpiresAt').resolves('biz');
      sinon.stub(handler, 'getRefreshTokenExpiresAt').resolves('baz');

      let res;

      try {
        res = await handler.saveToken(user, client, 'foobar');
      } catch (err) {
        should.fail(err);
      }

      should.exist(res);
      res.should.eql(true);

      model.saveToken.callCount.should.equal(1);
      model.saveToken.firstCall.args.should.have.length(3);
      model.saveToken.firstCall.args[0].should.eql({ 
        accessToken: 'foo',
        accessTokenExpiresAt: 'biz',
        refreshToken: 'bar',
        refreshTokenExpiresAt: 'baz',
        scope: 'foobar'
      });
      model.saveToken.firstCall.args[1].should.equal(client);
      model.saveToken.firstCall.args[2].should.equal(user);
      model.saveToken.firstCall.thisValue.should.equal(model);

    });

  });
});

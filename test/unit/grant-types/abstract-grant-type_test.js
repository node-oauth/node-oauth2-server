'use strict';

/**
 * Module dependencies.
 */

const AbstractGrantType = require('../../../lib/grant-types/abstract-grant-type');
const sinon = require('sinon');
const should = require('chai').should();

/**
 * Test `AbstractGrantType`.
 */

describe('AbstractGrantType', function() {

  describe('generateAccessToken()', function() {

    it('should generate an random access token dispite function not being provided', async function() {

      const abstractGrantType = new AbstractGrantType(
        {
          accessTokenLifetime: 120,
          model: {}
        }
      );

      let accessToken;

      try {
        accessToken = await abstractGrantType.generateAccessToken();
      } catch (err) {
        should.not.exist(err, err.stack);
      }

      should.exist(accessToken);
      accessToken.should.be.a.sha256();

    });

    it('should generate an access token', async function() {

      const token = (new Date().getTime()).toString(36);
      const model = {
        generateAccessToken: sinon.stub().resolves(token)
      };
      const abstractGrantType = new AbstractGrantType(
        {
          accessTokenLifetime: 120,
          model: model
        }
      );

      let accessToken;

      try {
        accessToken = await abstractGrantType.generateAccessToken();
      } catch (err) {
        should.not.exist(err, err.stack);
      }

      should.exist(accessToken);
      accessToken.should.eql(token.toString());
      model.generateAccessToken.callCount.should.equal(1);
      model.generateAccessToken.firstCall.thisValue.should.equal(model);

    });

  });

  describe('generateRefreshToken()', function() {

    it('should generate an random refresh token dispite function not being provided', async function() {

      const abstractGrantType = new AbstractGrantType(
        {
          accessTokenLifetime: 120,
          model: {}
        }
      );

      let refreshToken;

      try {
        refreshToken = await abstractGrantType.generateRefreshToken();
      } catch (err) {
        should.not.exist(err, err.stack);
      }

      should.exist(refreshToken);
      refreshToken.should.be.a.sha256();

    });

    it('should generate a refresh token', async function() {

      const token = (new Date().getTime()).toString(36);
      const model = {
        generateRefreshToken: sinon.stub().resolves(token)
      };
      const abstractGrantType = new AbstractGrantType(
        {
          accessTokenLifetime: 120,
          model: model
        }
      );

      let refreshToken;

      try {
        refreshToken = await abstractGrantType.generateRefreshToken();
      } catch (err) {
        should.not.exist(err, err.stack);
      }

      should.exist(refreshToken);
      refreshToken.should.eql(token.toString());
      model.generateRefreshToken.callCount.should.equal(1);
      model.generateRefreshToken.firstCall.thisValue.should.equal(model);

    });

  });


  describe('validateScope()', function() {

    it('should validate scope since model has no validate scope function', async function() {

      const abstractGrantType = new AbstractGrantType(
        {
          accessTokenLifetime: 120,
          model: {}
        }
      );

      let success;

      try {
        success = await abstractGrantType.validateScope();
      } catch (err) {
        should.not.exist(err, err.stack);
      }

      should.exist(success);
      success.should.be.eql(true);

    });

    it('should validate scope', async function() {

      const model = {
        validateScope: sinon.stub().resolves(true)
      };
      const abstractGrantType = new AbstractGrantType(
        {
          accessTokenLifetime: 120,
          model: model
        }
      );

      let success;

      try {
        success = await abstractGrantType.validateScope();
      } catch (err) {
        should.not.exist(err, err.stack);
      }

      should.exist(success);
      success.should.eql(true);
      model.validateScope.callCount.should.equal(1);
      model.validateScope.firstCall.thisValue.should.equal(model);

    });

  });

});

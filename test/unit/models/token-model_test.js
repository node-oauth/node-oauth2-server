const TokenModel = require('../../../lib/models/token-model');
const InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
const should = require('chai').should();
/**
 * Test `Server`.
 */

describe('TokenModel', function() {
  describe('constructor()', function() {
    it('throws, if data is empty', function () {
      try {
        new TokenModel();
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `accessToken`');
      }
    });
    it('throws, if `accessToken` is missing', function () {
      const atExpiresAt = new Date();
      atExpiresAt.setHours(new Date().getHours() + 1);

      const data = {
        client: 'bar',
        user: 'tar',
        accessTokenExpiresAt: atExpiresAt
      };

      try {
        new TokenModel(data);
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `accessToken`');
      }
    });
    it('throws, if `client` is missing', function () {
      const atExpiresAt = new Date();
      atExpiresAt.setHours(new Date().getHours() + 1);

      const data = {
        accessToken: 'foo',
        user: 'tar',
        accessTokenExpiresAt: atExpiresAt
      };

      try {
        new TokenModel(data);
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `client`');
      }
    });
    it('throws, if `user` is missing', function () {
      const atExpiresAt = new Date();
      atExpiresAt.setHours(new Date().getHours() + 1);

      const data = {
        accessToken: 'foo',
        client: 'bar',
        accessTokenExpiresAt: atExpiresAt
      };

      try {
        new TokenModel(data);
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `user`');
      }
    });
    it('throws, if `accessTokenExpiresAt` is not a Date', function () {
      const data = {
        accessToken: 'foo',
        client: 'bar',
        user: 'tar',
        accessTokenExpiresAt: '11/10/2023'
      };

      try {
        new TokenModel(data);
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid parameter: `accessTokenExpiresAt`');
      }
    });
    it('throws, if `refreshTokenExpiresAt` is not a Date', function () {
      const data = {
        accessToken: 'foo',
        client: 'bar',
        user: 'tar',
        refreshTokenExpiresAt: '11/10/2023'
      };

      try {
        new TokenModel(data);
        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid parameter: `refreshTokenExpiresAt`');
      }
    });
    it('should calculate `accessTokenLifetime` if `accessTokenExpiresAt` is set', function() {
      const atExpiresAt = new Date();
      atExpiresAt.setHours(new Date().getHours() + 1);
  
      const data = {
        accessToken: 'foo',
        client: 'bar',
        user: 'tar',
        accessTokenExpiresAt: atExpiresAt
      };
  
      const model = new TokenModel(data);
      should.exist(model.accessTokenLifetime);
      model.accessTokenLifetime.should.a('number');
      model.accessTokenLifetime.should.be.approximately(3600, 2);
    });

    it('should throw if the required arguments are not provided', () => {
      should.throw(() => {
        new TokenModel({});
      });
    });

    it('should ignore custom attributes if allowExtendedTokenAttributes is not specified as true', () => {
      const model = new TokenModel({
        accessToken: 'token',
        client: 'client',
        user: 'user',
        myCustomAttribute: 'myCustomValue'
      });

      should.not.exist(model['myCustomAttribute']);
      should.not.exist(model['customAttributes']);
    });

    it('should set custom attributes on the customAttributes field if allowExtendedTokenAttributes is specified as true', () => {
      const model = new TokenModel({
        accessToken: 'token',
        client: 'client',
        user: 'user',
        myCustomAttribute: 'myCustomValue'
      }, {
        allowExtendedTokenAttributes: true
      });

      should.not.exist(model['myCustomAttribute']);
      model['customAttributes'].should.be.an('object');
      model['customAttributes']['myCustomAttribute'].should.equal('myCustomValue');
    });
  });
});

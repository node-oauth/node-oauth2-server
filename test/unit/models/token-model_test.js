const TokenModel = require('../../../lib/models/token-model');
const should = require('chai').should();
/**
 * Test `Server`.
 */

describe('Model', function() {
  describe('constructor()', function() {
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

'use strict';

/**
 * Module dependencies.
 */

var should = require('chai').should();
var TokenUtil = require('../../../lib/utils/token-util');

/**
 * Test `TokenUtil` integration.
 */
describe('TokenUtil integration', function() {

  describe('generateRandomToken()', function() {

    it('should return a sha-256 token', async function() {

      let token;

      try {
        token = await TokenUtil.generateRandomToken();
      } catch (err) {
        should.not.exist(err, err.stack);
      }

      should.exist(token);
      token.should.be.a.sha256();

    });

  });

});
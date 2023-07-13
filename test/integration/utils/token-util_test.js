'use strict';

/**
 * Module dependencies.
 */

const TokenUtil = require('../../../lib/utils/token-util');

/**
 * Test `TokenUtil` integration.
 */

describe('TokenUtil integration', function() {
  describe('generateRandomToken()', function() {
    it('should return a sha-256 token', async function() {
      const token = await TokenUtil.generateRandomToken();
      token.should.be.a.sha256();
    });
  });
});

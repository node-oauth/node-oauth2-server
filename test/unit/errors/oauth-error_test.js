'use strict';

/**
 * Module dependencies.
 */

const { describe, it } = require('mocha');
const should = require('chai').should();
const OAuthError = require('../../../lib/errors/oauth-error');

/**
 * Test `OAuthError`.
 */

describe('OAuthError', function() {
  describe('constructor()', function() {
    it('should get `captureStackTrace`', function() {

      const errorFn = function () { throw new OAuthError('test', {name: 'test_error'}); };

      try {
        errorFn();

        should.fail();
      } catch (e) {

        e.should.be.an.instanceOf(OAuthError);
        e.message.should.equal('test');
        e.code.should.equal(500);
        e.stack.should.not.be.null;
        e.stack.should.not.be.undefined;
        e.stack.should.include('oauth-error_test.js');
        e.stack.should.include('19'); //error lineNUmber
      }
    });
  });
});

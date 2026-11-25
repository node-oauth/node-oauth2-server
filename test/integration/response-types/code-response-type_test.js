'use strict';

/**
 * Module dependencies.
 */

const CodeResponseType = require('../../../lib/response-types/code-response-type');
const InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
const should = require('chai').should();
const sinon = require('sinon');
const url = require('url');

/**
 * Test `CodeResponseType` integration.
 */

describe('CodeResponseType integration', function () {
  describe('constructor()', function () {
    it('should throw an error if `code` is missing', function () {
      try {
        new CodeResponseType();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `code`');
      }
    });

    it('should set the `code`', function () {
      const responseType = new CodeResponseType('foo');

      responseType.code.should.equal('foo');
    });
  });

  describe('buildRedirectUri()', function () {
    it('should throw an error if the `redirectUri` is missing', function () {
      const responseType = new CodeResponseType('foo');

      try {
        responseType.buildRedirectUri();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `redirectUri`');
      }
    });

    it('should return the new redirect uri and set the `code` and `state` in the query', function () {
      const responseType = new CodeResponseType('foo');
      const redirectUri = responseType.buildRedirectUri('http://example.com/cb');

      url.format(redirectUri).should.equal('http://example.com/cb?code=foo');
    });

    it('should return the new redirect uri and append the `code` and `state` in the query', function () {
      const responseType = new CodeResponseType('foo');
      const redirectUri = responseType.buildRedirectUri('http://example.com/cb?foo=bar');

      url.format(redirectUri).should.equal('http://example.com/cb?foo=bar&code=foo');
    });

    it('should throw an error if the `redirectUri` is not an absolute URI', function () {
      const responseType = new CodeResponseType('foo');

      try {
        responseType.buildRedirectUri('/cb');

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid parameter: `redirectUri`');
      }
    });

    it('should not call the deprecated url.parse()', function () {
      const parse = sinon.spy(url, 'parse');

      try {
        new CodeResponseType('foo').buildRedirectUri('http://example.com/cb?foo=bar');
        parse.called.should.equal(false);
      } finally {
        parse.restore();
      }
    });
  });
});

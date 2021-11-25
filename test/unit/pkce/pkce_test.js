'use strict';

/**
 * Module dependencies.
 */

const pkce = require('../../../lib/pkce/pkce');
const should = require('chai').should();
const { base64URLEncode } = require('../../../lib/utils/string-util');
const { createHash } = require('../../../lib/utils/crypto-util');

describe('PKCE', function() {
  describe(pkce.isPKCERequest.name, function () {
    it('returns, whether parameters define a PKCE request', function () {
      [
        [true, 'authorization_code', 'foo'],
        [true, 'authorization_code', '123123123123123123123123123123123123123123123'],
        [false, 'authorization_code', ''],
        [false, 'authorization_code', undefined],
        [false, 'foo_code', '123123123123123123123123123123123123123123123'],
        [false, '', '123123123123123123123123123123123123123123123'],
        [false, undefined, '123123123123123123123123123123123123123123123'],
        [false, 'foo_code', 'bar']
      ].forEach(triple => {
        should.equal(triple[0], pkce.isPKCERequest({
          grantType: triple[1],
          codeVerifier: triple[2]
        }));
      });
    });
  });
  describe(pkce.codeChallengeMatchesABNF.name, function () {
    it('returns whether a string matches the criteria for codeChallenge', function () {
      [
        [false, undefined],
        [false, null],
        [false, ''],
        [false, '123123123112312312311231231231123123123112'], // too short
        [false, '123123123112312312311231231231123123123112+'], // invalid chars
        [false, '123123123112312312311231231231123123123112312312311231231231123123123112312312311231231231123123123112312312311231231231123123123'], // too long
        // invalid chars
        [true, '-_.~abcdefghijklmnopqrstuvwxyz0123456789ABCDEFHIJKLMNOPQRSTUVWXYZ'],
      ].forEach(pair => {
        should.equal(pair[0], pkce.codeChallengeMatchesABNF(pair[1]));
      });
    });
  });
  describe(pkce.getHashForCodeChallenge.name, function () {
    it('returns nothing if method is not valid', function () {
      const verifier = '-_.~abcdefghijklmnopqrstuvwxyz0123456789ABCDEFHIJKLMNOPQRSTUVWXYZ';

      [
        [undefined, undefined, verifier],
        [undefined, null, verifier],
        [undefined, '', verifier],
        [undefined, 'foo', verifier],
      ].forEach(triple => {
        should.equal(triple[0], pkce.getHashForCodeChallenge({
          method: triple[1],
          verifier: triple[2],
        }));
      });
    });
    it('return the verifier on plain and undefined on S256 if verifier is falsy', function () {
      [
        [undefined, 'plain', undefined],
        [undefined, 'S256', undefined],
        [undefined, 'plain', ''],
        [undefined, 'S256', ''],
        [undefined, 'plain', null],
        [undefined, 'S256', null],
      ].forEach(triple => {
        should.equal(triple[0], pkce.getHashForCodeChallenge({
          method: triple[1],
          verifier: triple[2],
        }));
      });
    });
    it('returns the unhashed verifier when method is plain', function () {
      const verifier = '-_.~abcdefghijklmnopqrstuvwxyz0123456789ABCDEFHIJKLMNOPQRSTUVWXYZ';
      const hash = pkce.getHashForCodeChallenge({ method: 'plain', verifier });
      should.equal(hash, verifier);
    });
    it('returns the hash verifier when method is S256', function () {
      const verifier = '-_.~abcdefghijklmnopqrstuvwxyz0123456789ABCDEFHIJKLMNOPQRSTUVWXYZ';
      const hash = pkce.getHashForCodeChallenge({ method: 'S256', verifier });
      const expectedHash = base64URLEncode(createHash({ data: verifier }));
      should.equal(hash, expectedHash);
    });
  });
  describe(pkce.isValidMethod.name, function () {
    it('returns if a method is plain or S256', function () {
      should.equal(pkce.isValidMethod('plain'), true);
      should.equal(pkce.isValidMethod('S256'), true);
      should.equal(pkce.isValidMethod('foo'), false);
      should.equal(pkce.isValidMethod(), false);
    });
  });
});

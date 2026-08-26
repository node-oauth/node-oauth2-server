'use strict';

const jws = require('../../../lib/utils/jws-util');

require('chai').should();

describe('jws-util', function () {
  describe('isHmac()', function () {
    it('is true for HS* algorithms and false otherwise', function () {
      jws.isHmac('HS256').should.equal(true);
      jws.isHmac('HS512').should.equal(true);
      jws.isHmac('RS256').should.equal(false);
      jws.isHmac('EdDSA').should.equal(false);
      jws.isHmac(undefined).should.equal(false);
    });
  });

  describe('algorithmsForHeader()', function () {
    it('returns the HMAC family for an HMAC header', function () {
      jws.algorithmsForHeader({ alg: 'HS256' }).should.equal(jws.HMAC_ALGS);
    });

    it('returns the asymmetric family otherwise', function () {
      jws.algorithmsForHeader({ alg: 'RS256' }).should.equal(jws.ASYMMETRIC_ALGS);
      jws.algorithmsForHeader({ alg: 'EdDSA' }).should.equal(jws.ASYMMETRIC_ALGS);
    });
  });

  describe('isValidationError()', function () {
    it('is true for a jose assertion-validation error code', function () {
      jws.isValidationError({ code: 'ERR_JWT_EXPIRED' }).should.equal(true);
      jws.isValidationError({ code: 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED' }).should.equal(true);
    });

    it('is false for operational/unknown errors', function () {
      jws.isValidationError({ code: 'ECONNREFUSED' }).should.equal(false);
      jws.isValidationError(new Error('boom')).should.equal(false);
      jws.isValidationError(null).should.equal(false);
    });
  });

  describe('getRemoteJwks()', function () {
    it('memoizes the remote JWK set per URI (no fetch on creation)', function () {
      const a1 = jws.getRemoteJwks('https://issuer.example.com/jwks.json');
      const a2 = jws.getRemoteJwks('https://issuer.example.com/jwks.json');
      const b = jws.getRemoteJwks('https://other.example.com/jwks.json');

      a1.should.be.a('function');
      a1.should.equal(a2);
      a1.should.not.equal(b);
    });
  });

  describe('replayId()', function () {
    it('returns the jti when present', function () {
      jws.replayId('aaa.bbb.ccc', 'the-jti').should.equal('the-jti');
    });

    it('fingerprints the signing input (ignoring the signature) when jti is absent', function () {
      const a = jws.replayId('aaa.bbb.ccc');
      const sameInput = jws.replayId('aaa.bbb.a-different-signature');
      const otherInput = jws.replayId('aaa.xxx.ccc');

      a.should.be.a('string');
      a.should.equal(sameInput); // signature-independent — defeats ECDSA malleability replay
      a.should.not.equal(otherInput); // a different signing input yields a different id
    });
  });
});

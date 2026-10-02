const crypto = require('crypto');
const jwtUtil = require('../../../lib/utils/jwt-util');
const InvalidRequestError = require('../../../lib/errors/invalid-request-error');
require('chai').should();

function base64url(input) {
  return Buffer.from(JSON.stringify(input)).toString('base64url');
}

describe('JwtUtil', function () {
  describe('decodeJwt()', function () {
    it('should decode a well-formed compact JWT', function () {
      const header = { alg: 'RS256', typ: 'oauth-id-jag+jwt' };
      const payload = { sub: 'user-1' };
      const token = `${base64url(header)}.${base64url(payload)}.signature`;

      const decoded = jwtUtil.decodeJwt(token);

      decoded.header.should.deep.equal(header);
      decoded.payload.should.deep.equal(payload);
      decoded.signingInput.should.equal(`${base64url(header)}.${base64url(payload)}`);
    });

    it('should throw InvalidRequestError if the token is not a string', function () {
      (() => jwtUtil.decodeJwt(123)).should.throw(InvalidRequestError);
    });

    it('should throw InvalidRequestError if the token does not have 3 parts', function () {
      (() => jwtUtil.decodeJwt('a.b')).should.throw(InvalidRequestError);
    });

    it('should throw InvalidRequestError if any part is empty', function () {
      (() => jwtUtil.decodeJwt('a..c')).should.throw(InvalidRequestError);
    });

    it('should throw InvalidRequestError if the header is not valid JSON', function () {
      const badHeader = Buffer.from('not-json').toString('base64url');
      const payload = base64url({ sub: 'user-1' });

      (() => jwtUtil.decodeJwt(`${badHeader}.${payload}.sig`)).should.throw(InvalidRequestError);
    });

    it('should throw InvalidRequestError if the payload is not valid JSON', function () {
      const header = base64url({ alg: 'RS256' });
      const badPayload = Buffer.from('not-json').toString('base64url');

      (() => jwtUtil.decodeJwt(`${header}.${badPayload}.sig`)).should.throw(InvalidRequestError);
    });
  });

  describe('verifySignature()', function () {
    it('should return false if `alg` is not in `allowedAlgorithms`', function () {
      const { publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
      const key = jwtUtil.toPublicKeyObject(publicKey.export({ format: 'jwk' }));

      jwtUtil.verifySignature('input', Buffer.from('sig'), 'RS256', key, ['ES256']).should.equal(false);
    });

    it('should return false for `alg: none`', function () {
      const { publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
      const key = jwtUtil.toPublicKeyObject(publicKey.export({ format: 'jwk' }));

      jwtUtil.verifySignature('input', Buffer.from('sig'), 'none', key, ['none', 'RS256']).should.equal(false);
    });

    it('should return true for a valid RS256 signature and false once tampered', function () {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
      const key = jwtUtil.toPublicKeyObject(publicKey.export({ format: 'jwk' }));
      const signingInput = 'header.payload';
      const signature = crypto.sign('RSA-SHA256', Buffer.from(signingInput), privateKey);

      jwtUtil.verifySignature(signingInput, signature, 'RS256', key, ['RS256']).should.equal(true);

      const tampered = Buffer.from(signature);
      tampered[0] ^= 0xff;

      jwtUtil.verifySignature(signingInput, tampered, 'RS256', key, ['RS256']).should.equal(false);
    });

    it('should return true for a valid ES256 signature', function () {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
      const key = jwtUtil.toPublicKeyObject(publicKey.export({ format: 'jwk' }));
      const signingInput = 'header.payload';
      const signature = crypto.sign(null, Buffer.from(signingInput), { key: privateKey, dsaEncoding: 'ieee-p1363' });

      jwtUtil.verifySignature(signingInput, signature, 'ES256', key, ['ES256']).should.equal(true);
    });

    it('should return true for a valid PS256 signature', function () {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
      const key = jwtUtil.toPublicKeyObject(publicKey.export({ format: 'jwk' }));
      const signingInput = 'header.payload';
      const signature = crypto.sign('sha256', Buffer.from(signingInput), {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
      });

      jwtUtil.verifySignature(signingInput, signature, 'PS256', key, ['PS256']).should.equal(true);
    });

    it('should return false, not throw, for malformed key/signature material', function () {
      const { publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
      const key = jwtUtil.toPublicKeyObject(publicKey.export({ format: 'jwk' }));

      jwtUtil.verifySignature('input', Buffer.from([1, 2, 3]), 'RS256', key, ['RS256']).should.equal(false);
    });
  });

  describe('toPublicKeyObject()', function () {
    it('should pass through an existing KeyObject', function () {
      const { publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });

      jwtUtil.toPublicKeyObject(publicKey).should.equal(publicKey);
    });

    it('should parse a PEM string', function () {
      const { publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
      const pem = publicKey.export({ type: 'spki', format: 'pem' });

      jwtUtil.toPublicKeyObject(pem).should.be.an.instanceOf(crypto.KeyObject);
    });

    it('should parse a JWK object', function () {
      const { publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
      const jwk = publicKey.export({ format: 'jwk' });

      jwtUtil.toPublicKeyObject(jwk).should.be.an.instanceOf(crypto.KeyObject);
    });

    it('should throw for unresolvable key material', function () {
      (() => jwtUtil.toPublicKeyObject(42)).should.throw('Unresolvable signing key');
    });
  });
});

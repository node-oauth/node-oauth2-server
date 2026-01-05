const cryptoUtil = require('../../../lib/utils/crypto-util');
require('chai').should();

describe(cryptoUtil.createHash.name, function () {
  it('creates a hash by given algorithm', function () {
    const data = 'client-credentials-grant';
    const hash = cryptoUtil.createHash({ data, output: 'hex' });
    hash.should.equal('072726830f0aadd2d91f86f53e3a7ef40018c2626438152dd576e272bf2b8e60');
  });
  it('should throw if data is missing', function () {
    try {
      cryptoUtil.createHash({});
    } catch (e) {
      e.should.be.instanceOf(TypeError);
      e.message.should.include('he "data" argument must be of type string or an instance of Buffer, TypedArray, or DataView.');
    }
  });
});

const dateUtil = require('../../../lib/utils/date-util');

const sinon = require('sinon');
require('chai').should();

describe('DateUtil', function() {
  describe('getLifetimeFromExpiresAt', () => {
    const now = new Date('2023-01-01T00:00:00.000Z');

    beforeEach(() => {
      sinon.useFakeTimers(now);
    });

    it('should convert a valid expiration date into seconds from now', () => {
      const expiresAt = new Date('2023-01-01T00:00:10.000Z');
      const lifetime = dateUtil.getLifetimeFromExpiresAt(expiresAt);

      lifetime.should.be.a('number');
      lifetime.should.be.approximately(10, 2);
    });

    afterEach(() => {
      sinon.restore();
    });
  });
});

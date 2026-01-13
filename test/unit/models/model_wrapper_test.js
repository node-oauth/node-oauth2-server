const Model = require('../../../lib/model');
const {expect} = require('chai');

describe('ModelWrapper', () => {
  const expectThrows = async (fn) => {
    try {
      await fn();
      expect.fail();
    } catch (e) {
      expect(e.message).to.include('not implemented');
    }
  };
  it('throws on all functions when used via constructor', async () => {
    const m = new Model();
    await expectThrows(() => m.generateAccessToken());
    await expectThrows(() => m.generateAuthorizationCode());
    await expectThrows(() => m.generateRefreshToken());
    await expectThrows(() => m.getAccessToken());
    await expectThrows(() => m.getAuthorizationCode());
    await expectThrows(() => m.getClient());
    await expectThrows(() => m.getRefreshToken());
    await expectThrows(() => m.getUser());
    await expectThrows(() => m.getUserFromClient());
    await expectThrows(() => m.revokeAuthorizationCode());
    await expectThrows(() => m.revokeToken());
    await expectThrows(() => m.saveAuthorizationCode());
    await expectThrows(() => m.saveToken());
    await expectThrows(() => m.verifyScope());
    await expectThrows(() => m.validateRedirectUri());
    await expectThrows(() => m.validateScope());

  });
});
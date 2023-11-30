const { parseScope } = require('../../../lib/utils/scope-util');
const should = require('chai').should();

describe(parseScope.name, () => {
  it('should return undefined on nullish values', () => {
    const values = [undefined, null];
    values.forEach(str => {
      const compare = parseScope(str) === undefined;
      compare.should.equal(true);
    });
  });
  it('should throw on non-string values', () => {
    const invalid = [1, -1, true, false, {}, ['foo'], [], () => {}, Symbol('foo')];
    invalid.forEach(str => {
      try {
        parseScope(str);
        should.fail();
      } catch (e) {
        e.message.should.eql('Invalid parameter: `scope`');
      }
    });
  });
  it('should throw on empty strings', () => {
    const invalid = ['', ' ', '      ', '\n', '\t', '\r'];
    invalid.forEach(str => {
      try {
        parseScope(str);
        should.fail();
      } catch (e) {
        e.message.should.eql('Invalid parameter: `scope`');
      }
    });
  });
  it('should split space-delimited strings into arrays', () => {
    const values = [
      ['foo', ['foo']],
      ['foo bar', ['foo', 'bar']],
      ['foo       bar', ['foo', 'bar']],
    ];
    values.forEach(([str, compare]) => {
      const parsed = parseScope(str);
      parsed.should.deep.equal(compare);
    });
  });
});
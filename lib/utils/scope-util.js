const isFormat = require('@node-oauth/formats');
const InvalidScopeError = require('../errors/invalid-scope-error');
const toArray = s => Array.isArray(s) ? s : s.split(' ');

module.exports = {
  parseScope: function (requestedScope) {
    if (typeof requestedScope === 'undefined' || requestedScope === null) {
      return undefined;
    }

    const internalScope = toArray(requestedScope);

    if (internalScope.length === 0) {
      throw new InvalidScopeError('Invalid parameter: `scope`');
    }

    internalScope.forEach(value => {
      if (!isFormat.nqschar(value)) {
        throw new InvalidScopeError('Invalid parameter: `scope`');
      }
    });

    return internalScope;
  }
};

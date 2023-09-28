const isFormat = require('@node-oauth/formats');
const InvalidScopeError = require('../errors/invalid-scope-error');

module.exports = {
  parseScope: function (requestedScope) {
    if (!isFormat.nqschar(requestedScope)) {
      throw new InvalidScopeError('Invalid parameter: `scope`');
    }

    if (requestedScope == null) {
      return undefined;
    }

    return requestedScope.split(' ');
  }
};

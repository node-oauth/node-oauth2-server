const isFormat = require('@node-oauth/formats');
const InvalidScopeError = require('../errors/invalid-scope-error');

module.exports = {
  parseScope: function (requestedScope) {
    // XXX: isFormat.nqschar will trat Arrays of strings like String,
    // thus we additionally check, whether incoming scopes are Arrays
    if (!isFormat.nqschar(requestedScope) || Array.isArray(requestedScope)) {
      throw new InvalidScopeError('Invalid parameter: `scope`');
    }

    if (requestedScope == null) {
      return undefined;
    }

    return requestedScope.split(' ');
  }
};

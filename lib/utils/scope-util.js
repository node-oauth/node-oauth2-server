const isFormat = require('@node-oauth/formats');
const InvalidScopeError = require('../errors/invalid-scope-error');
const whiteSpace = /\s+/g;

/**
 * @module ScopeUtil
 */

/**
 * Utility to parse and validate a scope string.
 * Uses `isFormat` from {@link https://github.com/node-oauth/formats} to
 * validate scopes against `nqchar` format.
 *
 * @function
 * @param requestedScope {string|undefined|null}
 * @throws {InvalidScopeError} if the type is not null, undefined or a string.
 * @return {undefined|string[]}
 * @see {https://github.com/node-oauth/formats}
 */
function parseScope (requestedScope) {
  if (requestedScope == null) {
    return undefined;
  }

  if (typeof requestedScope !== 'string') {
    throw new InvalidScopeError('Invalid parameter: `scope`');
  }

  // XXX: this prevents spaced-only strings to become
  // treated as valid nqchar by making them empty strings
  requestedScope = requestedScope.trim();

  if(!isFormat.nqschar(requestedScope)) {
    throw new InvalidScopeError('Invalid parameter: `scope`');
  }

  return requestedScope.split(whiteSpace);
}

module.exports = { parseScope };

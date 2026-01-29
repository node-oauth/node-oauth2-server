'use strict';

/**
 * @module ParamUtil
 */

/**
 * Create a function to check, whether a value is one of the given types.
 * @param types {...string[]}
 * @return {function(*): boolean}
 */
function isInTypes (...types) {
  return function (value) {
    return types.includes(typeof value);
  };
}

/**
 * Check if a value is defined (not missing)
 * @param value
 * @return {boolean}
 */
function isDefined (value) {
  // TODO: in future versions, consider changing this to `value !== undefined && value !== null && value !== ''`,
  //   which might be a breaking changes for some users
  return !!value;
}

/**
 * Safely converts a value to a string in the following order:
 * - If the value is already a string, return it.
 * - If the value has a `toString` method, call it and return the result.
 * - If the value is `null` or `undefined`, return an empty string.
 * - Otherwise, use the global `String` function to convert the value.
 * @param value {*}
 * @return {string}
 */
function toString(value) {
  if (typeof value === 'string') {
    return value;
  }

  if (Object.prototype.hasOwnProperty.call(value, 'toString')) {
    return value.toString();
  }

  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

module.exports = { isInTypes, isDefined, toString };

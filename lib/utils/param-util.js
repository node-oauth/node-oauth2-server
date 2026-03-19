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
  const type = typeof value;
  if (type === 'string') {
    return value;
  }

  if (type === 'undefined' || value === null) {
    throw new TypeError(`Cannot convert ${value} to a string`);
  }

  if (type === 'number' || type === 'bigint') {
    const val = String(value);
    if (val === 'NaN' || val === 'Infinity' || val === '-Infinity') {
      throw new TypeError(`Invalid numeric value ${value}, cannot be converted to a string (${val})`);
    }
    return val;
  }


  throw new TypeError(`Cannot convert value ${value} of type ${type} to a string`);
}

module.exports = { isInTypes, isDefined, toString };

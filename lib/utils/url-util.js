'use strict';

/*
 * Module dependencies.
 */

const InvalidArgumentError = require('../errors/invalid-argument-error');
const querystring = require('querystring');

/**
 * @module UrlUtil
 */

/**
 * Parses a redirect URI with the WHATWG `URL` API and returns it in the shape
 * of Node's legacy `url.parse()` result, which `url.format()` serializes.
 * The redirect builders keep their return type without calling `url.parse()`,
 * which Node deprecates at runtime (DEP0169).
 *
 * @param {string} redirectUri an absolute URI
 * @param {boolean} [parseQueryString=false] return `query` as an object, as `url.parse(redirectUri, true)` does
 * @return {object} the parsed URI: `protocol`, `slashes`, `auth`, `host`, `port`, `hostname`, `hash`, `search`,
 *   `query`, `pathname`, `path` and `href`
 * @throws {InvalidArgumentError} if `redirectUri` is not an absolute URI
 */
function parseRedirectUri(redirectUri, parseQueryString = false) {
  let parsed;

  try {
    parsed = new URL(redirectUri);
  } catch {
    throw new InvalidArgumentError('Invalid parameter: `redirectUri`');
  }

  // `URL` reports an empty query (`…/cb?`) as `''`, as if there were none;
  // `url.parse()` keeps it as `'?'`.
  const search = parsed.search || (parsed.href.split('#')[0].endsWith('?') ? '?' : null);
  const pathname = parsed.pathname || null;
  // `url.parse()` gives an IPv6 hostname without its brackets; `host` keeps them.
  const hostname = parsed.hostname.startsWith('[') ? parsed.hostname.slice(1, -1) : parsed.hostname;
  let query = search ? search.slice(1) : null;

  if (parseQueryString) {
    query = querystring.parse(query || '');
  }

  return {
    protocol: parsed.protocol,
    slashes: parsed.href.startsWith(`${parsed.protocol}//`) ? true : null,
    auth: parseAuth(parsed),
    host: parsed.host || null,
    port: parsed.port || null,
    hostname: hostname || null,
    hash: parsed.hash || null,
    search,
    query,
    pathname,
    path: pathname || search ? `${pathname || ''}${search || ''}` : null,
    href: parsed.href,
  };
}

/**
 * The userinfo as `url.parse()` returns it: decoded, `user` or `user:password`,
 * and `null` when there is none. `url.format()` encodes it again.
 *
 * @param {URL} parsed
 * @return {string|null}
 */
function parseAuth(parsed) {
  if (!parsed.username && !parsed.password) {
    return null;
  }

  const auth = parsed.password ? `${parsed.username}:${parsed.password}` : parsed.username;

  try {
    return decodeURIComponent(auth);
  } catch {
    return auth;
  }
}

module.exports = { parseRedirectUri };

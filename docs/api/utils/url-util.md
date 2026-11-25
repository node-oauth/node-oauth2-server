<a name="module_UrlUtil"></a>

## UrlUtil

* [UrlUtil](#module_UrlUtil)
    * [~parseRedirectUri(redirectUri, [parseQueryString])](#module_UrlUtil..parseRedirectUri) ⇒ <code>object</code>
    * [~parseAuth(parsed)](#module_UrlUtil..parseAuth) ⇒ <code>string</code> \| <code>null</code>

<a name="module_UrlUtil..parseRedirectUri"></a>

### UrlUtil~parseRedirectUri(redirectUri, [parseQueryString]) ⇒ <code>object</code>
Parses a redirect URI with the WHATWG `URL` API and returns it in the shape
of Node's legacy `url.parse()` result, which `url.format()` serializes.
The redirect builders keep their return type without calling `url.parse()`,
which Node deprecates at runtime (DEP0169).

**Kind**: inner method of [<code>UrlUtil</code>](#module_UrlUtil)  
**Returns**: <code>object</code> - the parsed URI: `protocol`, `slashes`, `auth`, `host`, `port`, `hostname`, `hash`, `search`,
  `query`, `pathname`, `path` and `href`  
**Throws**:

- <code>InvalidArgumentError</code> if `redirectUri` is not an absolute URI


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| redirectUri | <code>string</code> |  | an absolute URI |
| [parseQueryString] | <code>boolean</code> | <code>false</code> | return `query` as an object, as `url.parse(redirectUri, true)` does |

<a name="module_UrlUtil..parseAuth"></a>

### UrlUtil~parseAuth(parsed) ⇒ <code>string</code> \| <code>null</code>
The userinfo as `url.parse()` returns it: decoded, `user` or `user:password`,
and `null` when there is none. `url.format()` encodes it again.

**Kind**: inner method of [<code>UrlUtil</code>](#module_UrlUtil)  

| Param | Type |
| --- | --- |
| parsed | <code>URL</code> | 


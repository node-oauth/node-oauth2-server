<a name="OAuth2Server"></a>

## OAuth2Server
The main OAuth2 server class.

**Kind**: global class  

* [OAuth2Server](#OAuth2Server)
    * [new OAuth2Server(options)](#new_OAuth2Server_new)
    * [.authenticate()](#OAuth2Server+authenticate) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.authorize(request, response, [options])](#OAuth2Server+authorize) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.token(request, response, [options])](#OAuth2Server+token) ⇒ <code>Promise.&lt;object&gt;</code>

<a name="new_OAuth2Server_new"></a>

### new OAuth2Server(options)
Instantiates `OAuth2Server` using the supplied model.
**Remarks:**
- Any valid option for [authenticate](#OAuth2Server+authenticate), [authorize](#OAuth2Server+authorize) and [token](#OAuth2Server+token) can be passed to the constructor as well.
- The supplied options will be used as default for the other methods.

**Returns**: [<code>OAuth2Server</code>](#OAuth2Server) - A new `OAuth2Server` instance.  
**Throws**:

- <code>InvalidArgumentError</code> if the model is missing


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>object</code> |  | Server options. |
| options.model | <code>Model</code> |  | The Model; this is always required. |
| options.scope | <code>Array.&lt;string&gt;</code> \| <code>undefined</code> |  | The scope(s) to authenticate. |
| [options.addAcceptedScopesHeader] | <code>boolean</code> | <code>true</code> | Set the `X-Accepted-OAuth-Scopes` HTTP header on response objects. |
| [options.addAuthorizedScopesHeader] | <code>boolean</code> | <code>true</code> | Set the `X-OAuth-Scopes` HTTP header on response objects. |
| [options.allowBearerTokensInQueryString] | <code>boolean</code> | <code>false</code> | Allow clients to pass bearer tokens in the query string of a request. |
| [options.authenticateHandler] | <code>object</code> |  | The authenticate handler (see remarks section). |
| options.authenticateHandler.handle | <code>function</code> |  | The actual handler function to get an authenticated user |
| [options.allowEmptyState] | <code>boolean</code> | <code>false</code> | Allow clients to specify an empty `state |
| [options.authorizationCodeLifetime] | <code>number</code> | <code>300</code> | Lifetime of generated authorization codes in seconds (default = 300 s = 5 min) |
| [options.accessTokenLifetime] | <code>number</code> | <code>3600</code> | Lifetime of generated access tokens in seconds (default = 1 hour). |
| [options.refreshTokenLifetime] | <code>number</code> | <code>1209600</code> | Lifetime of generated refresh tokens in seconds (default = 2 weeks). |
| [options.allowExtendedTokenAttributes] | <code>boolean</code> | <code>false</code> | Allow extended attributes to be set on the returned token (see remarks section). |
| [options.requireClientAuthentication] | <code>object</code> \| <code>boolean</code> | <code>object</code> | Require a client secret for grant types (names as keys). Defaults to `true` for all grant types. |
| [options.alwaysIssueNewRefreshToken] | <code>boolean</code> | <code>true</code> | Always revoke the used refresh token and issue a new one for the `refresh_token` grant. |
| [options.extendedGrantTypes] | <code>object</code> | <code>object</code> | Additional supported grant types. |

**Example**  
```js
const OAuth2Server = require('@node-oauth/oauth2-server');
```
<a name="OAuth2Server+authenticate"></a>

### oAuth2Server.authenticate() ⇒ <code>Promise.&lt;object&gt;</code>
Authenticates a request.

**Kind**: instance method of [<code>OAuth2Server</code>](#OAuth2Server)  
**Returns**: <code>Promise.&lt;object&gt;</code> - A `Promise` that resolves to the access token object returned from the model's `getAccessToken`.
  In case of an error, the promise rejects with one of the error types derived from `OAuthError`.  
**Throws**:

- <code>UnauthorizedRequestError</code> The protected resource request failed authentication.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options.scope | <code>Array.&lt;string&gt;</code> \| <code>undefined</code> |  | The scope(s) to authenticate. |
| [options.addAcceptedScopesHeader] | <code>boolean</code> | <code>true</code> | Set the `X-Accepted-OAuth-Scopes` HTTP header on response objects. |
| [options.addAuthorizedScopesHeader] | <code>boolean</code> | <code>true</code> | Set the `X-OAuth-Scopes` HTTP header on response objects. |
| [options.allowBearerTokensInQueryString] | <code>boolean</code> | <code>false</code> | Allow clients to pass bearer tokens in the query string of a request. |

**Example**  
```js
const oauth = new OAuth2Server({model: ...});
function authenticateHandler(options) {
  return function(req, res, next) {
    let request = new Request(req);
    let response = new Response(res);
    return oauth.authenticate(request, response, options)
      .then(function(token) {
        res.locals.oauth = {token: token};
        next();
      })
      .catch(function(err) {
        // handle error condition
      });
  }
}
```
<a name="OAuth2Server+authorize"></a>

### oAuth2Server.authorize(request, response, [options]) ⇒ <code>Promise.&lt;object&gt;</code>
Authorizes a token request.
**Remarks:**

If `request.query.allowed` equals the string `'false'` the access request is denied and the returned promise is rejected with an `AccessDeniedError`.

In order to retrieve the user associated with the request, `options.authenticateHandler` should be supplied.
The `authenticateHandler` has to be an object implementing a `handle(request, response)` function that returns a user object.
If there is no associated user (i.e. the user is not logged in) a falsy value should be returned.

```js
let authenticateHandler = {
  handle: function(request, response) {
    return // get authenticated user;
  }
};
```
When working with a session-based login mechanism, the handler can simply look like this:
```js
let authenticateHandler = {
  handle: function(request, response) {
    return request.session.user;
  }
};
```

**Kind**: instance method of [<code>OAuth2Server</code>](#OAuth2Server)  
**Returns**: <code>Promise.&lt;object&gt;</code> - A `Promise` that resolves to the authorization code object returned from model's `saveAuthorizationCode`
  In case of an error, the promise rejects with one of the error types derived from `OAuthError`.  
**Throws**:

- <code>AccessDeniedError</code> The resource owner denied the access request (i.e. `request.query.allow` was `'false'`).


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| request | <code>Request</code> |  | the Request instance object |
| [request.query.allowed] | <code>string</code> |  | `'false'` to deny the authorization request (see remarks section). |
| response | <code>Response</code> |  | the Response instance object |
| [options] | <code>object</code> |  | handler options |
| [options.authenticateHandler] | <code>object</code> |  | The authenticate handler (see remarks section). |
| options.authenticateHandler.handle | <code>function</code> |  | The actual handler function to get an authenticated user |
| [options.allowEmptyState] | <code>boolean</code> | <code>false</code> | Allow clients to specify an empty `state |
| [options.authorizationCodeLifetime] | <code>number</code> | <code>300</code> | Lifetime of generated authorization codes in seconds (default = 300 s = 5 min) |

**Example**  
```js
const oauth = new OAuth2Server({model: ...});
function authorizeHandler(options) {
  return function(req, res, next) {
    let request = new Request(req);
    let response = new Response(res);
    return oauth.authorize(request, response, options)
      .then(function(code) {
        res.locals.oauth = {code: code};
        next();
      })
      .catch(function(err) {
        // handle error condition
      });
  }
}
```
<a name="OAuth2Server+token"></a>

### oAuth2Server.token(request, response, [options]) ⇒ <code>Promise.&lt;object&gt;</code>
Retrieves a new token for an authorized token request.
**Remarks:**
If `options.allowExtendedTokenAttributes` is `true` any additional properties set on the object returned from `Model#saveToken() <Model#saveToken>` are copied to the token response sent to the client.
By default, all grant types require the client to send it's `client_secret` with the token request. `options.requireClientAuthentication` can be used to disable this check for selected grants. If used, this server option must be an object containing properties set to `true` or `false`. Possible keys for the object include all supported values for the token request's `grant_type` field (`authorization_code`, `client_credentials`, `password` and `refresh_token`). Grants that are not specified default to `true` which enables verification of the `client_secret`.
```js
let options = {
  // ...
  // Allow token requests using the password grant to not include a client_secret.
  requireClientAuthentication: {password: false}
};
```
`options.extendedGrantTypes` is an object mapping extension grant URIs to handler types, for example:
```js
let options = {
  // ...
  extendedGrantTypes: {
    'urn:foo:bar:baz': MyGrantType
  }
};
```
For information on how to implement a handler for a custom grant type see the extension grants.

**Kind**: instance method of [<code>OAuth2Server</code>](#OAuth2Server)  
**Returns**: <code>Promise.&lt;object&gt;</code> - A `Promise` that resolves to the token object returned from the model's `saveToken` method.
  In case of an error, the promise rejects with one of the error types derived from `OAuthError`.  
**Throws**:

- <code>InvalidGrantError</code> The access token request was invalid or not authorized.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| request | <code>Request</code> |  | the Request instance object |
| response | <code>Response</code> |  | the Response instance object |
| [options] | <code>object</code> |  | handler options |
| [options.accessTokenLifetime] | <code>number</code> | <code>3600</code> | Lifetime of generated access tokens in seconds (default = 1 hour). |
| [options.refreshTokenLifetime] | <code>number</code> | <code>1209600</code> | Lifetime of generated refresh tokens in seconds (default = 2 weeks). |
| [options.allowExtendedTokenAttributes] | <code>boolean</code> | <code>false</code> | Allow extended attributes to be set on the returned token (see remarks section). |
| [options.requireClientAuthentication] | <code>object</code> \| <code>boolean</code> | <code>object</code> | Require a client secret for grant types (names as keys). Defaults to `true` for all grant types. |
| [options.alwaysIssueNewRefreshToken] | <code>boolean</code> | <code>true</code> | Always revoke the used refresh token and issue a new one for the `refresh_token` grant. |
| [options.extendedGrantTypes] | <code>object</code> | <code>object</code> | Additional supported grant types. |

**Example**  
```js
const oauth = new OAuth2Server({model: ...});
function tokenHandler(options) {
  return function(req, res, next) {
    let request = new Request(req);
    let response = new Response(res);
    return oauth.token(request, response, options)
      .then(function(code) {
        res.locals.oauth = {token: token};
        next();
      })
      .catch(function(err) {
        // handle error condition
      });
  }
}
```

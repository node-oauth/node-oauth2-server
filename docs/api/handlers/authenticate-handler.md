<a name="AuthenticateHandler"></a>

## AuthenticateHandler
**Kind**: global class  

* [AuthenticateHandler](#AuthenticateHandler)
    * [new AuthenticateHandler(options)](#new_AuthenticateHandler_new)
    * [.handle(request, response)](#AuthenticateHandler+handle) ⇒ <code>Promise.&lt;\*&gt;</code>
    * [.getTokenFromRequest(request)](#AuthenticateHandler+getTokenFromRequest)
    * [.getTokenFromRequestHeader(request)](#AuthenticateHandler+getTokenFromRequestHeader)
    * [.getTokenFromRequestQuery(request)](#AuthenticateHandler+getTokenFromRequestQuery)
    * [.getTokenFromRequestBody(request)](#AuthenticateHandler+getTokenFromRequestBody)
    * [.getAccessToken(token)](#AuthenticateHandler+getAccessToken)
    * [.validateAccessToken()](#AuthenticateHandler+validateAccessToken)
    * [.verifyScope()](#AuthenticateHandler+verifyScope)
    * [.updateResponse()](#AuthenticateHandler+updateResponse)

<a name="new_AuthenticateHandler_new"></a>

### new AuthenticateHandler(options)
**Throws**:

- <code>InvalidArgumentError</code> if {model} is missing or does not implement `getAccessToken`


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>object</code> |  | Server options. |
| options.model | <code>Model</code> |  | The Model; this is always required. |
| options.scope | <code>Array.&lt;string&gt;</code> \| <code>undefined</code> |  | The scope(s) to authenticate. |
| [options.addAcceptedScopesHeader] | <code>boolean</code> | <code>true</code> | Set the `X-Accepted-OAuth-Scopes` HTTP header on response objects. |
| [options.addAuthorizedScopesHeader] | <code>boolean</code> | <code>true</code> | Set the `X-OAuth-Scopes` HTTP header on response objects. |
| [options.allowBearerTokensInQueryString] | <code>boolean</code> | <code>false</code> | Allow clients to pass bearer tokens in the query string of a request. |

<a name="AuthenticateHandler+handle"></a>

### authenticateHandler.handle(request, response) ⇒ <code>Promise.&lt;\*&gt;</code>
Handles the authentication

**Kind**: instance method of [<code>AuthenticateHandler</code>](#AuthenticateHandler)  

| Param | Type |
| --- | --- |
| request | <code>Request</code> | 
| response | <code>Response</code> | 

<a name="AuthenticateHandler+getTokenFromRequest"></a>

### authenticateHandler.getTokenFromRequest(request)
Get the token from the header or body, depending on the request.

"Clients MUST NOT use more than one method to transmit the token in each request."

**Kind**: instance method of [<code>AuthenticateHandler</code>](#AuthenticateHandler)  
**See**: {https://tools.ietf.org/html/rfc6750#section-2}  

| Param | Type |
| --- | --- |
| request | <code>Request</code> | 

<a name="AuthenticateHandler+getTokenFromRequestHeader"></a>

### authenticateHandler.getTokenFromRequestHeader(request)
Get the token from the request header.

**Kind**: instance method of [<code>AuthenticateHandler</code>](#AuthenticateHandler)  
**See**: {http://tools.ietf.org/html/rfc6750#section-2.1}  

| Param | Type |
| --- | --- |
| request | <code>Request</code> | 

<a name="AuthenticateHandler+getTokenFromRequestQuery"></a>

### authenticateHandler.getTokenFromRequestQuery(request)
Get the token from the request query.

"Don't pass bearer tokens in page URLs:  Bearer tokens SHOULD NOT be passed in page
URLs (for example, as query string parameters). Instead, bearer tokens SHOULD be
passed in HTTP message headers or message bodies for which confidentiality measures
are taken. Browsers, web servers, and other software may not adequately secure URLs
in the browser history, web server logs, and other data structures. If bearer tokens
are passed in page URLs, attackers might be able to steal them from the history data,
logs, or other unsecured locations."

**Kind**: instance method of [<code>AuthenticateHandler</code>](#AuthenticateHandler)  
**See**: http://tools.ietf.org/html/rfc6750#section-2.3  

| Param | Type |
| --- | --- |
| request | <code>Request</code> | 

<a name="AuthenticateHandler+getTokenFromRequestBody"></a>

### authenticateHandler.getTokenFromRequestBody(request)
Get the token from the request body.

"The HTTP request method is one for which the request-body has defined semantics.
In particular, this means that the "GET" method MUST NOT be used."

**Kind**: instance method of [<code>AuthenticateHandler</code>](#AuthenticateHandler)  
**See**: http://tools.ietf.org/html/rfc6750#section-2.2  

| Param | Type |
| --- | --- |
| request | <code>Request</code> | 

<a name="AuthenticateHandler+getAccessToken"></a>

### authenticateHandler.getAccessToken(token)
Get the access token from the model.

**Kind**: instance method of [<code>AuthenticateHandler</code>](#AuthenticateHandler)  

| Param |
| --- |
| token | 

<a name="AuthenticateHandler+validateAccessToken"></a>

### authenticateHandler.validateAccessToken()
Validate access token.

**Kind**: instance method of [<code>AuthenticateHandler</code>](#AuthenticateHandler)  
<a name="AuthenticateHandler+verifyScope"></a>

### authenticateHandler.verifyScope()
Verify scope.

**Kind**: instance method of [<code>AuthenticateHandler</code>](#AuthenticateHandler)  
<a name="AuthenticateHandler+updateResponse"></a>

### authenticateHandler.updateResponse()
Update response.

**Kind**: instance method of [<code>AuthenticateHandler</code>](#AuthenticateHandler)  

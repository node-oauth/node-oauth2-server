## Classes

<dl>
<dt><a href="#AuthorizeHandler">AuthorizeHandler</a></dt>
<dd><p>Constructor.</p>
</dd>
</dl>

## Constants

<dl>
<dt><a href="#responseTypes">responseTypes</a></dt>
<dd><p>Response types.</p>
</dd>
</dl>

<a name="AuthorizeHandler"></a>

## AuthorizeHandler
Constructor.

**Kind**: global class  

* [AuthorizeHandler](#AuthorizeHandler)
    * [.handle(request, response)](#AuthorizeHandler+handle)
    * [.generateAuthorizationCode(client, user, scope)](#AuthorizeHandler+generateAuthorizationCode)
    * [.getAuthorizationCodeLifetime()](#AuthorizeHandler+getAuthorizationCodeLifetime)
    * [.getClient(request)](#AuthorizeHandler+getClient)
    * [.validateScope(user, client, scope)](#AuthorizeHandler+validateScope) ⇒ <code>Promise.&lt;(Array.&lt;string&gt;\|undefined)&gt;</code>
    * [.getScope(request)](#AuthorizeHandler+getScope) ⇒ <code>Array.&lt;string&gt;</code> \| <code>undefined</code>
    * [.getState(request)](#AuthorizeHandler+getState)
    * [.getUser(request, response)](#AuthorizeHandler+getUser)
    * [.getRedirectUri(request, client)](#AuthorizeHandler+getRedirectUri)
    * [.saveAuthorizationCode(authorizationCode, expiresAt, scope, client, redirectUri, user, codeChallenge, codeChallengeMethod)](#AuthorizeHandler+saveAuthorizationCode)
    * [.getResponseType(request)](#AuthorizeHandler+getResponseType)
    * [.buildSuccessRedirectUri(redirectUri, responseType)](#AuthorizeHandler+buildSuccessRedirectUri)
    * [.buildErrorRedirectUri(redirectUri, error)](#AuthorizeHandler+buildErrorRedirectUri)
    * [.updateResponse(response, redirectUri, state)](#AuthorizeHandler+updateResponse)
    * [.getCodeChallengeMethod(request)](#AuthorizeHandler+getCodeChallengeMethod)

<a name="AuthorizeHandler+handle"></a>

### authorizeHandler.handle(request, response)
Authorize Handler.

**Kind**: instance method of [<code>AuthorizeHandler</code>](#AuthorizeHandler)  

| Param | Type |
| --- | --- |
| request | <code>Request</code> | 
| response | <code>Response</code> | 

<a name="AuthorizeHandler+generateAuthorizationCode"></a>

### authorizeHandler.generateAuthorizationCode(client, user, scope)
Generate authorization code.

**Kind**: instance method of [<code>AuthorizeHandler</code>](#AuthorizeHandler)  

| Param | Type |
| --- | --- |
| client | <code>ClientData</code> | 
| user | <code>object</code> | 
| scope | <code>Array.&lt;string&gt;</code> \| <code>undefined</code> | 

<a name="AuthorizeHandler+getAuthorizationCodeLifetime"></a>

### authorizeHandler.getAuthorizationCodeLifetime()
Get authorization code lifetime.

**Kind**: instance method of [<code>AuthorizeHandler</code>](#AuthorizeHandler)  
<a name="AuthorizeHandler+getClient"></a>

### authorizeHandler.getClient(request)
Get the client from the model.

**Kind**: instance method of [<code>AuthorizeHandler</code>](#AuthorizeHandler)  

| Param | Type |
| --- | --- |
| request | <code>Request</code> | 

<a name="AuthorizeHandler+validateScope"></a>

### authorizeHandler.validateScope(user, client, scope) ⇒ <code>Promise.&lt;(Array.&lt;string&gt;\|undefined)&gt;</code>
Validate requested scope.

**Kind**: instance method of [<code>AuthorizeHandler</code>](#AuthorizeHandler)  
**Returns**: <code>Promise.&lt;(Array.&lt;string&gt;\|undefined)&gt;</code> - The accepted scopes.  

| Param | Type |
| --- | --- |
| user | <code>object</code> | 
| client | <code>ClientData</code> | 
| scope | <code>Array.&lt;string&gt;</code> \| <code>undefined</code> | 

<a name="AuthorizeHandler+getScope"></a>

### authorizeHandler.getScope(request) ⇒ <code>Array.&lt;string&gt;</code> \| <code>undefined</code>
Get scope from the request.

**Kind**: instance method of [<code>AuthorizeHandler</code>](#AuthorizeHandler)  

| Param | Type |
| --- | --- |
| request | <code>Request</code> | 

<a name="AuthorizeHandler+getState"></a>

### authorizeHandler.getState(request)
Get state from the request.

**Kind**: instance method of [<code>AuthorizeHandler</code>](#AuthorizeHandler)  

| Param | Type |
| --- | --- |
| request | <code>Request</code> | 

<a name="AuthorizeHandler+getUser"></a>

### authorizeHandler.getUser(request, response)
Get user by calling the authenticate middleware.

**Kind**: instance method of [<code>AuthorizeHandler</code>](#AuthorizeHandler)  

| Param | Type |
| --- | --- |
| request | <code>Request</code> | 
| response | <code>Response</code> | 

<a name="AuthorizeHandler+getRedirectUri"></a>

### authorizeHandler.getRedirectUri(request, client)
Get redirect URI.

**Kind**: instance method of [<code>AuthorizeHandler</code>](#AuthorizeHandler)  

| Param | Type |
| --- | --- |
| request | <code>Request</code> | 
| client | <code>ClientData</code> | 

<a name="AuthorizeHandler+saveAuthorizationCode"></a>

### authorizeHandler.saveAuthorizationCode(authorizationCode, expiresAt, scope, client, redirectUri, user, codeChallenge, codeChallengeMethod)
Save authorization code.

**Kind**: instance method of [<code>AuthorizeHandler</code>](#AuthorizeHandler)  

| Param | Type |
| --- | --- |
| authorizationCode | <code>string</code> | 
| expiresAt | <code>Date</code> | 
| scope | <code>Array.&lt;string&gt;</code> \| <code>undefined</code> | 
| client | <code>ClientData</code> | 
| redirectUri | <code>string</code> | 
| user | <code>object</code> | 
| codeChallenge | <code>string</code> \| <code>undefined</code> | 
| codeChallengeMethod | <code>string</code> \| <code>undefined</code> | 

<a name="AuthorizeHandler+getResponseType"></a>

### authorizeHandler.getResponseType(request)
Get response type.

**Kind**: instance method of [<code>AuthorizeHandler</code>](#AuthorizeHandler)  

| Param | Type |
| --- | --- |
| request | <code>Request</code> | 

<a name="AuthorizeHandler+buildSuccessRedirectUri"></a>

### authorizeHandler.buildSuccessRedirectUri(redirectUri, responseType)
Build a successful response that redirects the user-agent to the client-provided url.

**Kind**: instance method of [<code>AuthorizeHandler</code>](#AuthorizeHandler)  

| Param | Type |
| --- | --- |
| redirectUri | <code>string</code> | 
| responseType | <code>object</code> | 

<a name="AuthorizeHandler+buildErrorRedirectUri"></a>

### authorizeHandler.buildErrorRedirectUri(redirectUri, error)
Build an error response that redirects the user-agent to the client-provided url.

**Kind**: instance method of [<code>AuthorizeHandler</code>](#AuthorizeHandler)  

| Param | Type |
| --- | --- |
| redirectUri | <code>string</code> | 
| error | <code>Error</code> | 

<a name="AuthorizeHandler+updateResponse"></a>

### authorizeHandler.updateResponse(response, redirectUri, state)
Update response with the redirect uri and the state parameter, if available.

**Kind**: instance method of [<code>AuthorizeHandler</code>](#AuthorizeHandler)  

| Param | Type | Description |
| --- | --- | --- |
| response | <code>Response</code> |  |
| redirectUri | <code>object</code> | Parsed URL returned by the redirect builders. |
| state | <code>string</code> \| <code>undefined</code> |  |

<a name="AuthorizeHandler+getCodeChallengeMethod"></a>

### authorizeHandler.getCodeChallengeMethod(request)
Get code challenge method from request.

When `enablePlainPKCE` is false (the default), the "plain" method is
rejected and the default (when no method is provided) is "S256".
When `enablePlainPKCE` is true, "plain" is accepted and used as the
default per RFC 7636 §4.3.

**Kind**: instance method of [<code>AuthorizeHandler</code>](#AuthorizeHandler)  
**Throws**:

- <code>InvalidRequestError</code> if request contains unsupported code_challenge_method
 (see https://www.rfc-editor.org/rfc/rfc7636#section-4.4)

**See**: https://www.rfc-editor.org/rfc/rfc7636#section-4.3  

| Param | Type |
| --- | --- |
| request | <code>Request</code> | 

<a name="responseTypes"></a>

## responseTypes
Response types.

**Kind**: global constant  

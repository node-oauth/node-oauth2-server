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
    * [.handle()](#AuthorizeHandler+handle)
    * [.generateAuthorizationCode()](#AuthorizeHandler+generateAuthorizationCode)
    * [.getAuthorizationCodeLifetime()](#AuthorizeHandler+getAuthorizationCodeLifetime)
    * [.getClient()](#AuthorizeHandler+getClient)
    * [.validateScope()](#AuthorizeHandler+validateScope)
    * [.getScope()](#AuthorizeHandler+getScope)
    * [.getState()](#AuthorizeHandler+getState)
    * [.getUser()](#AuthorizeHandler+getUser)
    * [.getRedirectUri()](#AuthorizeHandler+getRedirectUri)
    * [.saveAuthorizationCode()](#AuthorizeHandler+saveAuthorizationCode)
    * [.getResponseType()](#AuthorizeHandler+getResponseType)
    * [.buildSuccessRedirectUri()](#AuthorizeHandler+buildSuccessRedirectUri)
    * [.buildErrorRedirectUri()](#AuthorizeHandler+buildErrorRedirectUri)
    * [.updateResponse()](#AuthorizeHandler+updateResponse)
    * [.getCodeChallengeMethod()](#AuthorizeHandler+getCodeChallengeMethod)

<a name="AuthorizeHandler+handle"></a>

### authorizeHandler.handle()
Authorize Handler.

**Kind**: instance method of [<code>AuthorizeHandler</code>](#AuthorizeHandler)  
<a name="AuthorizeHandler+generateAuthorizationCode"></a>

### authorizeHandler.generateAuthorizationCode()
Generate authorization code.

**Kind**: instance method of [<code>AuthorizeHandler</code>](#AuthorizeHandler)  
<a name="AuthorizeHandler+getAuthorizationCodeLifetime"></a>

### authorizeHandler.getAuthorizationCodeLifetime()
Get authorization code lifetime.

**Kind**: instance method of [<code>AuthorizeHandler</code>](#AuthorizeHandler)  
<a name="AuthorizeHandler+getClient"></a>

### authorizeHandler.getClient()
Get the client from the model.

**Kind**: instance method of [<code>AuthorizeHandler</code>](#AuthorizeHandler)  
<a name="AuthorizeHandler+validateScope"></a>

### authorizeHandler.validateScope()
Validate requested scope.

**Kind**: instance method of [<code>AuthorizeHandler</code>](#AuthorizeHandler)  
<a name="AuthorizeHandler+getScope"></a>

### authorizeHandler.getScope()
Get scope from the request.

**Kind**: instance method of [<code>AuthorizeHandler</code>](#AuthorizeHandler)  
<a name="AuthorizeHandler+getState"></a>

### authorizeHandler.getState()
Get state from the request.

**Kind**: instance method of [<code>AuthorizeHandler</code>](#AuthorizeHandler)  
<a name="AuthorizeHandler+getUser"></a>

### authorizeHandler.getUser()
Get user by calling the authenticate middleware.

**Kind**: instance method of [<code>AuthorizeHandler</code>](#AuthorizeHandler)  
<a name="AuthorizeHandler+getRedirectUri"></a>

### authorizeHandler.getRedirectUri()
Get redirect URI.

**Kind**: instance method of [<code>AuthorizeHandler</code>](#AuthorizeHandler)  
<a name="AuthorizeHandler+saveAuthorizationCode"></a>

### authorizeHandler.saveAuthorizationCode()
Save authorization code.

**Kind**: instance method of [<code>AuthorizeHandler</code>](#AuthorizeHandler)  
<a name="AuthorizeHandler+getResponseType"></a>

### authorizeHandler.getResponseType()
Get response type.

**Kind**: instance method of [<code>AuthorizeHandler</code>](#AuthorizeHandler)  
<a name="AuthorizeHandler+buildSuccessRedirectUri"></a>

### authorizeHandler.buildSuccessRedirectUri()
Build a successful response that redirects the user-agent to the client-provided url.

**Kind**: instance method of [<code>AuthorizeHandler</code>](#AuthorizeHandler)  
<a name="AuthorizeHandler+buildErrorRedirectUri"></a>

### authorizeHandler.buildErrorRedirectUri()
Build an error response that redirects the user-agent to the client-provided url.

**Kind**: instance method of [<code>AuthorizeHandler</code>](#AuthorizeHandler)  
<a name="AuthorizeHandler+updateResponse"></a>

### authorizeHandler.updateResponse()
Update response with the redirect uri and the state parameter, if available.

**Kind**: instance method of [<code>AuthorizeHandler</code>](#AuthorizeHandler)  
<a name="AuthorizeHandler+getCodeChallengeMethod"></a>

### authorizeHandler.getCodeChallengeMethod()
Get code challenge method from request or defaults to plain.
https://www.rfc-editor.org/rfc/rfc7636#section-4.3

**Kind**: instance method of [<code>AuthorizeHandler</code>](#AuthorizeHandler)  
**Throws**:

- <code>InvalidRequestError</code> if request contains unsupported code_challenge_method
 (see https://www.rfc-editor.org/rfc/rfc7636#section-4.4)

<a name="responseTypes"></a>

## responseTypes
Response types.

**Kind**: global constant  

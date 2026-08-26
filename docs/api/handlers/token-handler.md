## Classes

<dl>
<dt><a href="#TokenHandler">TokenHandler</a></dt>
<dd><p>Constructor.</p>
</dd>
</dl>

## Constants

<dl>
<dt><a href="#grantTypes">grantTypes</a></dt>
<dd><p>Grant types.</p>
</dd>
</dl>

<a name="TokenHandler"></a>

## TokenHandler
Constructor.

**Kind**: global class  

* [TokenHandler](#TokenHandler)
    * [.handle()](#TokenHandler+handle)
    * [.getClient()](#TokenHandler+getClient)
    * [.handleGrantType()](#TokenHandler+handleGrantType)
    * [.getAccessTokenLifetime()](#TokenHandler+getAccessTokenLifetime)
    * [.getRefreshTokenLifetime()](#TokenHandler+getRefreshTokenLifetime)
    * [.getTokenType()](#TokenHandler+getTokenType)
    * [.updateSuccessResponse()](#TokenHandler+updateSuccessResponse)
    * [.updateErrorResponse()](#TokenHandler+updateErrorResponse)
    * [.isClientAuthenticationRequired()](#TokenHandler+isClientAuthenticationRequired)

<a name="TokenHandler+handle"></a>

### tokenHandler.handle()
Token Handler.

**Kind**: instance method of [<code>TokenHandler</code>](#TokenHandler)  
<a name="TokenHandler+getClient"></a>

### tokenHandler.getClient()
Get the client from the model.

Client authentication is delegated to the configured authentication
methods (see the client authentication guide). The single method
that matches the request resolves and verifies the client; supported out
of the box are HTTP Basic, request-body credentials and public clients,
plus any methods added via `extendedClientAuthentication` (e.g. JWT
client assertions).

**Kind**: instance method of [<code>TokenHandler</code>](#TokenHandler)  
**See**: https://datatracker.ietf.org/doc/html/rfc6749#section-2.3.1  
<a name="TokenHandler+handleGrantType"></a>

### tokenHandler.handleGrantType()
Handle grant type.

**Kind**: instance method of [<code>TokenHandler</code>](#TokenHandler)  
<a name="TokenHandler+getAccessTokenLifetime"></a>

### tokenHandler.getAccessTokenLifetime()
Get access token lifetime.

**Kind**: instance method of [<code>TokenHandler</code>](#TokenHandler)  
<a name="TokenHandler+getRefreshTokenLifetime"></a>

### tokenHandler.getRefreshTokenLifetime()
Get refresh token lifetime.

**Kind**: instance method of [<code>TokenHandler</code>](#TokenHandler)  
<a name="TokenHandler+getTokenType"></a>

### tokenHandler.getTokenType()
Get token type.

**Kind**: instance method of [<code>TokenHandler</code>](#TokenHandler)  
<a name="TokenHandler+updateSuccessResponse"></a>

### tokenHandler.updateSuccessResponse()
Update response when a token is generated.

**Kind**: instance method of [<code>TokenHandler</code>](#TokenHandler)  
<a name="TokenHandler+updateErrorResponse"></a>

### tokenHandler.updateErrorResponse()
Update response when an error is thrown.

**Kind**: instance method of [<code>TokenHandler</code>](#TokenHandler)  
<a name="TokenHandler+isClientAuthenticationRequired"></a>

### tokenHandler.isClientAuthenticationRequired()
Given a grant type, check if client authentication is required

**Kind**: instance method of [<code>TokenHandler</code>](#TokenHandler)  
<a name="grantTypes"></a>

## grantTypes
Grant types.

**Kind**: global constant  

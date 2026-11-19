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
    * [.getClientCredentials()](#TokenHandler+getClientCredentials)
    * [.handleGrantType()](#TokenHandler+handleGrantType)
    * [.getAccessTokenLifetime()](#TokenHandler+getAccessTokenLifetime)
    * [.getRefreshTokenLifetime()](#TokenHandler+getRefreshTokenLifetime)
    * [.getTokenType()](#TokenHandler+getTokenType)
    * [.updateSuccessResponse()](#TokenHandler+updateSuccessResponse)
    * [.updateErrorResponse()](#TokenHandler+updateErrorResponse)
    * [.isClientAuthenticationRequired()](#TokenHandler+isClientAuthenticationRequired)
    * [.isClientSecretOptional()](#TokenHandler+isClientSecretOptional)

<a name="TokenHandler+handle"></a>

### tokenHandler.handle()
Token Handler.

**Kind**: instance method of [<code>TokenHandler</code>](#TokenHandler)  
<a name="TokenHandler+getClient"></a>

### tokenHandler.getClient()
Get the client from the model.

**Kind**: instance method of [<code>TokenHandler</code>](#TokenHandler)  
<a name="TokenHandler+getClientCredentials"></a>

### tokenHandler.getClientCredentials()
Get client credentials.

The client credentials may be sent using the HTTP Basic authentication scheme or, alternatively,
the `client_id` and `client_secret` can be embedded in the body.

**Kind**: instance method of [<code>TokenHandler</code>](#TokenHandler)  
**See**: https://tools.ietf.org/html/rfc6749#section-2.3.1  
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
Given a grant type, client and pkce flag, check if client authentication is required.

An explicit `requireClientAuthentication` entry for the grant type always wins.
Otherwise the client type decides:
- `public`: no secret for `refresh_token`; `authorization_code` requires PKCE instead
- `confidential` or no type: secret always required, PKCE never waives it

**Kind**: instance method of [<code>TokenHandler</code>](#TokenHandler)  
<a name="TokenHandler+isClientSecretOptional"></a>

### tokenHandler.isClientSecretOptional()
Given a grant type and pkce flag, check if a request without a client secret could be accepted
for any client type.

**Kind**: instance method of [<code>TokenHandler</code>](#TokenHandler)  
<a name="grantTypes"></a>

## grantTypes
Grant types.

**Kind**: global constant  

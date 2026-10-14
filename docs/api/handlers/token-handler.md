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
    * [.handle(request, response)](#TokenHandler+handle)
    * [.getClient(request, response)](#TokenHandler+getClient)
    * [.getClientCredentials(request)](#TokenHandler+getClientCredentials)
    * [.handleGrantType(request, client)](#TokenHandler+handleGrantType)
    * [.getAccessTokenLifetime(client)](#TokenHandler+getAccessTokenLifetime)
    * [.getRefreshTokenLifetime(client)](#TokenHandler+getRefreshTokenLifetime)
    * [.getTokenType(model)](#TokenHandler+getTokenType)
    * [.updateSuccessResponse(response, tokenType)](#TokenHandler+updateSuccessResponse)
    * [.updateErrorResponse(response, error)](#TokenHandler+updateErrorResponse)
    * [.isClientAuthenticationRequired(grantType)](#TokenHandler+isClientAuthenticationRequired)

<a name="TokenHandler+handle"></a>

### tokenHandler.handle(request, response)
Token Handler.

**Kind**: instance method of [<code>TokenHandler</code>](#TokenHandler)  

| Param | Type |
| --- | --- |
| request | <code>Request</code> | 
| response | <code>Response</code> | 

<a name="TokenHandler+getClient"></a>

### tokenHandler.getClient(request, response)
Get the client from the model.

**Kind**: instance method of [<code>TokenHandler</code>](#TokenHandler)  

| Param | Type |
| --- | --- |
| request | <code>Request</code> | 
| response | <code>Response</code> | 

<a name="TokenHandler+getClientCredentials"></a>

### tokenHandler.getClientCredentials(request)
Get client credentials.

The client credentials may be sent using the HTTP Basic authentication scheme or, alternatively,
the `client_id` and `client_secret` can be embedded in the body.

**Kind**: instance method of [<code>TokenHandler</code>](#TokenHandler)  
**See**: https://tools.ietf.org/html/rfc6749#section-2.3.1  

| Param | Type |
| --- | --- |
| request | <code>Request</code> | 

<a name="TokenHandler+handleGrantType"></a>

### tokenHandler.handleGrantType(request, client)
Handle grant type.

**Kind**: instance method of [<code>TokenHandler</code>](#TokenHandler)  

| Param | Type |
| --- | --- |
| request | <code>Request</code> | 
| client | <code>ClientData</code> | 

<a name="TokenHandler+getAccessTokenLifetime"></a>

### tokenHandler.getAccessTokenLifetime(client)
Get access token lifetime.

**Kind**: instance method of [<code>TokenHandler</code>](#TokenHandler)  

| Param | Type |
| --- | --- |
| client | <code>ClientData</code> | 

<a name="TokenHandler+getRefreshTokenLifetime"></a>

### tokenHandler.getRefreshTokenLifetime(client)
Get refresh token lifetime.

**Kind**: instance method of [<code>TokenHandler</code>](#TokenHandler)  

| Param | Type |
| --- | --- |
| client | <code>ClientData</code> | 

<a name="TokenHandler+getTokenType"></a>

### tokenHandler.getTokenType(model)
Get token type.

**Kind**: instance method of [<code>TokenHandler</code>](#TokenHandler)  

| Param | Type |
| --- | --- |
| model | <code>TokenModel</code> | 

<a name="TokenHandler+updateSuccessResponse"></a>

### tokenHandler.updateSuccessResponse(response, tokenType)
Update response when a token is generated.

**Kind**: instance method of [<code>TokenHandler</code>](#TokenHandler)  

| Param | Type |
| --- | --- |
| response | <code>Response</code> | 
| tokenType | <code>BearerTokenType</code> | 

<a name="TokenHandler+updateErrorResponse"></a>

### tokenHandler.updateErrorResponse(response, error)
Update response when an error is thrown.

**Kind**: instance method of [<code>TokenHandler</code>](#TokenHandler)  

| Param | Type |
| --- | --- |
| response | <code>Response</code> | 
| error | <code>Error</code> | 

<a name="TokenHandler+isClientAuthenticationRequired"></a>

### tokenHandler.isClientAuthenticationRequired(grantType)
Given a grant type, check if client authentication is required

**Kind**: instance method of [<code>TokenHandler</code>](#TokenHandler)  

| Param | Type |
| --- | --- |
| grantType | <code>string</code> | 

<a name="grantTypes"></a>

## grantTypes
Grant types.

**Kind**: global constant  

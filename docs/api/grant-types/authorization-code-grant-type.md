<a name="AuthorizationCodeGrantType"></a>

## AuthorizationCodeGrantType
**Kind**: global class  

* [AuthorizationCodeGrantType](#AuthorizationCodeGrantType)
    * [new AuthorizationCodeGrantType(options)](#new_AuthorizationCodeGrantType_new)
    * [.handle(request, client)](#AuthorizationCodeGrantType+handle)
    * [.getAuthorizationCode(request, client)](#AuthorizationCodeGrantType+getAuthorizationCode) ⇒ <code>Promise.&lt;{user}&gt;</code>
    * [.validateRedirectUri(request, code)](#AuthorizationCodeGrantType+validateRedirectUri)
    * [.revokeAuthorizationCode(code)](#AuthorizationCodeGrantType+revokeAuthorizationCode)
    * [.saveToken(user, client, authorizationCode, requestedScope)](#AuthorizationCodeGrantType+saveToken)

<a name="new_AuthorizationCodeGrantType_new"></a>

### new AuthorizationCodeGrantType(options)

| Param |
| --- |
| options | 

<a name="AuthorizationCodeGrantType+handle"></a>

### authorizationCodeGrantType.handle(request, client)
Handle authorization code grant.

**Kind**: instance method of [<code>AuthorizationCodeGrantType</code>](#AuthorizationCodeGrantType)  
**See**: https://tools.ietf.org/html/rfc6749#section-4.1.3  

| Param | Type |
| --- | --- |
| request | <code>Request</code> | 
| client | <code>ClientData</code> | 

<a name="AuthorizationCodeGrantType+getAuthorizationCode"></a>

### authorizationCodeGrantType.getAuthorizationCode(request, client) ⇒ <code>Promise.&lt;{user}&gt;</code>
Get the authorization code.

**Kind**: instance method of [<code>AuthorizationCodeGrantType</code>](#AuthorizationCodeGrantType)  

| Param | Type |
| --- | --- |
| request | <code>Request</code> | 
| client | <code>ClientData</code> | 

<a name="AuthorizationCodeGrantType+validateRedirectUri"></a>

### authorizationCodeGrantType.validateRedirectUri(request, code)
Validate the redirect URI.

"The authorization server MUST ensure that the redirect_uri parameter is
present if the redirect_uri parameter was included in the initial
authorization request as described in Section 4.1.1, and if included
ensure that their values are identical."

**Kind**: instance method of [<code>AuthorizationCodeGrantType</code>](#AuthorizationCodeGrantType)  
**See**: https://tools.ietf.org/html/rfc6749#section-4.1.3  

| Param | Type |
| --- | --- |
| request | <code>Request</code> | 
| code | <code>AuthorizationCodeData</code> | 

<a name="AuthorizationCodeGrantType+revokeAuthorizationCode"></a>

### authorizationCodeGrantType.revokeAuthorizationCode(code)
Revoke the authorization code.

"The authorization code MUST expire shortly after it is issued to mitigate
the risk of leaks. [...] If an authorization code is used more than once,
the authorization server MUST deny the request."

**Kind**: instance method of [<code>AuthorizationCodeGrantType</code>](#AuthorizationCodeGrantType)  
**See**: https://tools.ietf.org/html/rfc6749#section-4.1.2  

| Param | Type |
| --- | --- |
| code | <code>AuthorizationCodeData</code> | 

<a name="AuthorizationCodeGrantType+saveToken"></a>

### authorizationCodeGrantType.saveToken(user, client, authorizationCode, requestedScope)
Save token.

**Kind**: instance method of [<code>AuthorizationCodeGrantType</code>](#AuthorizationCodeGrantType)  

| Param | Type |
| --- | --- |
| user | <code>object</code> | 
| client | <code>ClientData</code> | 
| authorizationCode | <code>string</code> | 
| requestedScope | <code>string</code> | 


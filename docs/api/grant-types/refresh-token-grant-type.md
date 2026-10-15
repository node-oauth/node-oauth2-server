<a name="RefreshTokenGrantType"></a>

## RefreshTokenGrantType
Constructor.

**Kind**: global class  

* [RefreshTokenGrantType](#RefreshTokenGrantType)
    * [.handle(request, client)](#RefreshTokenGrantType+handle)
    * [.getRefreshToken(request, client)](#RefreshTokenGrantType+getRefreshToken)
    * [.revokeToken(token)](#RefreshTokenGrantType+revokeToken)
    * [.saveToken(user, client, scope)](#RefreshTokenGrantType+saveToken)

<a name="RefreshTokenGrantType+handle"></a>

### refreshTokenGrantType.handle(request, client)
Handle refresh token grant.

**Kind**: instance method of [<code>RefreshTokenGrantType</code>](#RefreshTokenGrantType)  
**See**: https://tools.ietf.org/html/rfc6749#section-6  

| Param | Type |
| --- | --- |
| request | <code>Request</code> | 
| client | <code>ClientData</code> | 

<a name="RefreshTokenGrantType+getRefreshToken"></a>

### refreshTokenGrantType.getRefreshToken(request, client)
Get refresh token.

**Kind**: instance method of [<code>RefreshTokenGrantType</code>](#RefreshTokenGrantType)  

| Param | Type |
| --- | --- |
| request | <code>Request</code> | 
| client | <code>ClientData</code> | 

<a name="RefreshTokenGrantType+revokeToken"></a>

### refreshTokenGrantType.revokeToken(token)
Revoke the refresh token.

**Kind**: instance method of [<code>RefreshTokenGrantType</code>](#RefreshTokenGrantType)  
**See**: https://tools.ietf.org/html/rfc6749#section-6  

| Param | Type |
| --- | --- |
| token | <code>object</code> | 

<a name="RefreshTokenGrantType+saveToken"></a>

### refreshTokenGrantType.saveToken(user, client, scope)
Save token.

**Kind**: instance method of [<code>RefreshTokenGrantType</code>](#RefreshTokenGrantType)  

| Param | Type |
| --- | --- |
| user | <code>object</code> | 
| client | <code>ClientData</code> | 
| scope | <code>Array.&lt;string&gt;</code> \| <code>undefined</code> | 


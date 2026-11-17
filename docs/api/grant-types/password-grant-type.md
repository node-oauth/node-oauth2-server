<a name="PasswordGrantType"></a>

## ~~PasswordGrantType~~
***Deprecated***

Constructor.

**Kind**: global class  

* ~~[PasswordGrantType](#PasswordGrantType)~~
    * [.handle(request, client)](#PasswordGrantType+handle)
    * [.getUser(request, client)](#PasswordGrantType+getUser)
    * [.saveToken(user, client, requestedScope)](#PasswordGrantType+saveToken)

<a name="PasswordGrantType+handle"></a>

### passwordGrantType.handle(request, client)
Retrieve the user from the model using a username/password combination.

**Kind**: instance method of [<code>PasswordGrantType</code>](#PasswordGrantType)  
**See**: https://tools.ietf.org/html/rfc6749#section-4.3.2  

| Param | Type |
| --- | --- |
| request | <code>Request</code> | 
| client | <code>ClientData</code> | 

<a name="PasswordGrantType+getUser"></a>

### passwordGrantType.getUser(request, client)
Get user using a username/password combination.

**Kind**: instance method of [<code>PasswordGrantType</code>](#PasswordGrantType)  

| Param | Type |
| --- | --- |
| request | <code>Request</code> | 
| client | <code>ClientData</code> | 

<a name="PasswordGrantType+saveToken"></a>

### passwordGrantType.saveToken(user, client, requestedScope)
Save token.

**Kind**: instance method of [<code>PasswordGrantType</code>](#PasswordGrantType)  

| Param | Type |
| --- | --- |
| user | <code>object</code> | 
| client | <code>ClientData</code> | 
| requestedScope | <code>Array.&lt;string&gt;</code> \| <code>undefined</code> | 


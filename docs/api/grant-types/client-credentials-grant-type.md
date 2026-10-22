<a name="ClientCredentialsGrantType"></a>

## ClientCredentialsGrantType
Constructor.

**Kind**: global class  

* [ClientCredentialsGrantType](#ClientCredentialsGrantType)
    * [.handle(request, client)](#ClientCredentialsGrantType+handle)
    * [.getUserFromClient(client)](#ClientCredentialsGrantType+getUserFromClient)
    * [.saveToken(user, client, requestedScope)](#ClientCredentialsGrantType+saveToken)

<a name="ClientCredentialsGrantType+handle"></a>

### clientCredentialsGrantType.handle(request, client)
Handle client credentials grant.

**Kind**: instance method of [<code>ClientCredentialsGrantType</code>](#ClientCredentialsGrantType)  
**See**: https://tools.ietf.org/html/rfc6749#section-4.4.2  

| Param | Type |
| --- | --- |
| request | <code>Request</code> | 
| client | <code>ClientData</code> | 

<a name="ClientCredentialsGrantType+getUserFromClient"></a>

### clientCredentialsGrantType.getUserFromClient(client)
Retrieve the user using client credentials.

**Kind**: instance method of [<code>ClientCredentialsGrantType</code>](#ClientCredentialsGrantType)  

| Param | Type |
| --- | --- |
| client | <code>ClientData</code> | 

<a name="ClientCredentialsGrantType+saveToken"></a>

### clientCredentialsGrantType.saveToken(user, client, requestedScope)
Save token.

**Kind**: instance method of [<code>ClientCredentialsGrantType</code>](#ClientCredentialsGrantType)  

| Param | Type |
| --- | --- |
| user | <code>object</code> | 
| client | <code>ClientData</code> | 
| requestedScope | <code>Array.&lt;string&gt;</code> \| <code>undefined</code> | 


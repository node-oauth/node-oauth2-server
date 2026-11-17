<a name="AbstractGrantType"></a>

## AbstractGrantType
**Kind**: global class  
**Classdesc#**:   

* [AbstractGrantType](#AbstractGrantType)
    * [new AbstractGrantType(options)](#new_AbstractGrantType_new)
    * [.generateAccessToken(client, user, scope)](#AbstractGrantType+generateAccessToken) ⇒ <code>Promise.&lt;string&gt;</code>
    * [.generateRefreshToken(client, user, scope)](#AbstractGrantType+generateRefreshToken)
    * [.getAccessTokenExpiresAt()](#AbstractGrantType+getAccessTokenExpiresAt)
    * [.getRefreshTokenExpiresAt()](#AbstractGrantType+getRefreshTokenExpiresAt) ⇒ <code>Date</code>
    * [.getScope(request)](#AbstractGrantType+getScope) ⇒ <code>Array.&lt;string&gt;</code> \| <code>undefined</code>
    * [.validateScope(user, client, scope)](#AbstractGrantType+validateScope) ⇒ <code>Promise.&lt;(Array.&lt;string&gt;\|undefined)&gt;</code>

<a name="new_AbstractGrantType_new"></a>

### new AbstractGrantType(options)
**Throws**:

- <code>InvalidArgumentError</code> if {options.accessTokenLifeTime} is missing
- <code>InvalidArgumentError</code> if {options.model} is missing


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>object</code> |  |  |
| options.accessTokenLifetime | <code>number</code> |  | access token lifetime in seconds |
| options.model | <code>Model</code> |  | the model |
| options.refreshTokenLifetime | <code>number</code> |  |  |
| [options.alwaysIssueNewRefreshToken] | <code>boolean</code> | <code>true</code> | Always revoke the used refresh token and issue a new one for the `refresh_token` grant. |

<a name="AbstractGrantType+generateAccessToken"></a>

### abstractGrantType.generateAccessToken(client, user, scope) ⇒ <code>Promise.&lt;string&gt;</code>
Generate access token.
If the model implements `generateAccessToken` then
this implementation will be used.
Otherwise, falls back to an internal implementation from `TokenUtil.generateRandomToken`.

**Kind**: instance method of [<code>AbstractGrantType</code>](#AbstractGrantType)  

| Param | Type |
| --- | --- |
| client | <code>ClientData</code> | 
| user | <code>object</code> | 
| scope | <code>Array.&lt;string&gt;</code> \| <code>undefined</code> | 

<a name="AbstractGrantType+generateRefreshToken"></a>

### abstractGrantType.generateRefreshToken(client, user, scope)
Generate refresh token.

**Kind**: instance method of [<code>AbstractGrantType</code>](#AbstractGrantType)  

| Param | Type |
| --- | --- |
| client | <code>ClientData</code> | 
| user | <code>object</code> | 
| scope | <code>Array.&lt;string&gt;</code> \| <code>undefined</code> | 

<a name="AbstractGrantType+getAccessTokenExpiresAt"></a>

### abstractGrantType.getAccessTokenExpiresAt()
Get access token expiration date.

**Kind**: instance method of [<code>AbstractGrantType</code>](#AbstractGrantType)  
<a name="AbstractGrantType+getRefreshTokenExpiresAt"></a>

### abstractGrantType.getRefreshTokenExpiresAt() ⇒ <code>Date</code>
Get refresh token expiration date (now + refresh token lifetime)

**Kind**: instance method of [<code>AbstractGrantType</code>](#AbstractGrantType)  
<a name="AbstractGrantType+getScope"></a>

### abstractGrantType.getScope(request) ⇒ <code>Array.&lt;string&gt;</code> \| <code>undefined</code>
Get scope from the request body.

**Kind**: instance method of [<code>AbstractGrantType</code>](#AbstractGrantType)  

| Param | Type |
| --- | --- |
| request | <code>Request</code> | 

<a name="AbstractGrantType+validateScope"></a>

### abstractGrantType.validateScope(user, client, scope) ⇒ <code>Promise.&lt;(Array.&lt;string&gt;\|undefined)&gt;</code>
Validate requested scope.
Delegates validation to the Model's `validateScope` method,
if the model implements this method.
Otherwise, treats given scope as valid.

**Kind**: instance method of [<code>AbstractGrantType</code>](#AbstractGrantType)  
**Returns**: <code>Promise.&lt;(Array.&lt;string&gt;\|undefined)&gt;</code> - the validated scope  
**Throws**:

- <code>InvalidScopeError</code> if the {Model#validateScope} method returned a falsy value


| Param | Type |
| --- | --- |
| user | <code>object</code> | 
| client | <code>ClientData</code> | 
| scope | <code>Array.&lt;string&gt;</code> \| <code>undefined</code> | 


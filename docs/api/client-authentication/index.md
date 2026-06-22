<a name="module_client-authentication"></a>

## client-authentication
Pluggable client authentication for the token endpoint. Each
`token_endpoint_auth_method` is an adapter against
[AbstractClientAuthentication](AbstractClientAuthentication); this module owns *selection* (pick the
one method that applies, reject requests presenting more than one) and the
shared *post-validation* of the resolved client.


* [client-authentication](#module_client-authentication)
    * [~defaultClientAuthenticationMethods()](#module_client-authentication..defaultClientAuthenticationMethods) ⇒ <code>Object.&lt;string, AbstractClientAuthentication&gt;</code>
    * [~authenticateClient(request, response, options)](#module_client-authentication..authenticateClient) ⇒ <code>Promise.&lt;Client&gt;</code>
    * [~selectMethod()](#module_client-authentication..selectMethod)

<a name="module_client-authentication..defaultClientAuthenticationMethods"></a>

### client-authentication~defaultClientAuthenticationMethods() ⇒ <code>Object.&lt;string, AbstractClientAuthentication&gt;</code>
The client-authentication methods enabled by default. These reproduce the
library's historical behaviour (HTTP Basic, request-body credentials, and
public clients). JWT client assertions are intentionally NOT enabled by
default — they require per-deployment configuration (the expected
`audience`) — and are added via the `extendedClientAuthentication` option.

**Kind**: inner method of [<code>client-authentication</code>](#module_client-authentication)  
<a name="module_client-authentication..authenticateClient"></a>

### client-authentication~authenticateClient(request, response, options) ⇒ <code>Promise.&lt;Client&gt;</code>
Select the single client-authentication method that applies to the request
and use it to resolve and validate the authenticated client.

**Kind**: inner method of [<code>client-authentication</code>](#module_client-authentication)  
**Returns**: <code>Promise.&lt;Client&gt;</code> - the authenticated client  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Request</code> |  |
| response | <code>Response</code> |  |
| options | <code>object</code> |  |
| options.model | <code>Model</code> | the configured model |
| options.methods | <code>Object.&lt;string, AbstractClientAuthentication&gt;</code> | the enabled methods |
| options.clientAuthenticationRequired | <code>boolean</code> | whether the grant requires client authentication |
| options.isPKCE | <code>boolean</code> | whether this is a PKCE request (public clients are always permitted) |

<a name="module_client-authentication..selectMethod"></a>

### client-authentication~selectMethod()
Decide which method authenticates this request.

Rejects requests that present more than one credential-bearing mechanism
(RFC 6749 §2.3). When no credentials are presented, a public (`none`)
client is accepted only for PKCE requests or grants that do not require
client authentication.

**Kind**: inner method of [<code>client-authentication</code>](#module_client-authentication)  

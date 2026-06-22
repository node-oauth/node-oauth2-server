<a name="AbstractClientAuthentication"></a>

## *AbstractClientAuthentication*
Port for a single client-authentication method — an OAuth
`token_endpoint_auth_method` (e.g. `client_secret_basic`, `private_key_jwt`).

Concrete adapters are responsible only for (a) recognising their own
credential shape on the incoming request and (b) verifying those
credentials and resolving the client. *Selection* (which method applies,
rejecting requests that present more than one) and *post-validation* (the
client's `grants`) are owned by the orchestrator, not the adapter.

This is deliberately minimal so that new methods — mTLS
(`tls_client_auth`), attestation, etc. — can be added without touching the
token handler. The built-in methods are themselves implemented against this
same port.

**Kind**: global abstract class  

* *[AbstractClientAuthentication](#AbstractClientAuthentication)*
    * *[.requiresCredentials](#AbstractClientAuthentication+requiresCredentials) ⇒ <code>boolean</code>*
    * *[.presentedMethod(request)](#AbstractClientAuthentication+presentedMethod) ⇒ <code>string</code>*
    * *[.matches(request)](#AbstractClientAuthentication+matches) ⇒ <code>boolean</code>*
    * *[.authenticate(request, context)](#AbstractClientAuthentication+authenticate) ⇒ <code>Promise.&lt;Client&gt;</code>*

<a name="AbstractClientAuthentication+requiresCredentials"></a>

### *abstractClientAuthentication.requiresCredentials ⇒ <code>boolean</code>*
Whether this method presents client *credentials* (`true`) or merely
identifies a public client (`false`, e.g. the `none` method).

The orchestrator uses this — not the `method` identifier — to enforce
that a request presents at most one credentialed mechanism and to decide
when a public client is acceptable. A new credentialed method (e.g.
`tls_client_auth`) therefore needs no changes elsewhere.

**Kind**: instance property of [<code>AbstractClientAuthentication</code>](#AbstractClientAuthentication)  
<a name="AbstractClientAuthentication+presentedMethod"></a>

### *abstractClientAuthentication.presentedMethod(request) ⇒ <code>string</code>*
The OAuth `token_endpoint_auth_method` this request presents
(e.g. `client_secret_basic`, `private_key_jwt`). For most methods this is
a constant; for JWT client assertions it is derived from the assertion's
algorithm. The orchestrator uses it to enforce a client's registered
`tokenEndpointAuthMethod`, when the client declares one.

**Kind**: instance method of [<code>AbstractClientAuthentication</code>](#AbstractClientAuthentication)  

| Param | Type |
| --- | --- |
| request | <code>Request</code> | 

<a name="AbstractClientAuthentication+matches"></a>

### *abstractClientAuthentication.matches(request) ⇒ <code>boolean</code>*
Does the request present credentials for this method?

MUST be a cheap, side-effect-free predicate: no model calls, no network,
no throwing. The orchestrator calls this on every registered method to
decide which one applies.

**Kind**: instance method of [<code>AbstractClientAuthentication</code>](#AbstractClientAuthentication)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Request</code> | the incoming token request |

<a name="AbstractClientAuthentication+authenticate"></a>

### *abstractClientAuthentication.authenticate(request, context) ⇒ <code>Promise.&lt;Client&gt;</code>*
Verify the presented credentials and resolve the authenticated client.

Implementations MUST throw an `InvalidClientError` when authentication
fails (or an `InvalidRequestError` for malformed input) and MUST NOT
return a falsy client for a credential they accepted.

**Kind**: instance method of [<code>AbstractClientAuthentication</code>](#AbstractClientAuthentication)  
**Returns**: <code>Promise.&lt;Client&gt;</code> - the authenticated client  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Request</code> | the incoming token request |
| context | <code>object</code> |  |
| context.model | <code>Model</code> | the configured model |


<a name="module_jws-util"></a>

## jws-util
Shared JWS/JWT helpers for the JWT assertion features (client authentication
and the JWT bearer grant). These encode security-sensitive policy — the
algorithm-family pinning that prevents algorithm-confusion, and the
classification of jose errors as client/grant faults vs. operational
(server) faults — so both features stay aligned by sharing one source.


* [jws-util](#module_jws-util)
    * [~isHmac(alg)](#module_jws-util..isHmac) ⇒ <code>boolean</code>
    * [~algorithmsForHeader(header)](#module_jws-util..algorithmsForHeader) ⇒ <code>Array.&lt;string&gt;</code>
    * [~isValidationError(e)](#module_jws-util..isValidationError) ⇒ <code>boolean</code>
    * [~replayId(assertion, [jti])](#module_jws-util..replayId) ⇒ <code>string</code>
    * [~getRemoteJwks(uri)](#module_jws-util..getRemoteJwks) ⇒ <code>function</code>

<a name="module_jws-util..isHmac"></a>

### jws-util~isHmac(alg) ⇒ <code>boolean</code>
Whether a JWS algorithm is an HMAC (`HS*`) algorithm.

**Kind**: inner method of [<code>jws-util</code>](#module_jws-util)  

| Param | Type |
| --- | --- |
| alg | <code>string</code> | 

<a name="module_jws-util..algorithmsForHeader"></a>

### jws-util~algorithmsForHeader(header) ⇒ <code>Array.&lt;string&gt;</code>
The accepted algorithm family for a JWS header (HMAC vs. asymmetric).

**Kind**: inner method of [<code>jws-util</code>](#module_jws-util)  

| Param | Type | Description |
| --- | --- | --- |
| header | <code>object</code> | the decoded JWS protected header |

<a name="module_jws-util..isValidationError"></a>

### jws-util~isValidationError(e) ⇒ <code>boolean</code>
Whether a thrown error is a jose assertion-validation error (vs. operational).

**Kind**: inner method of [<code>jws-util</code>](#module_jws-util)  

| Param | Type |
| --- | --- |
| e | <code>Error</code> | 

<a name="module_jws-util..replayId"></a>

### jws-util~replayId(assertion, [jti]) ⇒ <code>string</code>
A stable replay identifier for an assertion: its `jti` claim when present,
otherwise a fingerprint of the JWS *signing input* (`header.payload`).

The signing input — not the full compact JWT — is hashed on purpose: ECDSA
signatures are malleable (a valid `(r, s)` yields a valid `(r, n-s)`), so a
fingerprint over the whole token could be evaded by replaying a re-encoded
signature. The signing input is identical across such variants.

**Kind**: inner method of [<code>jws-util</code>](#module_jws-util)  

| Param | Type | Description |
| --- | --- | --- |
| assertion | <code>string</code> | the compact JWT (verified before this is called) |
| [jti] | <code>string</code> | the assertion's `jti` claim, if present |

<a name="module_jws-util..getRemoteJwks"></a>

### jws-util~getRemoteJwks(uri) ⇒ <code>function</code>
Resolve a (cached) remote JWK Set for the given URI.

**Kind**: inner method of [<code>jws-util</code>](#module_jws-util)  
**Returns**: <code>function</code> - a jose key-resolution function  

| Param | Type |
| --- | --- |
| uri | <code>string</code> | 


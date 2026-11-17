## Classes

<dl>
<dt><a href="#JwtBearerGrantType">JwtBearerGrantType</a> ⇐ <code>AbstractGrantType</code></dt>
<dd><p>The JWT bearer authorization grant (RFC 7521 §4.1, RFC 7523 §2.1/§3): a signed
JWT <em>is</em> the authorization grant. The assertion&#39;s <code>iss</code> identifies a trusted
issuer (whose key verifies the assertion) and <code>sub</code> identifies the principal
the access token is issued for. Unlike JWT <em>client authentication</em>, <code>sub</code> is
the user/principal — not the client — and <code>iss</code>/<code>sub</code> are not bound to the
client id.</p>
<p>This is an extension grant; register it via <code>extendedGrantTypes</code>. The
requested <code>scope</code> is taken from the body parameter (RFC 7521 §4.1), and no
refresh token is issued (RFC 7521 §5.2).</p>
<p>The model must implement:</p>
<ul>
<li><code>getJWTBearerIssuer(issuer)</code> → <code>{ audience, jwks | jwksUri | secret }</code> (or
falsy for an untrusted issuer) — the verification key material and the
expected <code>aud</code>.</li>
<li><code>getJWTBearerUser({ issuer, subject, client, scope, jti, assertionId, exp })</code> → the
authorized user (or falsy to deny). Replay (<code>jti</code>) can be enforced here.</li>
</ul>
</dd>
</dl>

## Constants

<dl>
<dt><a href="#GRANT_TYPE">GRANT_TYPE</a></dt>
<dd><p>The <code>grant_type</code> value for the JWT bearer authorization grant.</p>
</dd>
</dl>

<a name="JwtBearerGrantType"></a>

## JwtBearerGrantType ⇐ <code>AbstractGrantType</code>
The JWT bearer authorization grant (RFC 7521 §4.1, RFC 7523 §2.1/§3): a signed
JWT *is* the authorization grant. The assertion's `iss` identifies a trusted
issuer (whose key verifies the assertion) and `sub` identifies the principal
the access token is issued for. Unlike JWT *client authentication*, `sub` is
the user/principal — not the client — and `iss`/`sub` are not bound to the
client id.

This is an extension grant; register it via `extendedGrantTypes`. The
requested `scope` is taken from the body parameter (RFC 7521 §4.1), and no
refresh token is issued (RFC 7521 §5.2).

The model must implement:
  - `getJWTBearerIssuer(issuer)` → `{ audience, jwks | jwksUri | secret }` (or
    falsy for an untrusted issuer) — the verification key material and the
    expected `aud`.
  - `getJWTBearerUser({ issuer, subject, client, scope, jti, assertionId, exp })` → the
    authorized user (or falsy to deny). Replay (`jti`) can be enforced here.

**Kind**: global class  
**Extends**: <code>AbstractGrantType</code>  
**See**

- https://datatracker.ietf.org/doc/html/rfc7521#section-4.1
- https://datatracker.ietf.org/doc/html/rfc7523#section-2.1
- https://datatracker.ietf.org/doc/html/rfc7523#section-3


* [JwtBearerGrantType](#JwtBearerGrantType) ⇐ <code>AbstractGrantType</code>
    * [new JwtBearerGrantType()](#new_JwtBearerGrantType_new)
    * [.handle(request, client)](#JwtBearerGrantType+handle)
    * [.verifyAssertion()](#JwtBearerGrantType+verifyAssertion)
    * [.getKey()](#JwtBearerGrantType+getKey)
    * [.getUser()](#JwtBearerGrantType+getUser)
    * [.saveToken()](#JwtBearerGrantType+saveToken)

<a name="new_JwtBearerGrantType_new"></a>

### new JwtBearerGrantType()
**Example**  
```js
new OAuth2Server({
  model,
  extendedGrantTypes: {
    'urn:ietf:params:oauth:grant-type:jwt-bearer': JwtBearerGrantType
  },
  // typically a public requester; identify it with `client_id`:
  requireClientAuthentication: { 'urn:ietf:params:oauth:grant-type:jwt-bearer': false }
});
```
<a name="JwtBearerGrantType+handle"></a>

### jwtBearerGrantType.handle(request, client)
Handle the JWT bearer grant.

**Kind**: instance method of [<code>JwtBearerGrantType</code>](#JwtBearerGrantType)  
**See**: https://datatracker.ietf.org/doc/html/rfc7523#section-2.1  

| Param | Type |
| --- | --- |
| request | <code>Request</code> | 
| client | <code>ClientData</code> | 

<a name="JwtBearerGrantType+verifyAssertion"></a>

### jwtBearerGrantType.verifyAssertion()
Verify the `assertion` and return its (trusted) claims.

**Kind**: instance method of [<code>JwtBearerGrantType</code>](#JwtBearerGrantType)  
<a name="JwtBearerGrantType+getKey"></a>

### jwtBearerGrantType.getKey()
Resolve the verification key for the issuer (HMAC secret or asymmetric JWKS).

**Kind**: instance method of [<code>JwtBearerGrantType</code>](#JwtBearerGrantType)  
<a name="JwtBearerGrantType+getUser"></a>

### jwtBearerGrantType.getUser()
Resolve and authorize the principal (`sub`) the token is issued for.

**Kind**: instance method of [<code>JwtBearerGrantType</code>](#JwtBearerGrantType)  
<a name="JwtBearerGrantType+saveToken"></a>

### jwtBearerGrantType.saveToken()
Save and return the access token. No refresh token is issued (RFC 7521 §5.2).

**Kind**: instance method of [<code>JwtBearerGrantType</code>](#JwtBearerGrantType)  
<a name="GRANT_TYPE"></a>

## GRANT\_TYPE
The `grant_type` value for the JWT bearer authorization grant.

**Kind**: global constant  
**See**: https://datatracker.ietf.org/doc/html/rfc7523#section-2.1  

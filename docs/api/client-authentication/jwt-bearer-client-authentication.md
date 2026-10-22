## Classes

<dl>
<dt><a href="#JwtBearerClientAuthentication">JwtBearerClientAuthentication</a> ⇐ <code>AbstractClientAuthentication</code></dt>
<dd><p>JWT client assertion authentication — <code>client_assertion</code> +
<code>client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer</code>.</p>
<p>Covers both OIDC methods, distinguished by the JWS <code>alg</code> of the assertion:</p>
<ul>
<li><code>client_secret_jwt</code> — HMAC (<code>HS*</code>), keyed by the client secret;</li>
<li><code>private_key_jwt</code>   — asymmetric (<code>RS*</code>/<code>PS*</code>/<code>ES*</code>), verified against
the client&#39;s registered public keys (a JWK Set).</li>
</ul>
<p>The library owns the <em>protocol</em> (parse → resolve client → verify → bind);
key material and replay state come from the model/client. This method is
opt-in (it requires per-deployment <code>audience</code> configuration); register it
via the <code>extendedClientAuthentication</code> server option.</p>
</dd>
<dt><a href="#JwtBearerClientAuthentication">JwtBearerClientAuthentication</a></dt>
<dd></dd>
</dl>

## Constants

<dl>
<dt><a href="#CLIENT_ASSERTION_TYPE">CLIENT_ASSERTION_TYPE</a></dt>
<dd><p>The <code>client_assertion_type</code> value identifying a JWT client assertion.</p>
</dd>
</dl>

<a name="JwtBearerClientAuthentication"></a>

## JwtBearerClientAuthentication ⇐ <code>AbstractClientAuthentication</code>
JWT client assertion authentication — `client_assertion` +
`client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer`.

Covers both OIDC methods, distinguished by the JWS `alg` of the assertion:
  - `client_secret_jwt` — HMAC (`HS*`), keyed by the client secret;
  - `private_key_jwt`   — asymmetric (`RS*`/`PS*`/`ES*`), verified against
    the client's registered public keys (a JWK Set).

The library owns the *protocol* (parse → resolve client → verify → bind);
key material and replay state come from the model/client. This method is
opt-in (it requires per-deployment `audience` configuration); register it
via the `extendedClientAuthentication` server option.

**Kind**: global class  
**Extends**: <code>AbstractClientAuthentication</code>  
**See**

- https://datatracker.ietf.org/doc/html/rfc7521#section-4.2
- https://datatracker.ietf.org/doc/html/rfc7523#section-2.2
- https://datatracker.ietf.org/doc/html/rfc7523#section-3
- https://openid.net/specs/openid-connect-core-1_0.html#ClientAuthentication


* [JwtBearerClientAuthentication](#JwtBearerClientAuthentication) ⇐ <code>AbstractClientAuthentication</code>
    * [new JwtBearerClientAuthentication(options)](#new_JwtBearerClientAuthentication_new)
    * [.defaultGetKey()](#JwtBearerClientAuthentication+defaultGetKey)
    * [.assertNotReplayed()](#JwtBearerClientAuthentication+assertNotReplayed)

<a name="new_JwtBearerClientAuthentication_new"></a>

### new JwtBearerClientAuthentication(options)

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> |  |
| options.audience | <code>string</code> \| <code>Array.&lt;string&gt;</code> | the value(s) the assertion's   `aud` claim must contain — typically this authorization server's token   endpoint URL and/or its issuer identifier. REQUIRED. |
| [options.maxTokenAge] | <code>number</code> | maximum assertion age in seconds,   measured from `iat` (enabling this requires assertions to carry `iat`). |
| [options.clockTolerance] | <code>number</code> | clock skew tolerance in seconds. |
| [options.algorithms] | <code>Array.&lt;string&gt;</code> | override the accepted JWS algorithms. |
| [options.getKey] | <code>function</code> | `(client, header) => key` override key   resolution. By default HMAC keys derive from `client.secret` and   asymmetric keys come from `client.jwks` (a JWK Set) or `client.jwksUri`. |

<a name="JwtBearerClientAuthentication+defaultGetKey"></a>

### jwtBearerClientAuthentication.defaultGetKey()
Default key resolution: HMAC from the client secret, asymmetric from the
client's registered JWK Set (inline `jwks` or remote `jwksUri`).

**Kind**: instance method of [<code>JwtBearerClientAuthentication</code>](#JwtBearerClientAuthentication)  
<a name="JwtBearerClientAuthentication+assertNotReplayed"></a>

### jwtBearerClientAuthentication.assertNotReplayed()
Single-use replay protection. Opt-in: only enforced when the model
implements the replay hooks. The identifier passed to the hooks is the
assertion's `jti` when present, otherwise a fingerprint of its signing
input — so replay protection applies even to assertions without a `jti`
(OIDC Core §9 requires `jti`; RFC 7523 §3 makes it optional).

**Kind**: instance method of [<code>JwtBearerClientAuthentication</code>](#JwtBearerClientAuthentication)  
<a name="JwtBearerClientAuthentication"></a>

## JwtBearerClientAuthentication
**Kind**: global class  

* [JwtBearerClientAuthentication](#JwtBearerClientAuthentication)
    * [new JwtBearerClientAuthentication(options)](#new_JwtBearerClientAuthentication_new)
    * [.defaultGetKey()](#JwtBearerClientAuthentication+defaultGetKey)
    * [.assertNotReplayed()](#JwtBearerClientAuthentication+assertNotReplayed)

<a name="new_JwtBearerClientAuthentication_new"></a>

### new JwtBearerClientAuthentication(options)

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> |  |
| options.audience | <code>string</code> \| <code>Array.&lt;string&gt;</code> | the value(s) the assertion's   `aud` claim must contain — typically this authorization server's token   endpoint URL and/or its issuer identifier. REQUIRED. |
| [options.maxTokenAge] | <code>number</code> | maximum assertion age in seconds,   measured from `iat` (enabling this requires assertions to carry `iat`). |
| [options.clockTolerance] | <code>number</code> | clock skew tolerance in seconds. |
| [options.algorithms] | <code>Array.&lt;string&gt;</code> | override the accepted JWS algorithms. |
| [options.getKey] | <code>function</code> | `(client, header) => key` override key   resolution. By default HMAC keys derive from `client.secret` and   asymmetric keys come from `client.jwks` (a JWK Set) or `client.jwksUri`. |

<a name="JwtBearerClientAuthentication+defaultGetKey"></a>

### jwtBearerClientAuthentication.defaultGetKey()
Default key resolution: HMAC from the client secret, asymmetric from the
client's registered JWK Set (inline `jwks` or remote `jwksUri`).

**Kind**: instance method of [<code>JwtBearerClientAuthentication</code>](#JwtBearerClientAuthentication)  
<a name="JwtBearerClientAuthentication+assertNotReplayed"></a>

### jwtBearerClientAuthentication.assertNotReplayed()
Single-use replay protection. Opt-in: only enforced when the model
implements the replay hooks. The identifier passed to the hooks is the
assertion's `jti` when present, otherwise a fingerprint of its signing
input — so replay protection applies even to assertions without a `jti`
(OIDC Core §9 requires `jti`; RFC 7523 §3 makes it optional).

**Kind**: instance method of [<code>JwtBearerClientAuthentication</code>](#JwtBearerClientAuthentication)  
<a name="CLIENT_ASSERTION_TYPE"></a>

## CLIENT\_ASSERTION\_TYPE
The `client_assertion_type` value identifying a JWT client assertion.

**Kind**: global constant  
**See**: https://datatracker.ietf.org/doc/html/rfc7523#section-2.2  

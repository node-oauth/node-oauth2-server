## Modules

<dl>
<dt><a href="#module_pkce">pkce</a></dt>
<dd></dd>
</dl>

## Constants

<dl>
<dt><a href="#codeChallengeAndVerifierRegexp">codeChallengeAndVerifierRegexp</a> : <code>RegExp</code></dt>
<dd><p>ABNF for &quot;code_verifier&quot; and &quot;code_challenge&quot; is as follows.</p>
<p>code-verifier = 43*128unreserved
unreserved = ALPHA / DIGIT / &quot;-&quot; / &quot;.&quot; / &quot;_&quot; / &quot;~&quot;
ALPHA = %x41-5A / %x61-7A
DIGIT = %x30-39</p>
</dd>
</dl>

<a name="module_pkce"></a>

## pkce

* [pkce](#module_pkce)
    * [~getHashForCodeChallenge(options)](#module_pkce..getHashForCodeChallenge) ⇒ <code>String</code> \| <code>undefined</code>
    * [~codeChallengeMatchesABNF(codeChallenge)](#module_pkce..codeChallengeMatchesABNF) ⇒ <code>Boolean</code>
    * [~isPKCERequest(options)](#module_pkce..isPKCERequest) ⇒ <code>boolean</code>
    * [~isValidMethod(method)](#module_pkce..isValidMethod) ⇒ <code>boolean</code>

<a name="module_pkce..getHashForCodeChallenge"></a>

### pkce~getHashForCodeChallenge(options) ⇒ <code>String</code> \| <code>undefined</code>
Return hash for code-challenge method-type.

**Kind**: inner method of [<code>pkce</code>](#module_pkce)  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | Inputs, e.g. `getHashForCodeChallenge({method: 'S256', verifier})`. |
| options.method | <code>String</code> | the code challenge method |
| options.verifier | <code>String</code> | the code_verifier |

<a name="module_pkce..codeChallengeMatchesABNF"></a>

### pkce~codeChallengeMatchesABNF(codeChallenge) ⇒ <code>Boolean</code>
Matches a code verifier (or code challenge) against the following criteria:

code-verifier = 43*128unreserved
unreserved = ALPHA / DIGIT / "-" / "." / "_" / "~"
ALPHA = %x41-5A / %x61-7A
DIGIT = %x30-39

**Kind**: inner method of [<code>pkce</code>](#module_pkce)  
**See:**: https://datatracker.ietf.org/doc/html/rfc7636#section-4.1  

| Param | Type |
| --- | --- |
| codeChallenge | <code>String</code> | 

<a name="module_pkce..isPKCERequest"></a>

### pkce~isPKCERequest(options) ⇒ <code>boolean</code>
Check if the request is a PKCE request. We assume PKCE if grant type is
'authorization_code' and code verifier is present.

**Kind**: inner method of [<code>pkce</code>](#module_pkce)  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | Inputs, e.g. `isPKCERequest({grantType: 'authorization_code', codeVerifier})`. |
| options.grantType | <code>String</code> |  |
| options.codeVerifier | <code>String</code> |  |

<a name="module_pkce..isValidMethod"></a>

### pkce~isValidMethod(method) ⇒ <code>boolean</code>
Checks if the code challenge method is one of the supported methods
'S256' or 'plain'

**Kind**: inner method of [<code>pkce</code>](#module_pkce)  

| Param | Type |
| --- | --- |
| method | <code>String</code> | 

<a name="codeChallengeAndVerifierRegexp"></a>

## codeChallengeAndVerifierRegexp : <code>RegExp</code>
ABNF for "code_verifier" and "code_challenge" is as follows.

code-verifier = 43*128unreserved
unreserved = ALPHA / DIGIT / "-" / "." / "_" / "~"
ALPHA = %x41-5A / %x61-7A
DIGIT = %x30-39

**Kind**: global constant  

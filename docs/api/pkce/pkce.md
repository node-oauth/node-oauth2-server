<a name="module_pkce"></a>

## pkce

* [pkce](#module_pkce)
    * [~getHashForCodeChallenge(method, verifier)](#module_pkce..getHashForCodeChallenge) ⇒ <code>String</code> \| <code>undefined</code>
    * [~codeChallengeMatchesABNF(codeChallenge)](#module_pkce..codeChallengeMatchesABNF) ⇒ <code>Boolean</code>
    * [~isPKCERequest(grantType, codeVerifier)](#module_pkce..isPKCERequest) ⇒ <code>boolean</code>
    * [~isValidMethod(method)](#module_pkce..isValidMethod) ⇒ <code>boolean</code>

<a name="module_pkce..getHashForCodeChallenge"></a>

### pkce~getHashForCodeChallenge(method, verifier) ⇒ <code>String</code> \| <code>undefined</code>
Return hash for code-challenge method-type.

**Kind**: inner method of [<code>pkce</code>](#module_pkce)  

| Param | Type | Description |
| --- | --- | --- |
| method | <code>String</code> | the code challenge method |
| verifier | <code>String</code> | the code_verifier |

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

### pkce~isPKCERequest(grantType, codeVerifier) ⇒ <code>boolean</code>
Check if the request is a PCKE request. We assume PKCE if grant type is
'authorization_code' and code verifier is present.

**Kind**: inner method of [<code>pkce</code>](#module_pkce)  

| Param | Type |
| --- | --- |
| grantType | <code>String</code> | 
| codeVerifier | <code>String</code> | 

<a name="module_pkce..isValidMethod"></a>

### pkce~isValidMethod(method) ⇒ <code>boolean</code>
Checks if the code challenge method is one of the supported methods
'sha256' or 'plain'

**Kind**: inner method of [<code>pkce</code>](#module_pkce)  

| Param | Type |
| --- | --- |
| method | <code>String</code> | 


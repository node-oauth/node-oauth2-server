<a name="module_ScopeUtil"></a>

## ScopeUtil
<a name="module_ScopeUtil..parseScope"></a>

### ScopeUtil~parseScope(requestedScope) ⇒ <code>undefined</code> \| <code>Array.&lt;string&gt;</code>
Utility to parse and validate a scope string.
Uses `isFormat` from [https://github.com/node-oauth/formats](https://github.com/node-oauth/formats) to
validate scopes against `nqchar` format.

**Kind**: inner method of [<code>ScopeUtil</code>](#module_ScopeUtil)  
**Throws**:

- <code>InvalidScopeError</code> if the type is not null, undefined or a string.

**See**: {https://github.com/node-oauth/formats}  

| Param | Type |
| --- | --- |
| requestedScope | <code>string</code> \| <code>undefined</code> \| <code>null</code> | 


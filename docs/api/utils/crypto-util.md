<a name="module_CryptoUtil"></a>

## CryptoUtil
<a name="module_CryptoUtil..createHash"></a>

### CryptoUtil~createHash(options) ⇒ <code>Buffer</code> \| <code>string</code>
Creates a new hash by given algorithm, data and digest encoding.
Defaults to sha256.

**Kind**: inner method of [<code>CryptoUtil</code>](#module_CryptoUtil)  
**Returns**: <code>Buffer</code> \| <code>string</code> - if {output} is undefined, a {Buffer} is returned, otherwise a {String}  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>object</code> |  | Hash inputs, e.g. `createHash({data: 'hello', output: 'hex'})`. |
| [options.algorithm] | <code>string</code> | <code>&quot;&#x27;sha256&#x27;&quot;</code> | the hash algorithm |
| options.data | <code>Buffer</code> \| <code>string</code> \| <code>TypedArray</code> \| <code>DataView</code> |  | the data to hash |
| [options.encoding] | <code>string</code> |  | optional, the encoding of the input |
| [options.output] | <code>&#x27;base64&#x27;</code> \| <code>&#x27;base64url&#x27;</code> \| <code>&#x27;binary&#x27;</code> \| <code>&#x27;hex&#x27;</code> |  | optional, the desired output type |


<a name="module_DateUtil"></a>

## DateUtil
<a name="module_DateUtil..getLifetimeFromExpiresAt"></a>

### DateUtil~getLifetimeFromExpiresAt(expiresAt) ⇒ <code>number</code>
Returns the remaining seconds of expiration from now.
If the value is less than or equal zero, then it is considered expired.

**Kind**: inner method of [<code>DateUtil</code>](#module_DateUtil)  
**Returns**: <code>number</code> - The number of seconds until the expiration date.  

| Param | Type | Description |
| --- | --- | --- |
| expiresAt | <code>Date</code> | The date at which something (e.g. a token) expires. |


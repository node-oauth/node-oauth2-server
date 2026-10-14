<a name="Request"></a>

## Request
Wrapper for webserver's request.
Used to decouple this package from the webserver's
request signature.

**Kind**: global class  

* [Request](#Request)
    * [new Request(options)](#new_Request_new)
    * [.get(field)](#Request+get) ⇒ <code>string</code> \| <code>undefined</code>
    * [.is(...types)](#Request+is) ⇒ <code>string</code> \| <code>false</code>

<a name="new_Request_new"></a>

### new Request(options)
Creates a new request instance
Additional properties on options are copied onto the wrapper.

**Throws**:

- <code>InvalidArgumentError</code> if one of headers, method or query are missing.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | Wrapper options. |
| options.headers | <code>object</code> | key-value object of headers |
| options.method | <code>string</code> | the HTTP method |
| options.query | <code>object</code> | key-value object of query parameters |
| [options.body] | <code>object</code> | optional key-value object of body parameters |

**Example**  
```js
const { Request } = require('@node-oauth/oauth2-server');
const request = new Request({ method: 'GET', headers: {}, query: {} });
```
<a name="Request+get"></a>

### request.get(field) ⇒ <code>string</code> \| <code>undefined</code>
Get a request header (case-insensitive).

**Kind**: instance method of [<code>Request</code>](#Request)  

| Param | Type |
| --- | --- |
| field | <code>String</code> | 

<a name="Request+is"></a>

### request.is(...types) ⇒ <code>string</code> \| <code>false</code>
Check if the content-type matches any of the given mime types.

**Kind**: instance method of [<code>Request</code>](#Request)  

| Param | Type |
| --- | --- |
| ...types | <code>Array.&lt;string&gt;</code> | 


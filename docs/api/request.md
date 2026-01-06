<a name="Request"></a>

## Request
Wrapper for webserver's request.
Used to decouple this package from the webserver's
request signature.

**Kind**: global class  

* [Request](#Request)
    * [new Request(headers, method, query, [body], ...otherOptions)](#new_Request_new)
    * [.get(field)](#Request+get) ⇒ <code>string</code>
    * [.is(...types)](#Request+is) ⇒ <code>boolean</code>

<a name="new_Request_new"></a>

### new Request(headers, method, query, [body], ...otherOptions)
Creates a new request instance

**Throws**:

- <code>InvalidArgumentError</code> if one of headers, method or query are missing.


| Param | Type | Description |
| --- | --- | --- |
| headers | <code>object</code> | key-value object of headers |
| method | <code>string</code> | the HTTP method |
| query | <code>object</code> | key-value object of query parameters |
| [body] | <code>object</code> | optional key-value object of body parameters |
| ...otherOptions | <code>object</code> | any other properties that should be assigned to the request by your webserver |

**Example**  
```js
function (req, res, next) {
  // most webservers follow a similar structure
  const response = new Request(req);
}
```
<a name="Request+get"></a>

### request.get(field) ⇒ <code>string</code>
Get a request header (case-insensitive).

**Kind**: instance method of [<code>Request</code>](#Request)  

| Param | Type |
| --- | --- |
| field | <code>String</code> | 

<a name="Request+is"></a>

### request.is(...types) ⇒ <code>boolean</code>
Check if the content-type matches any of the given mime types.

**Kind**: instance method of [<code>Request</code>](#Request)  

| Param | Type |
| --- | --- |
| ...types | <code>Array.&lt;string&gt;</code> | 


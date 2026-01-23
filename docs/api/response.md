<a name="Response"></a>

## Response
Wrapper for webserver's response object.
Used to decouple this package from the webserver's
response signature.

**Kind**: global class  

* [Response](#Response)
    * [new Response(headers, method, [body], ...otherOptions)](#new_Response_new)
    * [.get(field)](#Response+get) ⇒ <code>string</code> \| <code>undefined</code>
    * [.redirect(url)](#Response+redirect)
    * [.set(field, value)](#Response+set)

<a name="new_Response_new"></a>

### new Response(headers, method, [body], ...otherOptions)
Create a new Response instance.


| Param | Type | Description |
| --- | --- | --- |
| headers | <code>object</code> | key-value object of headers |
| method | <code>string</code> | the HTTP method |
| [body] | <code>object</code> | optional key-value object of body parameters |
| ...otherOptions | <code>object</code> | any other properties that should be assigned to the request by your webserver |

**Example**  
```js
function (req, res, next) {
  // most webservers follow a similar structure
  const response = new Response(res);
}
```
<a name="Response+get"></a>

### response.get(field) ⇒ <code>string</code> \| <code>undefined</code>
Get a response header.

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Description |
| --- | --- | --- |
| field | <code>string</code> | the field to access, case-insensitive |

<a name="Response+redirect"></a>

### response.redirect(url)
Redirect response.

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | the url to redirect to |

<a name="Response+set"></a>

### response.set(field, value)
Set a response header.

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Description |
| --- | --- | --- |
| field | <code>string</code> | the name of the header field, case-insensitive |
| value | <code>string</code> | the new value of the header field |


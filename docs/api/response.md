# Response

Represents an outgoing HTTP response.

    const Response = require('@node-oauth/oauth2-server').Response;

------------------------------------------------------------------------

## `new Response(options)`

Instantiates `Response` using the supplied options.

**Arguments:**

| Name                | Type   | Description                                                   |
|---------------------|--------|---------------------------------------------------------------|
| options             | Object | Response options.                                             |
| options.headers     | Object | The response's HTTP header fields.                            |
| \[options.body={}\] | Object | Key-value pairs of data to be submitted in the response body. |

All additional own properties are copied to the new `Response` object as well.

**Return value:**

A new `Response` instance.

**Remarks:**

The names of HTTP header fields passed in as `options.headers` are converted to lower case.

To convert [Express' response](https://expressjs.com/en/4x/api.html#res) to a `Response` simply pass `res` as `options`:

    function(req, res, next) {
      let response = new Response(res);
      // ...
    }

------------------------------------------------------------------------

## `get(field)`

Returns the specified HTTP header field. The match is case-insensitive.

**Arguments:**

| Name  | Type   | Description            |
|-------|--------|------------------------|
| field | String | The header field name. |

**Return value:**

The value of the header field or `undefined` if the field does not exist.

------------------------------------------------------------------------

## `set(field, value)`

Sets the specified HTTP header field. The match is case-insensitive.

**Arguments:**

| Name  | Type   | Description             |
|-------|--------|-------------------------|
| field | String | The header field name.  |
| value | String | The header field value. |

**Return value:**

None.

------------------------------------------------------------------------

## `redirect(url)`

Redirects to the specified URL using `302 Found`.

**Arguments:**

| Name | Type   | Description             |
|------|--------|-------------------------|
| url  | String | The URL to redirect to. |

**Return value:**

None.

**Remarks:**

This is essentially a convenience function that sets `status` to `302` and the `Location` header to the provided URL.

------------------------------------------------------------------------

## `status`

The HTTP status of the response (default = `200`).

------------------------------------------------------------------------

## `headers`

The response's HTTP header fields. Prefer `Response#get() <Response#get>`/`Response#set() <Response#set>` over accessing this object directly.

------------------------------------------------------------------------

## `body`

Key-value pairs of data to be submitted in the response body.

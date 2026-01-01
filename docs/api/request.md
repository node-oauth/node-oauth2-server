# Request

Represents an incoming HTTP request.

    const Request = require('@node-oauth/oauth2-server').Request;

------------------------------------------------------------------------

## `new Request(options)`

Instantiates `Request` using the supplied options.

**Arguments:**

| Name                | Type   | Description                                            |
|---------------------|--------|--------------------------------------------------------|
| options             | Object | Request options.                                       |
| options.method      | String | The HTTP method of the request.                        |
| options.query       | Object | The request's query string parameters.                 |
| options.headers     | Object | The request's HTTP header fields.                      |
| \[options.body={}\] | Object | Key-value pairs of data submitted in the request body. |

All additional own properties are copied to the new `Request` object as well.

**Return value:**

A new `Request` instance.

**Remarks:**

The names of HTTP header fields passed in as `options.headers` are converted to lower case.

To convert [Express' request](https://expressjs.com/en/4x/api.html#req) to a `Request` simply pass `req` as `options`:

    function(req, res, next) {
      let request = new Request(req);
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

## `is(types)`

Checks if the request's `Content-Type` HTTP header matches any of the given MIME types.

**Arguments:**

| Name  | Type                    | Description                       |
|-------|-------------------------|-----------------------------------|
| types | Array\<String\>\|String | The MIME type(s) to test against. |

**Return value:**

Returns the matching MIME type or `false` if there was no match.

------------------------------------------------------------------------

## `method`

The HTTP method of the request (`'GET'`, `'POST'`, `'PUT'`, ...).

------------------------------------------------------------------------

## `query`

The request's query string parameters.

------------------------------------------------------------------------

## `headers`

The request's HTTP header fields. Prefer `Request#get() <Request#get>` over accessing this object directly.

------------------------------------------------------------------------

## `body`

Key-value pairs of data submitted in the request body.

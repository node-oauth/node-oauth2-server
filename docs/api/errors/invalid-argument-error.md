<a name="InvalidArgumentError"></a>

## InvalidArgumentError
Thrown when an argument to a function or constructor is missing or of the
wrong type — i.e. a programming or configuration error in the code that
integrates this library (for example, a missing server option, or a `model`
that does not implement a required method).

`InvalidArgumentError` is **not** an OAuth 2.0 protocol error: its
`invalid_argument` code (HTTP 500) is not one of the error codes defined by
RFC 6749 and must never be sent to an OAuth client. How it surfaces therefore
depends on *when* it is raised:

- **At construction / configuration time** (missing options, a `model` missing
  a required method, or `request`/`response` not being instances of this
  library's `Request`/`Response`) it is thrown to your code unchanged, before
  any response is produced — so you can catch it while wiring up the server.
- **While handling a request** (for example, when a `model` returns malformed
  token data) the `token` and `authorize` handlers normalise it to a
  `ServerError` (`server_error`) before the response reaches the client,
  preserving the original error as `.inner`. So when you `catch` errors from
  `OAuth2Server#token` or `OAuth2Server#authorize`, expect a `ServerError`
  (inspect its `.inner`) for these cases — not an `InvalidArgumentError`.

**Kind**: global class  
<a name="new_InvalidArgumentError_new"></a>

### new InvalidArgumentError(message, [properties])

| Param | Type |
| --- | --- |
| message | <code>string</code> | 
| [properties] | <code>object</code> | 


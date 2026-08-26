<a name="None"></a>

## None ⇐ <code>AbstractClientAuthentication</code>
`none`: a public client that identifies itself with `client_id` only and
presents no secret (e.g. a PKCE flow, or a grant for which
`requireClientAuthentication` is disabled).

This adapter only resolves the client. Whether a secret-less client is
*acceptable* for the request is a policy decision owned by the orchestrator
(it knows the grant type, the `requireClientAuthentication` config and
whether this is a PKCE request).

**Kind**: global class  
**Extends**: <code>AbstractClientAuthentication</code>  
**See**: https://datatracker.ietf.org/doc/html/rfc6749#section-2.1  

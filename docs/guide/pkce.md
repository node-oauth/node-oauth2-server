# PKCE Support

Starting with release [4.3.0](https://github.com/node-oauth/node-oauth2-server/releases/tag/v4.3.0) this library 
supports PKCE (Proof Key for Code Exchange by OAuth Public Clients) as defined in [RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636).

The PKCE integrates only with the `authorization code <AuthorizationCodeGrant>`. The abstract workflow looks like
the following:

```
+-------------------+
|   Authz Server    |
+--------+                                | +---------------+ |
|        |--(A)- Authorization Request ---->|               | |
|        |       + t(code_verifier), t_m  | | Authorization | |
|        |                                | |    Endpoint   | |
|        |<-(B)---- Authorization Code -----|               | |
|        |                                | +---------------+ |
| Client |                                |                   |
|        |                                | +---------------+ |
|        |--(C)-- Access Token Request ---->|               | |
|        |          + code_verifier       | |    Token      | |
|        |                                | |   Endpoint    | |
|        |<-(D)------ Access Token ---------|               | |
+--------+                                | +---------------+ |
+-------------------+

Figure 2: Abstract Protocol Flow
```

See [Section 1 of RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636#section-1.1).

## 1. Authorization request

<div id="PKCE#authorizationRequest">

> 1.  The client creates and records a secret named the "code_verifier" and derives a transformed version "t(code_verifier)" (referred to as the "code_challenge"), which is sent in the OAuth 2.0 Authorization Request along with the transformation method "t_m".

</div>

The following shows an example of how a client could generate a <span class="title-ref">code_challenge</span><span class="title-ref"> and
</span><span class="title-ref">code_challenge_method</span>\` for the authorizazion request.

    const base64URLEncode = str => str.toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '')

    // This is the code_verifier, which is INITIALLY KEPT SECRET on the client
    // and which is later passed as request param to the token endpoint.
    // DO NOT SEND this with the authorization request!
    const codeVerifier = base64URLEncode(crypto.randomBytes(32))

    // This is the hashed version of the verifier, which is sent to the authorization endpoint.
    // This is named t(code_verifier) in the above workflow
    // Send this with the authorization request!
    const codeChallenge = base64URLEncode(crypto.createHash('sha256').update(codeVerifier).digest())

    // This is the name of the code challenge method
    // This is named t_m in the above workflow
    // Send this with the authorization request!
    const codeChallengeMethod = 'S256'

    // add these to the request that is fired from the client

In this project the authorize endpoint calls OAuth2Server.prototype.authorize which itself uses AuthorizeHandler.
If your Request body contains code_challenge and code_challenge_method then PKCE is active.

    const server = new OAuth2Server({ model })

    // this could be added to express or other middleware
    const authorizeEndpoint = function (req, res, next) {
      const request = new Request(req)
      req.query.code_challenge        // the codeChallenge value
      req.query.code_challenge_method // 'S256'

      server.authorize(request, response, options)
        .then(function (code) {
          // add code to response, code should not contain
          // code_challenge or code_challenge_method
        })
        .catch(function (err) {
          // handle error condition
        })
    }

## 2. Authorization response

<div id="PKCE#authorizationResponse">

> 2.  The Authorization Endpoint responds as usual but records "t(code_verifier)" and the transformation method.

</div>

The `AuthorizeHandler.handle` saves code challenge and code challenge method automatically via `model.saveAuthorizationCode`.
Note that this calls your model with additional properties `code.codeChallenge` and `code.codeChallengeMethod`.

## 3. Access Token Request

<div id="PKCE#accessTokenRequest">

> 3.  The client then sends the authorization code in the Access Token Request as usual but includes the "code_verifier" secret generated at (A).

</div>

This is usually done in your token endpoint, that uses `OAuth2Server.token`.

    const server = new OAuth2Server({ model })

    // ...authorizeEndpoint

    // this could be added to express or other middleware
    const tokenEndpoint = function (req, res, next) {
      const request = new Request(req)
      request.body.code_verifier // the non-hashed code verifier
      server.token(request, response, options)
            .then(function (code) {
              // add code to response, code should contain
            })
            .catch(function (err) {
              // handle error condition
            })
    }

Note that your client should have kept `code_verifier` a secret until this step and now includes it as param for the token endpoint call.

> 4.  The authorization server transforms "code_verifier" and compares it to "t(code_verifier)" from (B). Access is denied if they are not equal.

This will call `model.getAuthorizationCode` to load the code.
The loaded code has to contain `codeChallenge` and `codeChallengeMethod`.
If `model.saveAuthorizationCode` did not cover these values when saving the code then this step will deny the request.

See `Model#saveAuthorizationCode` and `Model#getAuthorizationCode`

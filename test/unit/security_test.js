// Security considerations outlined in section 10 of the OAuth 2.0 standard RFC(s)
// https://datatracker.ietf.org/doc/html/rfc6749.html#section-10

const should = require('chai').should();

describe('Security', function () {

  // https://datatracker.ietf.org/doc/html/rfc6749.html#section-10.1
  describe('10.1 - Client Authentication', function () {


    // Web application clients MUST ensure confidentiality of client passwords and 
    // other client credentials. The authorization server MUST NOT issue client 
    // passwords or other client credentials to native application or user-agent-based
    // application clients for the purpose of client authentication.  The
    // authorization server MAY issue a client password or other credentials
    // for a specific installation of a native application client on a
    // specific device.
    it('should not issue client passwords or other client credentials for the purpose of client authentication.', function () {

    });


    // When client authentication is not possible, the authorization server
    // SHOULD employ other means to validate the client's identity -- for
    // example, by requiring the registration of the client redirection URI
    // or enlisting the resource owner to confirm identity...
    it('should validate the client\'s identity by requiring the registration of the client redirection URI', function () {

    });


    // A valid redirection URI is not sufficient to verify the client's identity 
    // when asking for resource owner authorization but can be used to prevent 
    // delivering credentials to a counterfeit client after obtaining resource 
    // owner authorization.
    it('should validate the client\'s identity by enlisting the resource owner to confirm identity', function () {

    });

    // The authorization server must consider the security implications of
    // interacting with unauthenticated clients and take measures to limit
    // the potential exposure of other credentials (e.g., refresh tokens)
    // issued to such clients.
    it('should not expose refresh token to unauthenticated clients', function () {

    });

  });

  // https://datatracker.ietf.org/doc/html/rfc6749.html#section-10.2
  describe('10.2 - Client Impersonation', function () {

    // The authorization server MUST authenticate the client whenever
    // possible.
    it('should authenticate the client whenever possible. (untestable?)', function () {

    });

    // If the authorization server cannot authenticate the client
    // due to the client's nature, the authorization server MUST require the
    // registration of any redirection URI used for receiving authorization
    // responses and SHOULD utilize other means to protect resource owners
    // from such potentially malicious clients.  For example, the
    // authorization server can engage the resource owner to assist in
    // identifying the client and its origin.
    it('should require the registration of any redirection URI used for receiving authorization responses.', function () {

    });

    // The authorization server SHOULD enforce explicit resource owner
    // authentication and provide the resource owner with information about
    // the client and the requested authorization scope and lifetime.  It is
    // up to the resource owner to review the information in the context of
    // the current client and to authorize or deny the request.
    it('should provide the resource owner with information about the client and the requested authorization scope and lifetime.', function () {

    });

    // The authorization server SHOULD NOT process repeated authorization
    // requests automatically (without active resource owner interaction)
    // without authenticating the client or relying on other measures to
    // ensure that the repeated request comes from the original client and
    // not an impersonator.
    it('should NOT process repeated authorization requests automatically without authenticating the client to ensure that the repeated request comes from the original client and not an impersonator.', function () {

    });

  });

  // https://datatracker.ietf.org/doc/html/rfc6749.html#section-10.3
  describe('10.3 - Access Tokens', function () {


    // Access token credentials (as well as any confidential access token
    // attributes) MUST be kept confidential in transit and storage, and
    // only shared among the authorization server, the resource servers the
    // access token is valid for, and the client to whom the access token is
    // issued...
    it('should keep access token credentials (and it\'s attributes) confidential in transit and at rest', function () {

    });


    // ...Access token credentials MUST only be transmitted using TLS
    // as described in Section 1.6 with server authentication as defined by
    // [RFC2818].
    it('should transmit access token credentials using TLS (untestable?)', function () {

    });

    // When using the implicit grant type, the access token is transmitted
    // in the URI fragment, which can expose it to unauthorized parties.

    // The authorization server MUST ensure that access tokens cannot be
    // generated, modified, or guessed to produce valid access tokens by
    // unauthorized parties.
    it('should ensure that access tokens cannot be generated, modified, or guessed to produce valid access tokens by unauthorized parties when using implicit grant type', function () {

    });

    // The client SHOULD request access tokens with the minimal scope
    // necessary. The authorization server SHOULD take the client identity
    // into account when choosing how to honor the requested scope and MAY
    // issue an access token with less rights than requested.
    it('should issue access token with less rights than requested by client identity and scope', function () {

    });

  });

  // https://datatracker.ietf.org/doc/html/rfc6749.html#section-10.4
  describe('10.4 - Refresh Tokens', function () {

    // Authorization servers MAY issue refresh tokens to web application
    // clients and native application clients.
    it('should issue a refresh token', function () {

    });

    // Refresh tokens MUST be kept confidential in transit and storage
    it('should have encrypted the refresh token', function () {
      
    });

    // The authorization server MUST maintain the binding between a refresh 
    // token and the client to whom it was issued.
    it('should maintain the binding between the refresh token and client', function () {
      
    });

    // Refresh tokens MUST only be transmitted using TLS as described in 
    // Section 1.6 with server authentication as defined by [RFC2818].
    it('should transmit refresh tokens using TLS (untestable?)', function () {

    });

    // The authorization server MUST verify the binding between the refresh
    // token and client identity whenever the client identity can be
    // authenticated.  When client authentication is not possible, the
    // authorization server SHOULD deploy other means to detect refresh
    // token abuse.

    // For example, the authorization server could employ refresh token
    // rotation in which a new refresh token is issued with every access
    // token refresh response.  The previous refresh token is invalidated
    // but retained by the authorization server.  If a refresh token is
    // compromised and subsequently used by both the attacker and the
    // legitimate client, one of them will present an invalidated refresh
    // token, which will inform the authorization server of the breach.
    it('should rotate the refresh token with each access token refresh response (necessary?)', function () {
      
    });

    // The authorization server MUST ensure that refresh tokens cannot be
    // generated, modified, or guessed to produce valid refresh tokens by
    // unauthorized parties.
    it('should ensure that refresh tokens cannot be generated, modified, or guessed to produce valid refresh tokens by unauthorized parties', function () {
      
    });


  });

  // https://datatracker.ietf.org/doc/html/rfc6749.html#section-10.5
  describe('10.5 - Authorization Codes', function () {

    // The transmission of authorization codes SHOULD be made over a secure
    // channel, and the client SHOULD require the use of TLS with its
    // redirection URI if the URI identifies a network resource.  Since
    // authorization codes are transmitted via user-agent redirections, they
    // could potentially be disclosed through user-agent history and HTTP
    // referrer headers.
    it('should transmit authorization code over a secure channel.', function () {
      
    });

    // Authorization codes operate as plaintext bearer credentials, used to
    // verify that the resource owner who granted authorization at the
    // authorization server is the same resource owner returning to the
    // client to complete the process.  Therefore, if the client relies on
    // the authorization code for its own resource owner authentication, the
    // client redirection endpoint MUST require the use of TLS.
    it('should require the use of TLS with its redirection URI.', function () {
      
    });

    // Authorization codes MUST be short lived and single-use...  
    it('should have short lived authorization code', function () {
      
    });

    it('should have singe-use authorization code', function () {
      
    });
  
    // If the authorization server observes multiple attempts to exchange an
    // authorization code for an access token, the authorization server
    // SHOULD attempt to revoke all access tokens already granted based on
    // the compromised authorization code.
    it('should revoke all access tokens granted when multiple authorization code for an access token exchanges have been attempted (I assume this means failed failed)', function () {
      
    });

    // If the client can be authenticated, the authorization servers MUST
    // authenticate the client and ensure that the authorization code was
    // issued to the same client.
    it('should authenticate the client and issue an authorization code to that same client', function () {
      
    });

  });

  describe('10.6 - Authorization Code Redirection URI Manipulation', function () {
    
  });

  describe('10.7 - Resource Owner Password Credentials', function () {
    
  });

  describe('10.8 - Request Confidentiality', function () {
    
  });

  describe('10.9 - Ensuring Endpoint Authenticity', function () {
    
  });

  describe('10.10 - Credentials-Guessing Attacks', function () {
    
  });

  describe('10.11 - Phishing Attacks', function () {
    
  });

  describe('10.12 - Cross-Site Request Forgery', function () {
    
  });

  describe('10.13 - Clickjacking', function () {
    
  });

  describe('10.14 - Code Injection and Input Validation', function () {
    
  });

  describe('10.15 - Open Redirectors', function () {
    
  });

  describe('10.16 - Misuse of Access Token to Impersonate Resource Owner in Implicit Flow', function () {
    
  });

});
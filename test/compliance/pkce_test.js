/**
 * PKCE (Proof Key for Code Exchange) Compliance Tests
 * @see https://datatracker.ietf.org/doc/html/rfc7636
 *
 * These tests reproduce security vulnerabilities with PKCE while
 * ensuring that the server's behavior is compliant with RFC 7636.
 *
 * Note on RFC 7636 vs. security hardening:
 *
 * Not all the behaviors tested below are *normatively required* by
 * RFC 7636 itself. Where a test goes beyond the letter of the RFC we
 * note the distinction explicitly.
 *
 * 1. Attack scenario: The server accepts RFC 7636-invalid code_verifier
 *    values (e.g. single-character strings).  RFC 7636 §4.1 ABNF
 *    (`43*128unreserved`) targets the client, and §4.6 only says to
 *    hash-and-compare.  Server-side ABNF enforcement is not normatively
 *    required but is essential to preserve the 256-bit minimum entropy
 *    guarantee described in Appendix B.
 *
 * 2. Attack scenario: Failed PKCE verification does not revoke the
 *    authorization code.  RFC 7636 is silent on revocation; RFC 6749
 *    §4.1.2 is ambiguous on whether a failed PKCE attempt counts as
 *    "using" the code.  Revoking on failure is a security best practice
 *    to prevent online brute-force of the verifier.
 *
 * 3. Attack scenario (Beyond-spec hardening): When `code_challenge_method` is
 *    omitted the server defaults to "plain".  RFC 7636 §4.3 *does*
 *    specify that the server assumes "plain" when the parameter is
 *    absent, and §4.3 says the server MUST support "plain".  So
 *    defaulting to "plain" is technically RFC-compliant.  However,
 *    "plain" offers zero cryptographic protection, and both the OAuth
 *    2.0 Security BCP (draft-ietf-oauth-security-topics §2.1.1) and
 *    OAuth 2.1 deprecate "plain" in favour of S256.  The tests below
 *    therefore flag "plain" as a weakness, even though it does not
 *    violate RFC 7636 itself.
 */

const OAuth2Server = require('../..');
const DB = require('../helpers/db');
const createModel = require('../helpers/model');
const createRequest = require('../helpers/request');
const Response = require('../../lib/response');
const { base64URLEncode } = require('../../lib/utils/string-util');
const { createHash } = require('../../lib/utils/crypto-util');
const { InvalidRequestError } = require('../../index');
const ServerError = require('../../lib/errors/server-error');
require('chai').should();

/**
 * Compute the S256 code_challenge for a given verifier,
 * using the same logic the server uses internally.
 */
function computeS256Challenge (verifier) {
  const hash = createHash({ data: verifier });
  return base64URLEncode(hash);
}

describe('PKCE Compliance (RFC 7636)', function () {
  // ---------------------------------------------------------------
  // Shared fixtures
  // ---------------------------------------------------------------
  let db, oAuth2Server;

  const userDoc = { id: 'pkce-user-1', username: 'pkceuser', password: 'pkcepass' };
  const clientDoc = {
    id: 'pkce-client',
    secret: 'pkce-secret',
    grants: ['authorization_code'],
    redirectUris: ['https://client.example/callback']
  };

  /**
   * Helper: seed a fresh authorization code into the DB that carries
   * a PKCE code challenge (S256).
   * @param {string} verifier The code_verifier to use for the code_challenge. Should be a valid string but can be weak (e.g. 1 char) to demonstrate vulnerabilities.
   * @param {string} codeValue Optional code value to use (for testing). If not provided, a random one will be generated.
   * @param {string} method Optional code_challenge_method to use (default "S256"). For testing the "plain" method, set this to "plain" and ensure the verifier is the same as the challenge.
   * @return {object} The authorization code document that was seeded into the DB.
   */
  function seedAuthorizationCode (verifier, codeValue, method = 'S256') {
    codeValue = codeValue || 'auth-code-' + Math.random().toString(36).slice(2);
    const codeChallenge = computeS256Challenge(verifier);
    const codeDoc = {
      authorizationCode: codeValue,
      expiresAt: new Date(Date.now() + 60000), // 1 min from now
      redirectUri: 'https://client.example/callback',
      client: clientDoc,
      user: userDoc,
      scope: ['read'],
      codeChallenge,
      codeChallengeMethod: method
    };
    // store in DB so getAuthorizationCode can find it
    db.authorizationCodes.set(codeValue, codeDoc);
    return codeDoc;
  }

  /**
   * Helper: build a token request with the given code and verifier.
   * @param {string} code The authorization code to exchange.
   * @param {string} codeVerifier The code_verifier to include in the request.
   * @returns {Request} The constructed request object.
   */
  function tokenRequest (code, codeVerifier) {
    return createRequest({
      body: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: 'https://client.example/callback',
        code_verifier: codeVerifier
      },
      headers: {
        'authorization': 'Basic ' + Buffer.from(clientDoc.id + ':' + clientDoc.secret).toString('base64'),
        'content-type': 'application/x-www-form-urlencoded'
      },
      method: 'POST'
    });
  }

  beforeEach(function () {
    db = new DB();

    // We need authorizationCodes storage on the DB helper
    db.authorizationCodes = new Map();

    db.saveUser(userDoc);
    db.saveClient(clientDoc);

    const baseModel = createModel(db);

    oAuth2Server = new OAuth2Server({
      model: {
        ...baseModel,

        // --- authorization-code model methods ---
        getAuthorizationCode: async function (authorizationCode) {
          return db.authorizationCodes.get(authorizationCode) || null;
        },

        saveAuthorizationCode: async function (code, client, user) {
          const doc = { ...code, client, user };
          db.authorizationCodes.set(code.authorizationCode, doc);
          return doc;
        },

        revokeAuthorizationCode: async function (code) {
          return db.authorizationCodes.delete(code.authorizationCode);
        },

        validateScope: async function (user, client, scope) {
          return scope;
        }
      }
    });
  });

  // ==================================================================
  // Vulnerability 1 – RFC 7636 §4.1 ABNF not enforced on code_verifier
  //
  // Note: §4.1 ABNF (`43*128unreserved`) is a client-side requirement.
  // §4.6 only mandates hash-and-compare on the server.  Enforcing the
  // ABNF server-side is defense-in-depth to guarantee the ≥256-bit
  // entropy minimum described in Appendix B.
  // ==================================================================
  describe('attack scenario: server accepts RFC7636-invalid code_verifier values', function () {
    /**
     * RFC 7636 §4.1 (client requirement):
     *   code-verifier = 43*128unreserved
     *   unreserved = ALPHA / DIGIT / "-" / "." / "_" / "~"
     *
     * §4.6 (server verification) only says to hash the verifier and
     * compare with the stored code_challenge.  It does NOT explicitly
     * require the server to reject ABNF-invalid verifiers.
     *
     * However, accepting short/weak verifiers undermines the security
     * model: Appendix B depends on ≥256 bits of entropy (which requires
     * at least 43 unreserved characters).  Server-side ABNF enforcement
     * is therefore essential defense-in-depth.
     */
    it('should reject a code_verifier shorter than 43 characters', async () => {
      const shortVerifier = 'z'; // 1 char – clearly invalid per ABNF
      const code = seedAuthorizationCode(shortVerifier);
      const request = tokenRequest(code.authorizationCode, shortVerifier);
      const response = new Response();

      // The server should reject this because "z" does not satisfy
      // the §4.1 ABNF (43..128 unreserved chars).  Although §4.6 does
      // not mandate server-side ABNF checks, accepting weak verifiers
      // breaks the entropy guarantee of Appendix B.
      let tokenIssued = false;

      try {
        await oAuth2Server.token(request, response);
        tokenIssued = true;
      } catch (e) {
        // expected once fixed
      }

      // This assertion documents the a token IS issued
      // for an invalid verifier. When the fix is applied this will
      // correctly throw, making the test pass again (flip the assertion).
      if (tokenIssued) {
        throw new Error(
          'Server issued a token for a 1-character code_verifier ("z"). ' +
          'RFC 7636 §4.1 ABNF requires 43..128 unreserved characters; accepting shorter ' +
          'values breaks the entropy guarantee of Appendix B.'
        );
      }
    });

    it('should reject a code_verifier of 42 characters (one below minimum)', async () => {
      // 42 characters – one below the ABNF minimum of 43
      const shortVerifier = 'a'.repeat(42);
      const code = seedAuthorizationCode(shortVerifier);
      const request = tokenRequest(code.authorizationCode, shortVerifier);
      const response = new Response();

      let tokenIssued = false;

      try {
        await oAuth2Server.token(request, response);
        tokenIssued = true;
      } catch (e) {
        // expected once fixed
      }

      if (tokenIssued) {
        throw new Error(
          'Server issued a token for a 42-character code_verifier. ' +
          'RFC 7636 §4.1 ABNF minimum is 43 characters; server-side enforcement ' +
          'is needed to preserve the entropy guarantee of Appendix B.'
        );
      }
    });

    it('should reject a code_verifier of 129 characters (one above maximum)', async () => {
      // 129 characters – one above the ABNF maximum of 128
      const longVerifier = 'b'.repeat(129);
      const code = seedAuthorizationCode(longVerifier);
      const request = tokenRequest(code.authorizationCode, longVerifier);
      const response = new Response();

      let tokenIssued = false;

      try {
        await oAuth2Server.token(request, response);
        tokenIssued = true;
      } catch (e) {
        // expected once fixed
      }

      if (tokenIssued) {
        throw new Error(
          'Server issued a token for a 129-character code_verifier. ' +
          'RFC 7636 §4.1 ABNF maximum is 128 characters; server-side enforcement ' +
          'is needed to preserve the entropy guarantee of Appendix B.'
        );
      }
    });

    it('should reject a code_verifier with forbidden characters', async () => {
      // Contains spaces and special chars that are not in the unreserved set
      const badVerifier = 'a'.repeat(42) + ' '; // 43 chars but includes a space
      const code = seedAuthorizationCode(badVerifier);
      const request = tokenRequest(code.authorizationCode, badVerifier);
      const response = new Response();

      let tokenIssued = false;

      try {
        await oAuth2Server.token(request, response);
        tokenIssued = true;
      } catch (e) {
        // expected once fixed
      }

      if (tokenIssued) {
        throw new Error(
          'Server issued a token for a code_verifier containing ' +
          'forbidden characters (space). RFC 7636 §4.1 restricts to unreserved characters.'
        );
      }
    });
  });

  // =================================================================
  // Vulnerability 2 – Authorization code not revoked on failed PKCE,
  //                   enabling brute-force guessing
  //
  // Note: RFC 7636 is silent on code revocation after failed
  // verification.  RFC 6749 §4.1.2 says a code used "more than once"
  // must be denied, but whether a failed PKCE attempt constitutes
  // "use" is ambiguous.  Revoking on failure is a security best
  // practice to prevent online brute-force of the verifier.
  // =================================================================
  describe('attack scenario: authorization code survives failed PKCE verification attempts', function () {
    /**
     * If an attacker intercepts an authorization code, they can
     * repeatedly guess code_verifier values.  Because the server only
     * revokes the code AFTER successful PKCE verification (in
     * handle()), every failed attempt leaves the code intact for the
     * next guess.
     *
     * Neither RFC 7636 nor RFC 6749 explicitly mandate revocation on
     * failed verification, but without it the authorization code is
     * replayable for unlimited brute-force attempts — a clear security
     * weakness.
     */
    it('should revoke the authorization code on first failed verifier attempt', async () => {
      const realVerifier = 'z'; // weak, but accepted by current implementation
      const code = seedAuthorizationCode(realVerifier);

      // First attempt with a wrong verifier – should fail
      const badRequest = tokenRequest(code.authorizationCode, 'a');
      const badResponse = new Response();

      try {
        await oAuth2Server.token(badRequest, badResponse);
      } catch (e) {
        // Expected: invalid_grant because hash doesn't match
      }

      // After a failed PKCE attempt the authorization code should have
      // been revoked (consumed) to prevent further guessing.
      const codeStillExists = db.authorizationCodes.has(code.authorizationCode);

      if (codeStillExists) {
        throw new Error(
          'Authorization code was NOT revoked after a failed ' +
          'code_verifier attempt. An attacker can keep guessing.'
        );
      }
    });

    it('should not allow brute-forcing a weak code_verifier by retrying with the same authorization code', async () => {
      // Use a single-char verifier so the search space is tiny
      const realVerifier = 'z';
      const code = seedAuthorizationCode(realVerifier);

      const alphabet = 'abcdefghijklmnopqrstuvwxyz';
      let tokenIssued = false;
      let successfulGuess = null;
      let tries = 0;

      for (const guess of alphabet) {
        tries++;
        const request = tokenRequest(code.authorizationCode, guess);
        const response = new Response();

        try {
          const token = await oAuth2Server.token(request, response);
          if (token && token.accessToken) {
            tokenIssued = true;
            successfulGuess = guess;
            break;
          }
        } catch (e) {
          // wrong guess – continue brute-forcing
        }
      }

      if (tokenIssued) {
        throw new Error(
          `Brute-forced code_verifier in ${tries} tries ` +
          `(guess="${successfulGuess}"). The authorization code was not ` +
          'consumed after failed attempts, allowing online guessing.'
        );
      }
    });

    it('should prevent a legitimate 43-char verifier code to be brute-forceable when code is not revoked on failure', async () => {
      // Use a valid-length verifier to show the code-reuse issue
      // independently of the ABNF length check
      const validVerifier = 'A'.repeat(43);
      const code = seedAuthorizationCode(validVerifier);

      // Attempt 1: wrong verifier
      const wrongRequest = tokenRequest(code.authorizationCode, 'B'.repeat(43));
      const wrongResponse = new Response();

      try {
        await oAuth2Server.token(wrongRequest, wrongResponse);
      } catch (e) {
        // expected failure
      }

      // Attempt 2: correct verifier – should fail if code was revoked
      const correctRequest = tokenRequest(code.authorizationCode, validVerifier);
      const correctResponse = new Response();

      let tokenIssued = false;

      try {
        const token = await oAuth2Server.token(correctRequest, correctResponse);
        if (token && token.accessToken) {
          tokenIssued = true;
        }
      } catch (e) {
        // This is the correct behaviour after fix: code was revoked
      }

      if (tokenIssued) {
        throw new Error(
          'Authorization code was still valid after a prior ' +
          'failed PKCE attempt. The code should have been revoked on the first ' +
          'failed verification to prevent further guessing.'
        );
      }
    });
  });

  // =================================================================
  // Vulnerability 3 - PKCE defaults to "plain" method instead of S256
  //
  // Note: RFC 7636 §4.3 specifies that the server assumes "plain"
  // when code_challenge_method is absent, and the server MUST support
  // "plain".  So defaulting to "plain" is technically *RFC-compliant*.
  //
  // However, "plain" means code_challenge === code_verifier, offering
  // zero cryptographic protection.  Both the OAuth 2.0 Security BCP
  // (draft-ietf-oauth-security-topics §2.1.1) and OAuth 2.1
  // (draft-ietf-oauth-v2-1) deprecate "plain" in favour of S256.
  //
  // The tests below flag "plain" as a weakness even though it does
  // not violate RFC 7636 itself.
  // =================================================================
  describe('attack scenario: PKCE defaults to plain method instead of S256 ', function () {
    /**
     * RFC 7636 §4.2 (client obligation):
     *   "If the client is capable of using 'S256', it MUST use 'S256'"
     *
     * RFC 7636 §4.3 (server behaviour):
     *   The server assumes "plain" when code_challenge_method is absent
     *   and the server MUST support "plain".  This makes defaulting to
     *   "plain" technically RFC-compliant.
     *
     * The problem: with "plain", code_challenge === code_verifier.
     * Intercepting the authorization request reveals the verifier
     * directly — defeating PKCE's purpose for public clients.
     *
     * Modern guidance (OAuth 2.0 Security BCP §2.1.1, OAuth 2.1)
     * deprecates "plain" and recommends servers require S256.
     */
    it('should reject or upgrade "plain" PKCE at the token endpoint (beyond-spec hardening)', async () => {
      const verifier = 'a'.repeat(43); // valid ABNF-length verifier

      // With "plain" method, the code_challenge IS the code_verifier.
      // We seed an authorization code using "plain" (which is what the
      // server would store when code_challenge_method is omitted per
      // RFC 7636 §4.3).
      const codeValue = 'auth-code-plain-default-' + Math.random().toString(36).slice(2);
      const codeDoc = {
        authorizationCode: codeValue,
        expiresAt: new Date(Date.now() + 60000),
        redirectUri: 'https://client.example/callback',
        client: clientDoc,
        user: userDoc,
        scope: ['read'],
        codeChallenge: verifier, // plain: challenge === verifier
        codeChallengeMethod: 'plain' // RFC 7636 §4.3 default
      };
      db.authorizationCodes.set(codeValue, codeDoc);

      // Token exchange: provide the verifier in plain text
      const request = tokenRequest(codeValue, verifier);
      const response = new Response();

      let tokenIssued = false;

      try {
        await oAuth2Server.token(request, response);
        tokenIssued = true;
      } catch (e) {
        // would be expected if plain were rejected
      }

      // Note: accepting "plain" is RFC 7636-compliant (§4.3 says the
      // server MUST support "plain").  However, "plain" means
      // code_challenge === code_verifier — zero cryptographic
      // protection.  OAuth 2.0 Security BCP §2.1.1 and OAuth 2.1
      // deprecate "plain" in favour of S256.
      if (tokenIssued) {
        throw new Error(
          'Server issued a token using "plain" PKCE method. ' +
          'While RFC 7636 §4.3 requires server support for "plain", the OAuth 2.0 ' +
          'Security BCP and OAuth 2.1 deprecate it because code_challenge === code_verifier ' +
          'offers zero cryptographic protection.'
        );
      }
    });

    it('should reject defaults to plain by default (beyond-spec hardening)', async () => {
      // Create a separate OAuth2Server instance with enablePlainPKCE enabled.
      // When this option is true, the server rejects any PKCE flow that uses
      // the "plain" code_challenge_method — even though RFC 7636 §4.3 says
      // the server MUST support "plain".  This is a hardening measure
      // aligned with OAuth 2.0 Security BCP §2.1.1 and OAuth 2.1. which deprecate
      // "plain" due to its lack of cryptographic protection.
      const baseModel = createModel(db);
      const strictServer = new OAuth2Server({
        enablePlainPKCE: false,
        model: {
          ...baseModel,
          getAuthorizationCode: async function (authorizationCode) {
            return db.authorizationCodes.get(authorizationCode) || null;
          },
          saveAuthorizationCode: async function (code, client, user) {
            const doc = { ...code, client, user };
            db.authorizationCodes.set(code.authorizationCode, doc);
            return doc;
          },
          revokeAuthorizationCode: async function (code) {
            return db.authorizationCodes.delete(code.authorizationCode);
          },
          validateScope: async function (user, client, scope) {
            return scope;
          }
        }
      });

      const verifier = 'a'.repeat(43); // valid ABNF-length verifier
      const codeValue = 'auth-code-reject-plain-' + Math.random().toString(36).slice(2);
      db.authorizationCodes.set(codeValue, {
        authorizationCode: codeValue,
        expiresAt: new Date(Date.now() + 60000),
        redirectUri: 'https://client.example/callback',
        client: clientDoc,
        user: userDoc,
        scope: ['read'],
        codeChallenge: verifier, // plain: challenge === verifier
        codeChallengeMethod: 'plain'
      });

      const request = tokenRequest(codeValue, verifier);
      const response = new Response();

      let tokenIssued = false;
      let error = null;

      try {
        await strictServer.token(request, response);
        tokenIssued = true;
      } catch (e) {
        error = e;
      }

      if (tokenIssued) {
        throw new Error(
          'Server with enablePlainPKCE=false still issued ' +
          'a token using "plain" PKCE method. The option should cause the server to ' +
          'reject any plain code_challenge_method.'
        );
      }

      // When rejected correctly, the server should respond with an error
      // indicating that the plain method is not allowed.
      (error !== null).should.equal(true);
    });

    it('should not allow an attacker who intercepts the authorize request to use the plain code_challenge as verifier', async () => {
      // Scenario: a public client sends an authorize request without
      // specifying code_challenge_method. The server defaults to "plain",
      // storing code_challenge = code_verifier.
      //
      // An attacker who intercepts the authorize redirect (which contains
      // code_challenge in the query string) now knows the code_verifier.
      const verifier = 'x'.repeat(50);

      // Simulate what the server stores when code_challenge_method is
      // omitted (defaults to "plain"): code_challenge = verifier
      const stolenChallenge = verifier; // attacker reads this from the authorize request

      const codeValue = 'auth-code-stolen-' + Math.random().toString(36).slice(2);
      db.authorizationCodes.set(codeValue, {
        authorizationCode: codeValue,
        expiresAt: new Date(Date.now() + 60000),
        redirectUri: 'https://client.example/callback',
        client: clientDoc,
        user: userDoc,
        scope: ['read'],
        codeChallenge: verifier,
        codeChallengeMethod: 'plain'
      });

      // The attacker uses the stolen code_challenge directly as code_verifier
      const request = tokenRequest(codeValue, stolenChallenge);
      const response = new Response();

      let tokenIssued = false;

      try {
        await oAuth2Server.token(request, response);
        tokenIssued = true;
      } catch (e) {
        e.should.be.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid request: `code_challenge_method` "plain" is not allowed; use "S256"');
      }

      if (tokenIssued) {
        throw new Error(
          'Attacker redeemed an authorization code by using ' +
          'the intercepted code_challenge as code_verifier (plain method). ' +
          'This defeats PKCE entirely for public clients.'
        );
      }
    });

    it('should not allow an attacker who intercepts the authorize request to use an invalid code_challenge as verifier', async () => {
      // Scenario: a public client sends an authorize request without
      // specifying code_challenge_method. The server defaults to "plain",
      // storing code_challenge = code_verifier.
      //
      // An attacker who intercepts the authorize redirect (which contains
      // code_challenge in the query string) now knows the code_verifier.
      const verifier = 'x'.repeat(50);

      // Simulate what the server stores when code_challenge_method is
      // omitted (defaults to "plain"): code_challenge = verifier
      const stolenChallenge = verifier; // attacker reads this from the authorize request

      const codeValue = 'auth-code-stolen-' + Math.random().toString(36).slice(2);
      db.authorizationCodes.set(codeValue, {
        authorizationCode: codeValue,
        expiresAt: new Date(Date.now() + 60000),
        redirectUri: 'https://client.example/callback',
        client: clientDoc,
        user: userDoc,
        scope: ['read'],
        codeChallenge: verifier,
        codeChallengeMethod: 'forged-xyz' // invalid method stored in DB that could cause a "plain" fallback if not handled properly
      });

      // The attacker uses the stolen code_challenge directly as code_verifier
      const request = tokenRequest(codeValue, stolenChallenge);
      const response = new Response();

      let tokenIssued = false;

      try {
        await oAuth2Server.token(request, response);
        tokenIssued = true;
      } catch (e) {
        // this is not part of the standard which is why we throw a generic ServerError
        e.should.be.instanceOf(ServerError);
        e.message.should.equal('Server error: no valid hash algorithm available to verify `code_verifier`');
      }

      if (tokenIssued) {
        throw new Error(
          'Attacker redeemed an authorization code by using ' +
          'the intercepted code_challenge as code_verifier (custom method). ' +
          'This defeats PKCE entirely for public clients.'
        );
      }
    });
  });
});

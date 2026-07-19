// Type definitions for Node OAuth2 Server 5.0
// Definitions by:  Robbie Van Gorkom <https://github.com/vangorra>,
//                  Charles Irick <https://github.com/cirick>,
//                  Daniel Fischer <https://github.com/d-fischer>,
//                  Vitor Santos <https://github.com/rvitorsantos>

import * as http from 'http';

/**
 * Represents an OAuth2 server instance.
 */
declare class OAuth2Server {
    static OAuth2Server: typeof OAuth2Server;

    options: OAuth2Server.ServerOptions;

    /**
     * Instantiates OAuth2Server using the supplied model
     */
    constructor(options: OAuth2Server.ServerOptions);

    /**
     * Authenticates a request.
     */
    authenticate(
        request: OAuth2Server.Request,
        response: OAuth2Server.Response,
        options?: OAuth2Server.AuthenticateOptions
    ): Promise<OAuth2Server.Token>;

    /**
     * Authorizes a token request.
     */
    authorize(
        request: OAuth2Server.Request,
        response: OAuth2Server.Response,
        options?: OAuth2Server.AuthorizeOptions
    ): Promise<OAuth2Server.AuthorizationCode>;

    /**
     * Retrieves a new token for an authorized token request.
     */
    token(
        request: OAuth2Server.Request,
        response: OAuth2Server.Response,
        options?: OAuth2Server.TokenOptions
    ): Promise<OAuth2Server.Token>;
}

declare namespace OAuth2Server {
    /**
     * Represents an incoming HTTP request.
     */
    class Request {
        body?: any;
        headers?: Record<string, any>;
        method?: string;
        query?: Record<string, any>;

        /**
         * Instantiates Request using the supplied options.
         *
         */
        constructor(options: {
            headers: Record<string, any>,
            method: string,
            query: Record<string, any>,
            body?: any
        } & Record<string, any> | http.IncomingMessage);

        /**
         * Returns the specified HTTP header field. The match is case-insensitive.
         *
         */
        get(field: string): any | undefined;

        /**
         * Checks if the request’s Content-Type HTTP header matches any of the given MIME types.
         *
         */
        is(types: string[]): string | false;
    }

    /**
     * Represents an outgoing HTTP response.
     */
    class Response {
        body?: any;
        headers?: Record<string, string>;
        status?: number;

        /**
         * Instantiates Response using the supplied options.
         *
         */
        constructor(options?: Record<string, any> | http.ServerResponse);

        /**
         * Returns the specified HTTP header field. The match is case-insensitive.
         *
         */
        get(field: string): any | undefined;

        /**
         * Sets the specified HTTP header field. The match is case-insensitive.
         *
         */
        set(field: string, value: string): void;

        /**
         * Redirects to the specified URL using 302 Found.
         *
         */
        redirect(url: string): void;
    }

    abstract class AbstractGrantType {
        /**
         * Instantiates AbstractGrantType using the supplied options.
         *
         */
        constructor(options: TokenOptions)

        /**
         * Generate access token. Calls Model#generateAccessToken() if implemented.
         *
         */
        generateAccessToken(client: Client, user: User, scope: string[]): Promise<string>;

        /**
         * Generate refresh token. Calls Model#generateRefreshToken() if implemented.
         *
         */
        generateRefreshToken(client: Client, user: User, scope: string[]): Promise<string>;

        /**
         * Get access token expiration date.
         *
         */
        getAccessTokenExpiresAt(): Date;

        /**
         * Get refresh token expiration date.
         *
         */
        getRefreshTokenExpiresAt(): Date;

        /**
         * Get scope from the request body.
         *
         */
        getScope(request: Request): string[];

        /**
         * Validate requested scope. Calls Model#validateScope() if implemented.
         *
         */
        validateScope(user: User, client: Client, scope?: string[]): Promise<string[] | Falsey>;

        /**
         * Retrieve info from the request and client and return token
         *
         */
        abstract handle(request: Request, client: Client): Promise<Token | Falsey>;
    }

    interface ServerOptions extends AuthenticateOptions, AuthorizeOptions, TokenOptions {
        /**
         * Model object
         */
        model: AuthorizationCodeModel | ClientCredentialsModel | RefreshTokenModel | PasswordModel | JwtBearerModel | ExtensionModel;
    }

    interface AuthenticateOptions {
        /**
         * The scope(s) to authenticate.
         */
        scope?: string[];

        /**
         * Set the X-Accepted-OAuth-Scopes HTTP header on response objects.
         */
        addAcceptedScopesHeader?: boolean;

        /**
         * Set the X-OAuth-Scopes HTTP header on response objects.
         */
        addAuthorizedScopesHeader?: boolean;

        /**
         * Allow clients to pass bearer tokens in the query string of a request.
         */
        allowBearerTokensInQueryString?: boolean;
    }

    interface AuthorizeOptions {
        /**
         * The authenticate handler
         */
        authenticateHandler?: {};

        /**
         * Allow clients to specify an empty state
         */
        allowEmptyState?: boolean;

        /**
         * Lifetime of generated authorization codes in seconds (default = 5 minutes).
         */
        authorizationCodeLifetime?: number;

        /**
         * Require PKCE for the authorization code grant: reject authorize requests without a `code_challenge`. Recommended by OAuth 2.1.
         */
        requirePKCE?: boolean;
    }

    interface TokenOptions {
        /**
         * Lifetime of generated access tokens in seconds (default = 1 hour)
         */
        accessTokenLifetime?: number;

        /**
         * Lifetime of generated refresh tokens in seconds (default = 2 weeks)
         */
        refreshTokenLifetime?: number;

        /**
         * Allow extended attributes to be set on the returned token
         */
        allowExtendedTokenAttributes?: boolean;

        /**
         * Require a client secret. Defaults to true for all grant types.
         * Setting a grant to `false` disables the client_secret presence check for
         * that grant for ALL clients (not just public ones); per-client
         * (public vs confidential) enforcement must be done in model.getClient.
         */
        requireClientAuthentication?: Record<string, boolean>;

        /**
         * Always revoke the used refresh token and issue a new one for the refresh_token grant.
         */
        alwaysIssueNewRefreshToken?: boolean;

        /**
         * Additional supported grant types.
         */
        extendedGrantTypes?: Record<string, typeof AbstractGrantType>;

        /**
         * Require PKCE for the authorization code grant: reject token exchanges for codes issued without a `code_challenge`. Recommended by OAuth 2.1.
         */
        requirePKCE?: boolean;

        /**
         * Required if the `jwt-bearer` (ID-JAG) grant is used. This Resource AS's own issuer
         * identifier (RFC 8414) — the value assertions must present as their `aud` claim.
         */
        tokenEndpointUri?: string;

        /**
         * `jwt-bearer` (ID-JAG) grant: allowed clock-skew tolerance, in seconds, applied to
         * `exp`/`iat`/`nbf` (default = 60).
         */
        idJagClockSkew?: number;

        /**
         * `jwt-bearer` (ID-JAG) grant: signature algorithm allow-list (default = `['RS256', 'ES256', 'PS256']`).
         */
        jwtBearerAllowedAlgorithms?: string[];

        /**
         * `jwt-bearer` (ID-JAG) grant: allow public clients to use this grant. Not recommended
         * for production environments (default = false).
         */
        jwtBearerAllowPublicClients?: boolean;
    }

    /**
     * For returning falsey parameters in cases of failure
     */
    type Falsey = '' | 0 | false | null | undefined;

    interface BaseModel {
        /**
         * Invoked to generate a new access token.
         *
         */
        generateAccessToken?(client: Client, user: User, scope: string[]): Promise<string>;

        /**
         * Invoked to retrieve a client using a client id or a client id/client secret combination, depending on the grant type.
         *
         */
        getClient(clientId: string, clientSecret?: string): Promise<Client | Falsey>;

        /**
         * Invoked to save an access token and optionally a refresh token, depending on the grant type.
         *
         */
        saveToken(token: Omit<Token, 'client' | 'user'>, client: Client, user: User): Promise<Token | Falsey>;
    }

    interface RequestAuthenticationModel {
        /**
         * Invoked to retrieve an existing access token previously saved through Model#saveToken().
         *
         */
        getAccessToken(accessToken: string): Promise<Token | Falsey>;

        /**
         * Invoked during request authentication to check if the provided access token was authorized the requested scopes.
         * Optional, if a custom authenticateHandler is used or if there is no scope part of the request.
         *
         */
        verifyScope?(token: Token, scope: string[]): Promise<boolean>;
    }

    interface AuthorizationCodeModel extends BaseModel, RequestAuthenticationModel {
        /**
         * Invoked to generate a new refresh token.
         *
         */
        generateRefreshToken?(client: Client, user: User, scope: string[]): Promise<string>;

        /**
         * Invoked to generate a new authorization code.
         *
         */
        generateAuthorizationCode?(client: Client, user: User, scope: string[]): Promise<string>;

        /**
         * Invoked to retrieve an existing authorization code previously saved through Model#saveAuthorizationCode().
         *
         */
        getAuthorizationCode(authorizationCode: string): Promise<AuthorizationCode | Falsey>;

        /**
         * Invoked to save an authorization code.
         *
         */
        saveAuthorizationCode(
          code: Pick<AuthorizationCode, 'authorizationCode' | 'expiresAt' | 'redirectUri' | 'scope' | 'codeChallenge' | 'codeChallengeMethod'>,
          client: Client,
          user: User
        ): Promise<AuthorizationCode | Falsey>;

        /**
         * Invoked to revoke an authorization code.
         *
         */
        revokeAuthorizationCode(code: AuthorizationCode): Promise<boolean>;

        /**
         * Invoked to check if the requested scope is valid for a particular client/user combination.
         *
         */
        validateScope?(user: User, client: Client, scope?: string[]): Promise<string[] | Falsey>;

        /**
         * Invoked to check if the provided `redirectUri` is valid for a particular `client`.
         *
         */
        validateRedirectUri?(redirect_uri: string, client: Client): Promise<boolean>;
    }

    interface PasswordModel extends BaseModel, RequestAuthenticationModel {
        /**
         * Invoked to generate a new refresh token.
         *
         */
        generateRefreshToken?(client: Client, user: User, scope: string[]): Promise<string>;

        /**
         * Invoked to retrieve a user using a username/password combination.
         *
         */
        getUser(username: string, password: string, client: Client): Promise<User | Falsey>;

        /**
         * Invoked to check if the requested scope is valid for a particular client/user combination.
         *
         */
        validateScope?(user: User, client: Client, scope?: string[]): Promise<string[] | Falsey>;
    }

    interface RefreshTokenModel extends BaseModel, RequestAuthenticationModel {
        /**
         * Invoked to generate a new refresh token.
         *
         */
        generateRefreshToken?(client: Client, user: User, scope: string[]): Promise<string>;

        /**
         * Invoked to retrieve an existing refresh token previously saved through Model#saveToken().
         *
         */
        getRefreshToken(refreshToken: string): Promise<RefreshToken | Falsey>;

        /**
         * Invoked to revoke a refresh token.
         *
         */
        revokeToken(token: RefreshToken): Promise<boolean>;
    }

    interface ClientCredentialsModel extends BaseModel, RequestAuthenticationModel {
        /**
         * Invoked to retrieve the user associated with the specified client.
         *
         */
        getUserFromClient(client: Client): Promise<User | Falsey>;

        /**
         * Invoked to check if the requested scope is valid for a particular client/user combination.
         *
         */
        validateScope?(user: User, client: Client, scope?: string[]): Promise<string[] | Falsey>;
    }

    /**
     * Model required by the built-in `jwt-bearer` (ID-JAG) grant. Implements the
     * Identity Assertion Authorization Grant profile of RFC 7523, letting this
     * library act as the Resource Authorization Server side of a Cross App
     * Access exchange.
     */
    interface JwtBearerModel extends BaseModel {
        /**
         * Invoked to confirm the assertion's `iss` claim identifies an Identity Provider this
         * Resource AS trusts, before any cryptographic verification is attempted. Return a
         * falsy value to reject an untrusted issuer.
         *
         */
        getTrustedIssuer(issuer: string): Promise<object | Falsey>;

        /**
         * Invoked to resolve the public key used to verify the assertion's signature, for the
         * given issuer and (optional) key id (`kid` header claim). May return a PEM string, a
         * JWK object, or a `KeyObject`.
         *
         */
        getRequestingIssuerKey(issuer: string, kid: string | undefined): Promise<string | object | Falsey>;

        /**
         * Invoked, once the assertion's signature and claims are verified, to resolve the local
         * user identified by the assertion's `sub` claim. `issuer` is required because `sub` is
         * only unique within a given IdP.
         *
         */
        getUserFromIdJagAssertion(issuer: string, subject: string, client: Client): Promise<User | Falsey>;

        /**
         * Invoked to authorize the asserted identity for the target resource, after the user has
         * been resolved. `assertion` is the verified JWT payload, letting deployments apply
         * policy based on custom claims without re-parsing the JWT.
         *
         */
        validateIdJagPermission(client: Client, user: User, scope: string[] | Falsey, assertion: object): Promise<boolean>;

        /**
         * Invoked to atomically check-and-record the assertion's `jti` claim for replay
         * protection, keyed by `issuer` + `jti` (`jti` uniqueness is per-issuer). Must return
         * `true` only if this `(issuer, jti)` pair has not been seen before, and must record it
         * with a TTL of at least `exp` (plus any configured clock skew). Mutually exclusive with
         * `isJtiUsed`/`recordJti` below — implement either this method, or both of those.
         *
         */
        validateJti?(jti: string, issuer: string, exp: number): Promise<boolean>;

        /**
         * Invoked, together with `recordJti`, as a non-atomic alternative to `validateJti`, to
         * check whether an `(issuer, jti)` pair has already been used.
         *
         */
        isJtiUsed?(jti: string, issuer: string): Promise<boolean>;

        /**
         * Invoked, together with `isJtiUsed`, to record an `(issuer, jti)` pair with a TTL of at
         * least `exp` (plus any configured clock skew).
         *
         */
        recordJti?(jti: string, issuer: string, exp: number): Promise<void>;
    }

    interface ExtensionModel extends BaseModel, RequestAuthenticationModel {}

    /**
     * An interface representing the user.
     * A user object is completely transparent to oauth2-server and is simply used as input to model functions.
     */
    interface User {
        [key: string]: any;
    }

    /**
     * An interface representing the client and associated data
     */
    interface Client {
        id: string;
        redirectUris?: string | string[];
        grants: string | string[];
        accessTokenLifetime?: number;
        refreshTokenLifetime?: number;
        [key: string]: any;
    }

    /**
     * An interface representing the authorization code and associated data.
     */
    interface AuthorizationCode {
        authorizationCode: string;
        expiresAt: Date;
        redirectUri: string;
        scope?: string[];
        client: Client;
        user: User;
        codeChallenge?: string;
        codeChallengeMethod?: string;
        [key: string]: any;
    }

    /**
     * An interface representing the token(s) and associated data.
     */
    interface Token {
        accessToken: string;
        accessTokenExpiresAt?: Date;
        refreshToken?: string;
        refreshTokenExpiresAt?: Date;
        scope?: string[];
        client: Client;
        user: User;
        [key: string]: any;
    }

    /**
     * An interface representing the refresh token and associated data.
     */
    interface RefreshToken {
        refreshToken: string;
        refreshTokenExpiresAt?: Date;
        scope?: string[];
        client: Client;
        user: User;
        [key: string]: any;
    }

    class OAuthError extends Error {
        constructor(messageOrError: string | Error, properties?: object);

        /**
         * The HTTP error code.
         */
        code: number;

        /**
         * The OAuth error code.
         */
        name: string;

        /**
         * A human-readable error message.
         */
        message: string;

        /**
         * The original error, present when this error was constructed by wrapping another `Error`.
         */
        inner?: Error;
    }

    class AccessDeniedError extends OAuthError {}
    class InsufficientScopeError extends OAuthError {}
    class InvalidArgumentError extends OAuthError {}
    class InvalidClientError extends OAuthError {}
    class InvalidGrantError extends OAuthError {}
    class InvalidRequestError extends OAuthError {}
    class InvalidScopeError extends OAuthError {}
    class InvalidTokenError extends OAuthError {}
    class ServerError extends OAuthError {}
    class UnauthorizedClientError extends OAuthError {}
    class UnauthorizedRequestError extends OAuthError {}
    class UnsupportedGrantTypeError extends OAuthError {}
    class UnsupportedResponseTypeError extends OAuthError {}
}

export = OAuth2Server;

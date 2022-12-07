import {
    AccessDeniedError,
    InvalidArgumentError,
    InvalidClientError,
    InvalidRequestError,
    InvalidScopeError,
    OAuthError,
    ServerError,
    UnauthorizedClientError,
    UnsupportedResponseTypeError,
} from "../errors/index.js";

import url from "url";
import { Request } from "../request.js";
import { Response } from "../response.js";

import {
    AuthorizationCode,
    AuthorizationCodeModel,
    Client,
    User,
} from "../types.js";

import { generateRandomToken, nqschar, uri, vschar } from "../utils/index.js";
import { isValidMethod } from "../pkce/index.js";
import { AuthenticateHandler } from "./authenticate-handler.js";

import {
    // TokenResponseType,
    CodeResponseType,
} from "../response-types/index.js";

export const responseTypes = {
    code: CodeResponseType,
    // token: TokenResponseType,
};

export class AuthorizeHandler {
    public allowEmptyState: boolean;
    public authenticateHandler: AuthenticateHandler;
    public authorizationCodeLifetime: number;
    public model: AuthorizationCodeModel;

    public constructor(options?: Record<string, any>) {
        options = options || {};

        if (
            options.authenticateHandler &&
            !options.authenticateHandler.handle
        ) {
            throw new InvalidArgumentError(
                "Invalid argument: authenticateHandler does not implement `handle()`"
            );
        }

        if (!options.authorizationCodeLifetime) {
            throw new InvalidArgumentError(
                "Missing parameter: `authorizationCodeLifetime`"
            );
        }

        if (!options.model) {
            throw new InvalidArgumentError("Missing parameter: `model`");
        }

        if (!options.model.getClient) {
            throw new InvalidArgumentError(
                "Invalid argument: model does not implement `getClient()`"
            );
        }

        if (!options.model.saveAuthorizationCode) {
            throw new InvalidArgumentError(
                "Invalid argument: model does not implement `saveAuthorizationCode()`"
            );
        }

        this.allowEmptyState = options.allowEmptyState;
        this.authenticateHandler =
            options.authenticateHandler || new AuthenticateHandler(options);
        this.authorizationCodeLifetime = options.authorizationCodeLifetime;
        this.model = options.model;
    }

    public async handle(request: Request, response: Response) {
        if (!(request instanceof Request)) {
            throw new InvalidArgumentError(
                "Invalid argument: `request` must be an instance of Request"
            );
        }

        if (!(response instanceof Response)) {
            throw new InvalidArgumentError(
                "Invalid argument: `response` must be an instance of Response"
            );
        }

        const expiresAt = this.getAuthorizationCodeLifetime();
        const client = await this.getClient(request);
        const user = await this.getUser(request, response);

        const uri = this.getRedirectUri(request, client);
        let scope: string | string[];
        let state: string;
        let ResponseType;

        state = this.getState(request);

        if (
            request.query.allowed === "false" ||
            request.body.allowed === "false"
        ) {
            throw new AccessDeniedError(
                "Access denied: user denied access to application"
            );
        }

        try {
            const requestedScope = this.getScope(request);
            const validScope = await this.validateScope(
                user,
                client,
                requestedScope
            );

            scope = validScope;

            const authorizationCode = await this.generateAuthorizationCode(
                client,
                user,
                scope
            );

            ResponseType = this.getResponseType(request);

            const codeChallenge = this.getCodeChallenge(request);
            const codeChallengeMethod = this.getCodeChallengeMethod(request);

            const code = await this.saveAuthorizationCode(
                authorizationCode,
                expiresAt,
                scope,
                client,
                uri,
                user,
                codeChallenge,
                codeChallengeMethod
            );

            const responseType = new ResponseType(code.authorizationCode);
            const redirectUri = this.buildSuccessRedirectUri(uri, responseType);

            this.updateResponse(response, redirectUri, state);

            return code;
        } catch (e: any) {
            if (!(e instanceof OAuthError)) {
                e = new ServerError(e);
            }

            const redirectUri = this.buildErrorRedirectUri(uri, e);

            this.updateResponse(response, redirectUri, state);

            throw e;
        }
    }

    public async generateAuthorizationCode(
        client: Client,
        user: User,
        scope: string | string[]
    ) {
        if (this.model.generateAuthorizationCode) {
            return await this.model.generateAuthorizationCode(
                client,
                user,
                scope
            );
        }

        return generateRandomToken();
    }

    public getAuthorizationCodeLifetime() {
        const expires = new Date();

        expires.setSeconds(
            expires.getSeconds() + this.authorizationCodeLifetime
        );

        return expires;
    }

    public async getClient(request: Request) {
        const self = this;
        const clientId = request.body.client_id || request.query.client_id;

        if (!clientId) {
            throw new InvalidRequestError("Missing parameter: `client_id`");
        }

        if (!vschar(clientId)) {
            throw new InvalidRequestError("Invalid parameter: `client_id`");
        }

        const redirectUri =
            request.body.redirect_uri || request.query.redirect_uri;

        if (redirectUri && !uri(redirectUri)) {
            throw new InvalidRequestError(
                "Invalid request: `redirect_uri` is not a valid URI"
            );
        }

        const client = await this.model.getClient(clientId);

        if (!client) {
            throw new InvalidClientError(
                "Invalid client: client credentials are invalid"
            );
        }

        if (!client.grants) {
            throw new InvalidClientError(
                "Invalid client: missing client `grants`"
            );
        }

        if (
            !Array.isArray(client.grants) ||
            !client.grants.includes("authorization_code")
        ) {
            throw new UnauthorizedClientError(
                "Unauthorized client: `grant_type` is invalid"
            );
        }

        if (!client.redirectUris || 0 === client.redirectUris.length) {
            throw new InvalidClientError(
                "Invalid client: missing client `redirectUri`"
            );
        }

        if (redirectUri) {
            const valid = await this.validateRedirectUri(redirectUri, client);

            if (!valid) {
                throw new InvalidClientError(
                    "Invalid client: `redirect_uri` does not match client value"
                );
            }

            return client;
        } else {
            return client;
        }
    }

    public async validateScope(
        user: User,
        client: Client,
        scope: string | string[]
    ) {
        if (this.model.validateScope) {
            const scope_ = await this.model.validateScope(user, client, scope);

            if (!scope_) {
                throw new InvalidScopeError(
                    "Invalid scope: Requested scope is invalid"
                );
            }

            return scope_;
        } else {
            return scope;
        }
    }

    public getScope(request: Request) {
        const scope = request.body.scope || request.query.scope;

        if (!nqschar(scope)) {
            throw new InvalidScopeError("Invalid parameter: `scope`");
        }

        return scope;
    }

    public getState(request: Request) {
        const state = request.body.state || request.query.state;
        const stateExists = state && state.length > 0;
        const stateIsValid = stateExists ? vschar(state) : this.allowEmptyState;

        if (!stateIsValid) {
            const message = !stateExists ? "Missing" : "Invalid";
            throw new InvalidRequestError(`${message} parameter: \`state\``);
        }

        return state;
    }

    public async getUser(request: Request, response: Response) {
        const token = await this.authenticateHandler.handle(request, response);

        return token.user;
    }

    public getRedirectUri(request: Request, client: Client) {
        return (
            request.body.redirect_uri ||
            request.query.redirect_uri ||
            client.redirectUris![0]
        );
    }

    public async saveAuthorizationCode(
        authorizationCode: string,
        expiresAt: number | Date,
        scope: string | string[],
        client: Client,
        redirectUri: string,
        user: User,
        codeChallenge: string,
        codeChallengeMethod: string
    ) {
        let code: AuthorizationCode = {
            authorizationCode,
            expiresAt:
                expiresAt instanceof Date ? expiresAt : new Date(expiresAt),
            redirectUri,
            scope,
            client,
            user,
        };

        if (codeChallenge && codeChallengeMethod) {
            code = Object.assign(
                {
                    codeChallenge: codeChallenge,
                    codeChallengeMethod: codeChallengeMethod,
                },
                code
            );
        }

        return await this.model.saveAuthorizationCode(code, client, user);
    }

    public async validateRedirectUri(redirectUri: string, client: Client) {
        if ((this.model as any).validateRedirectUri) {
            return await (this.model as any).validateRedirectUri(
                redirectUri,
                client
            );
        }

        return client.redirectUris!.includes(redirectUri);
    }

    public getResponseType(request: Request): typeof CodeResponseType {
        const responseType =
            request.body.response_type || request.query.response_type;

        if (!responseType) {
            throw new InvalidRequestError("Missing parameter: `response_type`");
        }

        if (
            !Object.prototype.hasOwnProperty.call(responseTypes, responseType)
        ) {
            throw new UnsupportedResponseTypeError(
                "Unsupported response type: `response_type` is not supported"
            );
        }

        return (responseTypes as any)[responseType];
    }

    public buildSuccessRedirectUri(
        redirectUri: string,
        responseType: CodeResponseType
    ) {
        return responseType.buildRedirectUri(redirectUri);
    }

    public buildErrorRedirectUri<T extends Error>(
        redirectUri: string,
        error: T
    ) {
        const uri = url.parse(redirectUri, true);

        uri.query = {
            error: error.name,
        };

        if (error.message) {
            uri.query.error_description = error.message;
        }

        return uri;
    }

    updateResponse(
        response: Response,
        redirectUri: url.UrlWithParsedQuery,
        state: string
    ) {
        redirectUri.query = redirectUri.query || {};

        if (state) {
            redirectUri.query.state = state;
        }

        response.redirect(url.format(redirectUri));
    }

    getCodeChallenge(request: Request) {
        return request.body.code_challenge;
    }

    getCodeChallengeMethod(request: Request) {
        const algorithm = request.body.code_challenge_method;

        if (algorithm && !isValidMethod(algorithm)) {
            throw new InvalidRequestError(
                `Invalid request: transform algorithm '${algorithm}' not supported`
            );
        }

        return algorithm || "plain";
    }
}

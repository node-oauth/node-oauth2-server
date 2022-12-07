import {
    InsufficientScopeError,
    InvalidArgumentError,
    InvalidRequestError,
    InvalidTokenError,
    OAuthError,
    ServerError,
    UnauthorizedRequestError,
} from "../errors/index.js";
import { Request } from "../request.js";
import { Response } from "../response.js";
import { RequestAuthenticationModel, Token } from "../types.js";
import { bool2Int } from "../utils/token-util.js";

export class AuthenticateHandler {
    public addAcceptedScopesHeader: boolean;
    public addAuthorizedScopesHeader: boolean;
    public allowBearerTokensInQueryString: boolean;
    public model: RequestAuthenticationModel;
    public scope: string | string[];

    public constructor(options?: Record<string, any>) {
        options = options || {};

        if (!options.model) {
            throw new InvalidArgumentError("Missing parameter: `model`");
        }

        if (!options.model.getAccessToken) {
            throw new InvalidArgumentError(
                "Invalid argument: model does not implement `getAccessToken()`"
            );
        }

        if (options.scope && undefined === options.addAcceptedScopesHeader) {
            throw new InvalidArgumentError(
                "Missing parameter: `addAcceptedScopesHeader`"
            );
        }

        if (options.scope && undefined === options.addAuthorizedScopesHeader) {
            throw new InvalidArgumentError(
                "Missing parameter: `addAuthorizedScopesHeader`"
            );
        }

        if (options.scope && !options.model.verifyScope) {
            throw new InvalidArgumentError(
                "Invalid argument: model does not implement `verifyScope()`"
            );
        }

        this.addAcceptedScopesHeader = options.addAcceptedScopesHeader;
        this.addAuthorizedScopesHeader = options.addAuthorizedScopesHeader;
        this.allowBearerTokensInQueryString =
            options.allowBearerTokensInQueryString;
        this.model = options.model;
        this.scope = options.scope;
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

        try {
            const requestToken = await this.getTokenFromRequest(request);
            const accessToken = await this.getAccessToken(requestToken);
            const token = this.validateAccessToken(accessToken);

            if (this.scope) await this.verifyScope(token);

            this.updateResponse(response, token);

            return token;
        } catch (e: any) {
            if (e instanceof UnauthorizedRequestError) {
                response.set("WWW-Authenticate", 'Bearer realm="Service"');
            } else if (e instanceof InvalidRequestError) {
                response.set(
                    "WWW-Authenticate",
                    'Bearer realm="Service",error="invalid_request"'
                );
            } else if (e instanceof InvalidTokenError) {
                response.set(
                    "WWW-Authenticate",
                    'Bearer realm="Service",error="invalid_token"'
                );
            } else if (e instanceof InsufficientScopeError) {
                response.set(
                    "WWW-Authenticate",
                    'Bearer realm="Service",error="insufficient_scope"'
                );
            }

            if (!(e instanceof OAuthError)) {
                throw new ServerError(e);
            }

            throw e;
        }
    }

    public getTokenFromRequest(request: Request) {
        const headerToken = request.get("Authorization");
        const queryToken = request.query.access_token;
        const bodyToken = request.body.access_token;

        if (
            bool2Int(!!headerToken) +
                bool2Int(!!queryToken) +
                bool2Int(!!bodyToken) >
            1
        ) {
            throw new InvalidRequestError(
                "Invalid request: only one authentication method is allowed"
            );
        }

        if (headerToken) {
            return this.getTokenFromRequestHeader(request);
        }

        if (queryToken) {
            return this.getTokenFromRequestQuery(request);
        }

        if (bodyToken) {
            return this.getTokenFromRequestBody(request);
        }

        throw new UnauthorizedRequestError(
            "Unauthorized request: no authentication given"
        );
    }

    public getTokenFromRequestHeader(request: Request) {
        const token = request.get("Authorization");
        const matches = token.match(/^Bearer\s(\S+)/);

        if (!matches) {
            throw new InvalidRequestError(
                "Invalid request: malformed authorization header"
            );
        }

        return matches[1];
    }

    public getTokenFromRequestQuery(request: Request) {
        if (!this.allowBearerTokensInQueryString) {
            throw new InvalidRequestError(
                "Invalid request: do not send bearer tokens in query URLs"
            );
        }

        return request.query.access_token;
    }

    public getTokenFromRequestBody(request: Request) {
        if (request.method === "GET") {
            throw new InvalidRequestError(
                "Invalid request: token may not be passed in the body when using the GET verb"
            );
        }

        if (!request.is("application/x-www-form-urlencoded")) {
            throw new InvalidRequestError(
                "Invalid request: content must be application/x-www-form-urlencoded"
            );
        }

        return request.body.access_token;
    }

    public async getAccessToken(token: Token) {
        const accessToken = await this.model.getAccessToken(token.accessToken);

        if (!accessToken) {
            throw new InvalidTokenError(
                "Invalid token: access token is invalid"
            );
        }

        if (!accessToken.user) {
            throw new ServerError(
                "Server error: `getAccessToken()` did not return a `user` object"
            );
        }

        return accessToken;
    }

    public validateAccessToken(accessToken: Token) {
        if (!(accessToken.accessTokenExpiresAt instanceof Date)) {
            throw new ServerError(
                "Server error: `accessTokenExpiresAt` must be a Date instance"
            );
        }

        if (accessToken.accessTokenExpiresAt < new Date()) {
            throw new InvalidTokenError(
                "Invalid token: access token has expired"
            );
        }

        return accessToken;
    }

    public async verifyScope(accessToken: Token) {
        const scope = await this.model.verifyScope(accessToken, this.scope);
        if (!scope) {
            throw new InsufficientScopeError(
                "Insufficient scope: authorized scope is insufficient"
            );
        }

        return scope;
    }

    public updateResponse(response: Response, accessToken: Token) {
        if (this.scope && this.addAcceptedScopesHeader) {
            response.set("X-Accepted-OAuth-Scopes", this.scope.toString());
        }

        if (this.scope && this.addAuthorizedScopesHeader) {
            response.set("X-OAuth-Scopes", accessToken.scope!.toString());
        }
    }
}

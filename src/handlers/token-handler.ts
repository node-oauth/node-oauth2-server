// const auth = require("basic-auth");

import { auth } from "../basic.js";
import {
    InvalidArgumentError,
    InvalidClientError,
    InvalidRequestError,
    OAuthError,
    ServerError,
    UnauthorizedClientError,
    UnsupportedGrantTypeError,
} from "../errors/index.js";
import { TokenModel } from "../models/token-model.js";
import { isPKCERequest } from "../pkce/index.js";
import { Request } from "../request.js";
import { Response } from "../response.js";
import { BearerTokenType } from "../token-types/index.js";
import { BaseModel, Client } from "../types.js";
import { nchar, uri, vschar } from "../utils/index.js";

export const grantTypes = {
    authorization_code: require("../grant-types/authorization-code-grant-type"),
    client_credentials: require("../grant-types/client-credentials-grant-type"),
    password: require("../grant-types/password-grant-type"),
    refresh_token: require("../grant-types/refresh-token-grant-type"),
};

export class TokenHandler {
    public accessTokenLifetime: number;
    public grantTypes: typeof grantTypes;
    public model: BaseModel;
    public refreshTokenLifetime: number;
    public allowExtendedTokenAttributes: boolean;
    public requireClientAuthentication: Record<string, boolean>;
    public alwaysIssueNewRefreshToken: boolean;

    public constructor(options: Record<string, any>) {
        options = options || {};

        if (!options.accessTokenLifetime) {
            throw new InvalidArgumentError(
                "Missing parameter: `accessTokenLifetime`"
            );
        }

        if (!options.model) {
            throw new InvalidArgumentError("Missing parameter: `model`");
        }

        if (!options.refreshTokenLifetime) {
            throw new InvalidArgumentError(
                "Missing parameter: `refreshTokenLifetime`"
            );
        }

        if (!options.model.getClient) {
            throw new InvalidArgumentError(
                "Invalid argument: model does not implement `getClient()`"
            );
        }

        this.accessTokenLifetime = options.accessTokenLifetime;
        this.grantTypes = Object.assign(
            {},
            grantTypes,
            options.extendedGrantTypes
        );
        this.model = options.model;
        this.refreshTokenLifetime = options.refreshTokenLifetime;
        this.allowExtendedTokenAttributes =
            options.allowExtendedTokenAttributes;
        this.requireClientAuthentication =
            options.requireClientAuthentication || {};
        this.alwaysIssueNewRefreshToken =
            options.alwaysIssueNewRefreshToken !== false;
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

        if (request.method !== "POST") {
            return Promise.reject(
                new InvalidRequestError("Invalid request: method must be POST")
            );
        }

        if (!request.is("application/x-www-form-urlencoded")) {
            return Promise.reject(
                new InvalidRequestError(
                    "Invalid request: content must be application/x-www-form-urlencoded"
                )
            );
        }

        try {
            const client = await this.getClient(request, response);
            const data = await this.handleGrantType(request, client);

            const model = new TokenModel(data, {
                allowExtendedTokenAttributes: this.allowExtendedTokenAttributes,
            });

            const tokenType = this.getTokenType(model);

            this.updateSuccessResponse(response, tokenType);
        } catch (e: any) {
            if (!(e instanceof OAuthError)) {
                e = new ServerError(e);
            }

            this.updateErrorResponse(response, e);

            throw e;
        }
    }

    public async getClient(request: Request, response: Response) {
        const credentials = this.getClientCredentials(request);
        const grantType = request.body.grant_type;
        const codeVerifier = request.body.code_verifier;
        const isPkce = isPKCERequest(grantType, codeVerifier);

        if (!credentials.clientId) {
            throw new InvalidRequestError("Missing parameter: `client_id`");
        }

        if (
            this.isClientAuthenticationRequired(grantType) &&
            !credentials.clientSecret &&
            !isPkce
        ) {
            throw new InvalidRequestError("Missing parameter: `client_secret`");
        }

        if (!vschar(credentials.clientId)) {
            throw new InvalidRequestError("Invalid parameter: `client_id`");
        }

        if (credentials.clientSecret && !vschar(credentials.clientSecret)) {
            throw new InvalidRequestError("Invalid parameter: `client_secret`");
        }

        try {
            const client = await this.model.getClient(
                credentials.clientId,
                credentials.clientSecret
            );

            if (!client) {
                throw new InvalidClientError(
                    "Invalid client: client is invalid"
                );
            }

            if (!client.grants) {
                throw new ServerError("Server error: missing client `grants`");
            }

            if (!(client.grants instanceof Array)) {
                throw new ServerError(
                    "Server error: `grants` must be an array"
                );
            }

            return client;
        } catch (e: any) {
            if (
                e instanceof InvalidClientError &&
                request.get("authorization")
            ) {
                response.set("WWW-Authenticate", 'Basic realm="Service"');

                throw new InvalidClientError(e.message, 401);
            }

            throw e;
        }
    }

    getClientCredentials(request: Request) {
        const credentials = auth(request as any);
        const grantType = request.body.grant_type;
        const codeVerifier = request.body.code_verifier;

        if (credentials) {
            return {
                clientId: credentials.name,
                clientSecret: credentials.pass,
            };
        }

        if (request.body.client_id && request.body.client_secret) {
            return {
                clientId: request.body.client_id,
                clientSecret: request.body.client_secret,
            };
        }

        if (isPKCERequest(grantType, codeVerifier)) {
            if (request.body.client_id) {
                return { clientId: request.body.client_id };
            }
        }

        if (!this.isClientAuthenticationRequired(grantType)) {
            if (request.body.client_id) {
                return { clientId: request.body.client_id };
            }
        }

        throw new InvalidClientError(
            "Invalid client: cannot retrieve client credentials"
        );
    }

    handleGrantType(request: Request, client: Client) {
        const grantType = request.body.grant_type;

        if (!grantType) {
            throw new InvalidRequestError("Missing parameter: `grant_type`");
        }

        if (!nchar(grantType) && !uri(grantType)) {
            throw new InvalidRequestError("Invalid parameter: `grant_type`");
        }

        if (!Object.prototype.hasOwnProperty.call(this.grantTypes, grantType)) {
            throw new UnsupportedGrantTypeError(
                "Unsupported grant type: `grant_type` is invalid"
            );
        }

        if (
            !Array.isArray(client.grants) ||
            !client.grants.includes(grantType)
        ) {
            throw new UnauthorizedClientError(
                "Unauthorized client: `grant_type` is invalid"
            );
        }

        const accessTokenLifetime = this.getAccessTokenLifetime(client);
        const refreshTokenLifetime = this.getRefreshTokenLifetime(client);
        const Type = (this.grantTypes as any)[grantType];

        const options = {
            accessTokenLifetime: accessTokenLifetime,
            model: this.model,
            refreshTokenLifetime: refreshTokenLifetime,
            alwaysIssueNewRefreshToken: this.alwaysIssueNewRefreshToken,
        };

        return new Type(options).handle(request, client);
    }

    public getAccessTokenLifetime(client: Client) {
        return client.accessTokenLifetime || this.accessTokenLifetime;
    }

    public getRefreshTokenLifetime(client: Client) {
        return client.refreshTokenLifetime || this.refreshTokenLifetime;
    }

    public getTokenType(model: TokenModel) {
        return new BearerTokenType(
            model.accessToken,
            model.accessTokenLifetime,
            model.refreshToken,
            model.scope,
            model.customAttributes
        );
    }

    public updateSuccessResponse(
        response: Response,
        tokenType: BearerTokenType
    ) {
        response.body = tokenType.valueOf();

        response.set("Cache-Control", "no-store");
        response.set("Pragma", "no-cache");
    }

    public updateErrorResponse<T extends OAuthError>(
        response: Response,
        error: T
    ) {
        response.body = {
            error: error.name,
            error_description: error.message,
        };

        response.status = error.code;
    }

    public isClientAuthenticationRequired(grantType: string) {
        if (Object.keys(this.requireClientAuthentication).length > 0) {
            return typeof this.requireClientAuthentication[grantType] !==
                "undefined"
                ? this.requireClientAuthentication[grantType]
                : true;
        } else {
            return true;
        }
    }
}

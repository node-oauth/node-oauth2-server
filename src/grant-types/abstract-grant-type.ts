// const Promise = require("bluebird");
// const promisify = require("promisify-any").use(Promise);
// const isFormat = require("@node-oauth/formats");

import { InvalidArgumentError, InvalidScopeError } from "../errors/index.js";
import { Request } from "../request.js";
import {
    AuthorizationCodeModel,
    Client,
    RequestAuthenticationModel,
    User,
} from "../types.js";
import { generateRandomToken, nqschar } from "../utils/index.js";

export class AbstractGrantType<
    T extends RequestAuthenticationModel = AuthorizationCodeModel
> {
    public accessTokenLifetime: number;
    public model: T;
    public refreshTokenLifetime: number;
    public alwaysIssueNewRefreshToken: boolean;

    public constructor(options?: Record<string, any>) {
        options = options || {};

        if (!options.accessTokenLifetime) {
            throw new InvalidArgumentError(
                "Missing parameter: `accessTokenLifetime`"
            );
        }

        if (!options.model) {
            throw new InvalidArgumentError("Missing parameter: `model`");
        }

        this.accessTokenLifetime = options.accessTokenLifetime;
        this.model = options.model;
        this.refreshTokenLifetime = options.refreshTokenLifetime;
        this.alwaysIssueNewRefreshToken = options.alwaysIssueNewRefreshToken;
    }

    public async generateAccessToken(
        client: Client,
        user: User,
        scope: string | string[]
    ) {
        if (this.model.generateAccessToken) {
            const accessToken = await this.model.generateAccessToken(
                client,
                user,
                scope
            );

            return accessToken || generateRandomToken();
        }

        return generateRandomToken();
    }

    public async generateRefreshToken(
        client: Client,
        user: User,
        scope: string | string[]
    ) {
        if (this.model.generateRefreshToken) {
            const refreshToken = await this.model.generateRefreshToken(
                client,
                user,
                scope
            );

            return refreshToken || generateRandomToken();
        }

        return generateRandomToken();
    }

    public getAccessTokenExpiresAt() {
        return new Date(Date.now() + this.accessTokenLifetime * 1000);
    }

    public getRefreshTokenExpiresAt() {
        return new Date(Date.now() + this.refreshTokenLifetime * 1000);
    }

    public getScope(request: Request) {
        if (!nqschar(request.body.scope)) {
            throw new InvalidArgumentError("Invalid parameter: `scope`");
        }

        return request.body.scope;
    }

    public async validateScope(
        user: User,
        client: Client,
        scope: string | string[]
    ) {
        if (this.model.validateScope) {
            const _scope = await this.model.validateScope(user, client, scope);
            if (!_scope)
                throw new InvalidScopeError(
                    "Invalid scope: Requested scope is invalid"
                );

            return _scope;
        } else {
            return scope;
        }
    }
}

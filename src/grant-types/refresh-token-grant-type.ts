import {
    InvalidArgumentError,
    InvalidGrantError,
    InvalidRequestError,
    ServerError,
} from "../errors/index.js";
import {
    Client,
    RefreshToken,
    RefreshTokenModel,
    Token,
    User,
} from "../types.js";
import { AbstractGrantType } from "./abstract-grant-type.js";
import { Request } from "../request.js";
import { vschar } from "../utils/index.js";

export class RefreshTokenGrantType extends AbstractGrantType<RefreshTokenModel> {
    public constructor(options?: Record<string, any>) {
        options = options || {};

        if (!options.model) {
            throw new InvalidArgumentError("Missing parameter: `model`");
        }

        if (!options.model.getRefreshToken) {
            throw new InvalidArgumentError(
                "Invalid argument: model does not implement `getRefreshToken()`"
            );
        }

        if (!options.model.revokeToken) {
            throw new InvalidArgumentError(
                "Invalid argument: model does not implement `revokeToken()`"
            );
        }

        if (!options.model.saveToken) {
            throw new InvalidArgumentError(
                "Invalid argument: model does not implement `saveToken()`"
            );
        }

        super(options);
    }

    public async handle(request: Request, client: Client) {
        if (!request) {
            throw new InvalidArgumentError("Missing parameter: `request`");
        }

        if (!client) {
            throw new InvalidArgumentError("Missing parameter: `client`");
        }

        const refreshToken = await this.getRefreshToken(request, client);
        const token = await this.revokeToken(refreshToken);

        return await this.saveToken(token.user, client, token.scope!);
    }

    public async getRefreshToken(request: Request, client: Client) {
        if (!request.body.refresh_token) {
            throw new InvalidRequestError("Missing parameter: `refresh_token`");
        }

        if (!vschar(request.body.refresh_token)) {
            throw new InvalidRequestError("Invalid parameter: `refresh_token`");
        }

        const token = await this.model.getRefreshToken(
            request.body.refresh_token
        );

        if (!token) {
            throw new InvalidGrantError(
                "Invalid grant: refresh token is invalid"
            );
        }

        if (!token.client) {
            throw new ServerError(
                "Server error: `getRefreshToken()` did not return a `client` object"
            );
        }

        if (!token.user) {
            throw new ServerError(
                "Server error: `getRefreshToken()` did not return a `user` object"
            );
        }

        if (token.client.id !== client.id) {
            throw new InvalidGrantError(
                "Invalid grant: refresh token was issued to another client"
            );
        }

        if (
            token.refreshTokenExpiresAt &&
            !(token.refreshTokenExpiresAt instanceof Date)
        ) {
            throw new ServerError(
                "Server error: `refreshTokenExpiresAt` must be a Date instance"
            );
        }

        if (
            token.refreshTokenExpiresAt &&
            token.refreshTokenExpiresAt < new Date()
        ) {
            throw new InvalidGrantError(
                "Invalid grant: refresh token has expired"
            );
        }

        return token;
    }

    public async revokeToken(token: RefreshToken) {
        if (this.alwaysIssueNewRefreshToken === false) {
            return Promise.resolve(token);
        }

        const status = await this.model.revokeToken(token);

        if (!status) {
            throw new InvalidGrantError(
                "Invalid grant: refresh token is invalid or could not be revoked"
            );
        }

        return token;
    }

    public async saveToken(
        user: User,
        client: Client,
        scope: string | string[]
    ) {
        const accessToken = await this.generateAccessToken(client, user, scope);
        const refreshToken = await this.generateRefreshToken(
            client,
            user,
            scope
        );

        const accessTokenExpiresAt = this.getAccessTokenExpiresAt();
        const refreshTokenExpiresAt = this.getRefreshTokenExpiresAt();

        const token: Token = {
            accessToken: accessToken,
            accessTokenExpiresAt: accessTokenExpiresAt,
            scope,
            client,
            user,
        };

        if (this.alwaysIssueNewRefreshToken !== false) {
            token.refreshToken = refreshToken;
            token.refreshTokenExpiresAt = refreshTokenExpiresAt;
        }

        return this.model.saveToken(token, client, user);
    }
}

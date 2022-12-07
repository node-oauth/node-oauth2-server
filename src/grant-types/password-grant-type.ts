import {
    InvalidArgumentError,
    InvalidGrantError,
    InvalidRequestError,
} from "../errors/index.js";
import { Request } from "../request.js";
import { Client, PasswordModel, Token, User } from "../types.js";
import { uchar } from "../utils/index.js";
import { AbstractGrantType } from "./abstract-grant-type.js";

export class PasswordGrantType extends AbstractGrantType<PasswordModel> {
    public constructor(options?: Record<string, any>) {
        options = options || {};

        if (!options.model) {
            throw new InvalidArgumentError("Missing parameter: `model`");
        }

        if (!options.model.getUser) {
            throw new InvalidArgumentError(
                "Invalid argument: model does not implement `getUser()`"
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

        const scope = this.getScope(request);
        const user = await this.getUser(request);
        const token = await this.saveToken(user, client, scope);

        return token;
    }

    public async getUser(request: Request) {
        if (!request.body.username) {
            throw new InvalidRequestError("Missing parameter: `username`");
        }

        if (!request.body.password) {
            throw new InvalidRequestError("Missing parameter: `password`");
        }

        if (!uchar(request.body.username)) {
            throw new InvalidRequestError("Invalid parameter: `username`");
        }

        if (!uchar(request.body.password)) {
            throw new InvalidRequestError("Invalid parameter: `password`");
        }

        const user = await this.model.getUser(
            request.body.username,
            request.body.password
        );

        if (!user) {
            throw new InvalidGrantError(
                "Invalid grant: user credentials are invalid"
            );
        }

        return user;
    }

    public async saveToken(
        user: User,
        client: Client,
        scope: string | string[]
    ) {
        const scope_ = await this.validateScope(user, client, scope);
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
            refreshToken: refreshToken,
            refreshTokenExpiresAt: refreshTokenExpiresAt,
            scope: scope_,
            client,
            user,
        };

        return this.model.saveToken(token, client, user);
    }
}

import {
    InvalidArgumentError,
    InvalidGrantError,
    InvalidRequestError,
    ServerError,
} from "../errors/index.js";
import { Request } from "../request.js";
import { AuthorizationCode, Client, Token, User } from "../types.js";
import { uri, vschar } from "../utils/index.js";
import { AbstractGrantType } from "./abstract-grant-type.js";
import { getHashForCodeChallenge } from "../pkce/pkce.js";

export class AuthorizationCodeGrantType extends AbstractGrantType {
    public constructor(options?: Record<string, any>) {
        options = options || {};

        if (!options.model) {
            throw new InvalidArgumentError("Missing parameter: `model`");
        }

        if (!options.model.getAuthorizationCode) {
            throw new InvalidArgumentError(
                "Invalid argument: model does not implement `getAuthorizationCode()`"
            );
        }

        if (!options.model.revokeAuthorizationCode) {
            throw new InvalidArgumentError(
                "Invalid argument: model does not implement `revokeAuthorizationCode()`"
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

        const code = await this.getAuthorizationCode(request, client);
        await this.validateRedirectUri(request, code);

        await this.revokeAuthorizationCode(code);

        return await this.saveToken(code.user, client, code, code.scope!);
    }

    async getAuthorizationCode(request: Request, client: Client) {
        if (!request.body.code) {
            throw new InvalidRequestError("Missing parameter: `code`");
        }

        if (!vschar(request.body.code)) {
            throw new InvalidRequestError("Invalid parameter: `code`");
        }

        const code = await this.model.getAuthorizationCode(request.body.code);

        if (!code) {
            throw new InvalidGrantError(
                "Invalid grant: authorization code is invalid"
            );
        }

        if (!code.client) {
            throw new ServerError(
                "Server error: `getAuthorizationCode()` did not return a `client` object"
            );
        }

        if (!code.user) {
            throw new ServerError(
                "Server error: `getAuthorizationCode()` did not return a `user` object"
            );
        }

        if (code.client.id !== client.id) {
            throw new InvalidGrantError(
                "Invalid grant: authorization code is invalid"
            );
        }

        if (!(code.expiresAt instanceof Date)) {
            throw new ServerError(
                "Server error: `expiresAt` must be a Date instance"
            );
        }

        if (code.expiresAt < new Date()) {
            throw new InvalidGrantError(
                "Invalid grant: authorization code has expired"
            );
        }

        if (code.redirectUri && !uri(code.redirectUri)) {
            throw new InvalidGrantError(
                "Invalid grant: `redirect_uri` is not a valid URI"
            );
        }

        // optional: PKCE code challenge

        if (code.codeChallenge) {
            if (!request.body.code_verifier) {
                throw new InvalidGrantError(
                    "Missing parameter: `code_verifier`"
                );
            }

            const hash = getHashForCodeChallenge(
                code.codeChallengeMethod!,
                request.body.code_verifier
            );

            if (!hash) {
                // notice that we assume that codeChallengeMethod is already
                // checked at an earlier stage when being read from
                // request.body.code_challenge_method
                throw new ServerError(
                    "Server error: `getAuthorizationCode()` did not return a valid `codeChallengeMethod` property"
                );
            }

            if (code.codeChallenge !== hash) {
                throw new InvalidGrantError(
                    "Invalid grant: code verifier is invalid"
                );
            }
        } else {
            if (request.body.code_verifier) {
                // No code challenge but code_verifier was passed in.
                throw new InvalidGrantError(
                    "Invalid grant: code verifier is invalid"
                );
            }
        }

        return code;
    }

    public validateRedirectUri(request: Request, code: AuthorizationCode) {
        if (!code.redirectUri) {
            return;
        }

        const redirectUri =
            request.body.redirect_uri || request.query.redirect_uri;

        if (!uri(redirectUri)) {
            throw new InvalidRequestError(
                "Invalid request: `redirect_uri` is not a valid URI"
            );
        }

        if (redirectUri !== code.redirectUri) {
            throw new InvalidRequestError(
                "Invalid request: `redirect_uri` is invalid"
            );
        }
    }

    public async revokeAuthorizationCode(code: AuthorizationCode) {
        const status = await this.model.revokeAuthorizationCode(code);

        if (!status)
            throw new InvalidGrantError(
                "Invalid grant: authorization code is invalid"
            );

        return code;
    }

    public async saveToken(
        user: User,
        client: Client,
        authorizationCode: AuthorizationCode,
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
            authorizationCode: authorizationCode,
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

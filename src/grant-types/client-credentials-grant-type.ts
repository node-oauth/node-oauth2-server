import { InvalidArgumentError, InvalidGrantError } from "../errors/index.js";
import { Request } from "../request.js";
import { Client, ClientCredentialsModel, Token, User } from "../types.js";
import { AbstractGrantType } from "./abstract-grant-type.js";

export class ClientCredentialsGrantType extends AbstractGrantType<ClientCredentialsModel> {
    public constructor(options?: Record<string, any>) {
        options = options || {};

        if (!options.model) {
            throw new InvalidArgumentError("Missing parameter: `model`");
        }

        if (!options.model.getUserFromClient) {
            throw new InvalidArgumentError(
                "Invalid argument: model does not implement `getUserFromClient()`"
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

        const user = await this.getUserFromClient(client);
        const token = await this.saveToken(user, client, scope);

        return token;
    }

    public async getUserFromClient(client: Client) {
        const user = this.model.getUserFromClient(client);

        if (!user)
            throw new InvalidGrantError(
                "Invalid grant: user credentials are invalid"
            );

        return user;
    }

    public async saveToken(
        user: User,
        client: Client,
        scope: string | string[]
    ) {
        const _scope = await this.validateScope(user, client, scope);
        const accessToken = await this.generateAccessToken(client, user, scope);
        const accessTokenExpiresAt = this.getAccessTokenExpiresAt();

        const token: Token = {
            accessToken: accessToken,
            accessTokenExpiresAt: accessTokenExpiresAt,
            scope: _scope,
            client,
            user,
        };

        const saved = await this.model.saveToken(token, client, user);

        return saved;
    }
}

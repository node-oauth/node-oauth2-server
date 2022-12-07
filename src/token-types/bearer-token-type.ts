import { InvalidArgumentError } from "../errors/index.js";
import { RefreshToken, Token } from "../types.js";

export class BearerTokenType {
    public accessToken: Token;
    public accessTokenLifetime: number;
    public refreshToken: RefreshToken;
    public scope: string | string[];
    public customAttributes?: Record<string, any>;

    public constructor(
        accessToken: Token,
        accessTokenLifetime: number,
        refreshToken: RefreshToken,
        scope: string | string[],
        customAttributes?: Record<string, any>
    ) {
        if (!accessToken) {
            throw new InvalidArgumentError("Missing parameter: `accessToken`");
        }

        this.accessToken = accessToken;
        this.accessTokenLifetime = accessTokenLifetime;
        this.refreshToken = refreshToken;
        this.scope = scope;

        if (customAttributes) {
            this.customAttributes = customAttributes;
        }
    }

    public valueOf() {
        const object: any = {
            access_token: this.accessToken,
            token_type: "Bearer",
        };

        if (this.accessTokenLifetime) {
            object.expires_in = this.accessTokenLifetime;
        }

        if (this.refreshToken) {
            object.refresh_token = this.refreshToken;
        }

        if (this.scope) {
            object.scope = this.scope;
        }

        for (const key in this.customAttributes) {
            if (
                Object.prototype.hasOwnProperty.call(this.customAttributes, key)
            ) {
                object[key] = this.customAttributes[key];
            }
        }
        return object;
    }
}

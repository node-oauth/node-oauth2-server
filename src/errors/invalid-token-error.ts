import { OAuthError } from "./oauth-error.js";

export class InvalidTokenError extends OAuthError {
    constructor(message: string) {
        super(message, 401);
    }
}

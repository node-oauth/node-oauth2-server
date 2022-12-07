import { OAuthError } from "./oauth-error.js";

export class UnauthorizedClientError extends OAuthError {
    constructor(message: string) {
        super(message, 400);
    }
}

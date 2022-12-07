import { OAuthError } from "./oauth-error.js";

export class InvalidScopeError extends OAuthError {
    constructor(message: string) {
        super(message, 400);
    }
}

import { OAuthError } from "./oauth-error.js";

export class InsufficientScopeError extends OAuthError {
    constructor(message: string) {
        super(message, 403);
    }
}

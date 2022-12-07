import { OAuthError } from "./oauth-error.js";

export class AccessDeniedError extends OAuthError {
    constructor(message: string) {
        super(message, 400);
    }
}

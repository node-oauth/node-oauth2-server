import { OAuthError } from "./oauth-error.js";

export class UnauthorizedRequestError extends OAuthError {
    constructor(message: string) {
        super(message, 401);
    }
}

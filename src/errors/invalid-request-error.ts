import { OAuthError } from "./oauth-error.js";

export class InvalidRequestError extends OAuthError {
    constructor(message: string) {
        super(message, 400);
    }
}

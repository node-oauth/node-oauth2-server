import { OAuthError } from "./oauth-error.js";

export class InvalidClientError extends OAuthError {
    constructor(message: string, code = 401) {
        super(message, code);
    }
}

import { OAuthError } from "./oauth-error.js";

export class ServerError extends OAuthError {
    constructor(message: string) {
        super(message, 500);
    }
}

import { OAuthError } from "./oauth-error.js";

export class InvalidArgumentError extends OAuthError {
    constructor(message: string) {
        super(message, 500);
    }
}

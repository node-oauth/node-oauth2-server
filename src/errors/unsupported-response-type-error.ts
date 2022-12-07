import { OAuthError } from "./oauth-error.js";

export class UnsupportedResponseTypeError extends OAuthError {
    constructor(message: string) {
        super(message, 400);
    }
}

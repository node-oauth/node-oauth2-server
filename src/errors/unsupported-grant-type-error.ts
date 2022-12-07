import { OAuthError } from "./oauth-error.js";

export class UnsupportedGrantTypeError extends OAuthError {
    constructor(message: string) {
        super(message, 400);
    }
}

import { parse } from "url";
import { InvalidArgumentError } from "../errors/index.js";

export class CodeResponseType {
    public code: string;

    public constructor(code: string) {
        if (!code) {
            throw new InvalidArgumentError("Missing parameter: `code`");
        }

        this.code = code;
    }

    public buildRedirectUri(redirectUri: string) {
        if (!redirectUri) {
            throw new InvalidArgumentError("Missing parameter: `redirectUri`");
        }

        const uri = parse(redirectUri, true);

        uri.query.code = this.code;
        uri.search = null;

        return uri;
    }
}

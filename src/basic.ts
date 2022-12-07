import { IncomingMessage } from "http";
import { Http2ServerRequest } from "http2";
import { Buffer } from "safe-buffer";

export const CREDENTIALS_REGEXP =
    /^ *(?:[Bb][Aa][Ss][Ii][Cc]) +([A-Za-z0-9._~+/-]+=*) *$/;

export const USER_PASS_REGEXP = /^([^:]*):(.*)$/;

export const auth = (req: IncomingMessage | Http2ServerRequest) => {
    if (!req) {
        throw new TypeError("argument req is required");
    }

    if (typeof req !== "object") {
        throw new TypeError("argument req is required to be an object");
    }

    const header = getAuthorization(req)!;

    return parse(header);
};

export const decodeBase64 = (str: string) => {
    return Buffer.from(str, "base64").toString();
};

export const getAuthorization = (req: IncomingMessage | Http2ServerRequest) => {
    if (!req.headers || typeof req.headers !== "object") {
        throw new TypeError(
            "argument req is required to have headers property"
        );
    }

    return req.headers.authorization;
};

export const parse = (string: string) => {
    if (typeof string !== "string") {
        return undefined;
    }

    const match = CREDENTIALS_REGEXP.exec(string);

    if (!match) {
        return undefined;
    }

    const userPass = USER_PASS_REGEXP.exec(decodeBase64(match[1]));

    if (!userPass) {
        return undefined;
    }

    return new Credentials(userPass[1], userPass[2]);
};

export class Credentials {
    public name: string;
    public pass: string;

    public constructor(name: string, pass: string) {
        this.name = name;
        this.pass = pass;
    }
}

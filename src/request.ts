import { InvalidArgumentError } from "./errors/index.js";

export class Request {
    public body: any;
    public headers: Record<string, string>;
    public method: string;
    public query: Record<string, string>;

    public constructor(options?: Record<string, any>) {
        options = options || {};

        if (!options.headers) {
            throw new InvalidArgumentError("Missing parameter: `headers`");
        }

        if (!options.method) {
            throw new InvalidArgumentError("Missing parameter: `method`");
        }

        if (!options.query) {
            throw new InvalidArgumentError("Missing parameter: `query`");
        }

        this.body = options.body || {};
        this.headers = {};
        this.method = options.method;
        this.query = options.query;

        for (const field in options.headers) {
            if (Object.prototype.hasOwnProperty.call(options.headers, field)) {
                this.headers[field.toLowerCase()] = options.headers[field];
            }
        }
    }

    public get(field: string) {
        return this.headers[field.toLowerCase()];
    }

    public is(types: string | string[]) {
        return (
            (typeof types === "string"
                ? this.headers["Content-Type"] == types
                : this.headers["Content-Type"] in types) || false
        );
    }
}

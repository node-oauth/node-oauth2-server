export class Response {
    public body: any;
    public headers: Record<string, string>;
    public status: number;

    public constructor(options?: Record<string, any>) {
        options = options || {};

        this.body = options.body || {};
        this.headers = {};
        this.status = 200;

        for (const field in options.headers) {
            if (Object.prototype.hasOwnProperty.call(options.headers, field)) {
                this.headers[field.toLowerCase()] = options.headers[field];
            }
        }
    }

    public get(field: string) {
        return this.headers[field.toLowerCase()];
    }

    public redirect(url: string) {
        this.set("Location", url);
        this.status = 302;
    }

    public set(field: string, value: string) {
        this.headers[field.toLowerCase()] = value;
    }
}

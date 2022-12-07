import http from "http";

export class OAuthError extends Error {
    public code: number;
    public status: number;
    public statusCode: number;
    public inner?: Error;

    public constructor(messageOrError: string | Error, code = 500) {
        let message =
            messageOrError instanceof Error
                ? messageOrError.message
                : messageOrError;

        const error = messageOrError instanceof Error ? messageOrError : null;

        if (!message || message.length === 0)
            message = http.STATUS_CODES[code] || "";

        super(message);

        this.code = this.status = this.statusCode = code;

        if (error) this.inner = error;

        Error.captureStackTrace(this, OAuthError);
    }
}

import { InvalidArgumentError } from "./errors/index.js";
import {
    AuthenticateHandler,
    AuthorizeHandler,
    TokenHandler,
} from "./handlers/index.js";
import { Request } from "./request.js";
import { Response } from "./response.js";

export class OAuth2Server {
    public options?: Record<string, any>;

    public constructor(options?: Record<string, any>) {
        options = options || {};

        if (!options.model) {
            throw new InvalidArgumentError("Missing parameter: `model`");
        }

        this.options = options;
    }

    public authenticate(
        request: Request,
        response: Response,
        options?: Record<string, any>
    ) {
        if (typeof options === "string") {
            options = { scope: options };
        }

        options = Object.assign(
            {
                addAcceptedScopesHeader: true,
                addAuthorizedScopesHeader: true,
                allowBearerTokensInQueryString: false,
            },
            this.options,
            options
        );

        return new AuthenticateHandler(options).handle(request, response);
    }

    public authorize(
        request: Request,
        response: Response,
        options: Record<string, any>
    ) {
        options = Object.assign(
            {
                allowEmptyState: false,
                authorizationCodeLifetime: 5 * 60,
            },
            this.options,
            options
        );

        return new AuthorizeHandler(options).handle(request, response);
    }

    public token(
        request: Request,
        response: Response,
        options: Record<string, any>
    ) {
        options = Object.assign(
            {
                accessTokenLifetime: 60 * 60,
                refreshTokenLifetime: 60 * 60 * 24 * 14,
                allowExtendedTokenAttributes: false,
                requireClientAuthentication: {},
            },
            this.options,
            options
        );

        return new TokenHandler(options).handle(request, response);
    }
}

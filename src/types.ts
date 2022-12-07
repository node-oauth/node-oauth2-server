export type Callback<T> = (err?: any, result?: T) => void;
export type Falsey = "" | 0 | false | null | undefined;

export interface BaseModel {
    generateAccessToken?(
        client: Client,
        user: User,
        scope: string | string[],
        callback?: Callback<string>
    ): Promise<string>;

    getClient(
        clientId: string,
        clientSecret?: string,
        callback?: Callback<Client | Falsey>
    ): Promise<Client | Falsey>;

    saveToken(
        token: Token,
        client: Client,
        user: User,
        callback?: Callback<Token>
    ): Promise<Token | Falsey>;
}

export interface User {
    [key: string]: any;
}

export interface Client {
    id: string;
    redirectUris?: string | string[] | undefined;
    grants: string | string[];
    accessTokenLifetime?: number | undefined;
    refreshTokenLifetime?: number | undefined;
    [key: string]: any;
}

export interface Token {
    accessToken: string;
    accessTokenExpiresAt?: Date | undefined;
    refreshToken?: string | undefined;
    refreshTokenExpiresAt?: Date | undefined;
    scope?: string | string[] | undefined;
    client: Client;
    user: User;
    [key: string]: any;
}

export interface RequestAuthenticationModel extends BaseModel {
    getAccessToken(
        accessToken: string,
        callback?: Callback<Token>
    ): Promise<Token | Falsey>;

    verifyScope(
        token: Token,
        scope: string | string[],
        callback?: Callback<boolean>
    ): Promise<boolean>;

    generateRefreshToken?(
        client: Client,
        user: User,
        scope: string | string[],
        callback?: Callback<string>
    ): Promise<string>;

    validateScope?(
        user: User,
        client: Client,
        scope: string | string[],
        callback?: Callback<string | Falsey>
    ): Promise<string | string[] | Falsey>;
}

export interface AuthorizationCodeModel extends RequestAuthenticationModel {
    generateAuthorizationCode?(
        client: Client,
        user: User,
        scope: string | string[],
        callback?: Callback<string>
    ): Promise<string>;

    getAuthorizationCode(
        authorizationCode: string,
        callback?: Callback<AuthorizationCode>
    ): Promise<AuthorizationCode | Falsey>;

    saveAuthorizationCode(
        code: Pick<
            AuthorizationCode,
            | "authorizationCode"
            | "expiresAt"
            | "redirectUri"
            | "scope"
            | "codeChallenge"
            | "codeChallengeMethod"
        >,
        client: Client,
        user: User,
        callback?: Callback<AuthorizationCode>
    ): Promise<AuthorizationCode>;

    revokeAuthorizationCode(
        code: AuthorizationCode,
        callback?: Callback<boolean>
    ): Promise<boolean>;
}

export interface AuthorizationCode {
    authorizationCode: string;
    expiresAt: Date;
    redirectUri: string;
    scope?: string | string[] | undefined;
    client: Client;
    user: User;
    codeChallenge?: string;
    codeChallengeMethod?: string;
    [key: string]: any;
}

export interface ClientCredentialsModel extends RequestAuthenticationModel {
    getUserFromClient(
        client: Client,
        callback?: Callback<User | Falsey>
    ): Promise<User>;

    validateScope?(
        user: User,
        client: Client,
        scope: string | string[],
        callback?: Callback<string | Falsey>
    ): Promise<string | string[] | Falsey>;
}

export interface PasswordModel extends RequestAuthenticationModel {
    generateRefreshToken?(
        client: Client,
        user: User,
        scope: string | string[],
        callback?: Callback<string>
    ): Promise<string>;

    getUser(
        username: string,
        password: string,
        callback?: Callback<User | Falsey>
    ): Promise<User | Falsey>;

    validateScope?(
        user: User,
        client: Client,
        scope: string | string[],
        callback?: Callback<string | Falsey>
    ): Promise<string | string[] | Falsey>;
}

export interface RefreshTokenModel extends RequestAuthenticationModel {
    generateRefreshToken?(
        client: Client,
        user: User,
        scope: string | string[],
        callback?: Callback<string>
    ): Promise<string>;

    getRefreshToken(
        refreshToken: string,
        callback?: Callback<RefreshToken>
    ): Promise<RefreshToken | Falsey>;

    revokeToken(
        token: RefreshToken | Token,
        callback?: Callback<boolean>
    ): Promise<boolean>;
}

export interface RefreshToken {
    refreshToken: string;
    refreshTokenExpiresAt?: Date | undefined;
    scope?: string | string[] | undefined;
    client: Client;
    user: User;
    [key: string]: any;
}

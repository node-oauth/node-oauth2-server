import { createHash, base64URLEncode } from "../utils/index.js";

export const codeChallengeRegexp = /^([a-zA-Z0-9.\-_~]){43,128}$/;

export const getHashForCodeChallenge = (method: string, verifier: string) => {
    if (isValidMethod(method) && verifier.length > 0) {
        if (method === "plain") {
            return verifier;
        }

        if (method === "S256") {
            const hash = createHash("sha256", verifier, "base64");
            return base64URLEncode(hash);
        }
    }
};

export const isPKCERequest = (grantType: string, codeVerifier: boolean) => {
    return grantType === "authorization_code" && !!codeVerifier;
};

export const codeChallengeMatchesABNF = (codeChallenge: string) => {
    return !!codeChallenge.match(codeChallengeRegexp);
};

export const isValidMethod = (method: string) => {
    return method === "S256" || method === "plain";
};

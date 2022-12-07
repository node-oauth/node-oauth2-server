import crypto, { BinaryToTextEncoding } from "crypto";

export const createHash = (
    algorithm = "sha256",
    data: Buffer | string | DataView,
    encoding: BinaryToTextEncoding
) => {
    return crypto.createHash(algorithm).update(data).digest(encoding);
};

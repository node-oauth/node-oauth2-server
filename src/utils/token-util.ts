import { randomBytes } from "crypto";
import { createHash } from "./crypto-util.js";

export const generateRandomToken = () => {
    return createHash("sha256", randomBytes(256), "hex");
};

export const bool2Int = (b: boolean) => {
    if (b === true) return 1;
    else return 0;
};

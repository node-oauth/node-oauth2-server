export const rules = {
    NCHAR: /^[\u002D\u002E\u005F\w]+$/,
    NQCHAR: /^[\u0021\u0023-\u005B\u005D-\u007E]+$/,
    NQSCHAR: /^[\u0020-\u0021\u0023-\u005B\u005D-\u007E]+$/,
    UNICODECHARNOCRLF: /^[\u0009\u0020-\u007E\u0080-\uD7FF\uE000-\uFFFD]+$/,
    UNICODECHARNOCRLF_EXTENDED: /^[\u{10000}-\u{10FFFF}]+$/u,
    URI: /^[a-zA-Z][a-zA-Z0-9+.-]+:/,
    VSCHAR: /^[\u0020-\u007E]+$/,
};

export const nchar = (value: string) => {
    return rules.NCHAR.test(value);
};

export const nqchar = (value: string) => {
    return rules.NQCHAR.test(value);
};

export const nqschar = (value: string) => {
    return rules.NQSCHAR.test(value);
};

export const uchar = (value: string) => {
    if (rules.UNICODECHARNOCRLF.test(value)) {
        return true;
    }

    return rules.UNICODECHARNOCRLF_EXTENDED.test(value);
};

export const uri = (value: string) => {
    return rules.URI.test(value);
};

export const vschar = (value: string) => {
    return rules.VSCHAR.test(value);
};

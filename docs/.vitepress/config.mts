import {defineConfig} from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "@node-oauth/oauth2-server",
    description: "OAuth2 server for Node.js",
    head: [['link', { rel: 'icon', href: '/images/favicon.ico' }]],
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            {text: 'Home', link: '/'},
            {text: 'Guide', link: '/guide/getting-started'},
            {text: 'API', link: '/api/server'}
        ],

        sidebar: [
            {
                text: 'Guide',
                items: [
                    {text: 'Getting started', link: '/guide/getting-started'},
                    {text: 'Grant types', link: '/guide/grant-types'},
                    {text: 'Model', link: '/guide/model'},
                    {text: 'Token types', link: '/guide/token-types'},
                    {text: 'PKCE', link: '/guide/pkce'},
                    {text: 'Adapters', link: '/guide/adapters'},
                    {text: 'Migrating to v5', link: '/guide/migrating-to-v5'},
                    {text: 'Contributing', link: '/guide/contributing'},
                ]
            },
            {
                text: 'API',
                items: [
                    {text: 'OAuth2Server', link: '/api/server'},
                    {text: 'Model', link: '/api/model'},
                    {text: 'Request', link: '/api/request'},
                    {text: 'Response', link: '/api/response'},
                    {
                        text: 'Errors', items: [
                            {text: 'Access Denied', link: '/api/errors/access-denied-error'},
                            {text: 'Insufficient Scope', link: '/api/errors/insufficient-scope-error'},
                            {text: 'Invalid Argument', link: '/api/errors/invalid-argument-error'},
                            {text: 'Invalid Client', link: '/api/errors/invalid-client-error'},
                            {text: 'Invalid Grant', link: '/api/errors/invalid-grant-error'},
                            {text: 'Invalid Request', link: '/api/errors/invalid-request-error'},
                            {text: 'Invalid Scope', link: '/api/errors/invalid-scope-error'},
                            {text: 'Invalid Token', link: '/api/errors/invalid-token-error'},
                            {text: 'OAuth Error', link: '/api/errors/oauth-error'},
                            {text: 'Server Error', link: '/api/errors/server-error'},
                            {text: 'Unauthorized Client', link: '/api/errors/unauthorized-client-error'},
                            {text: 'Unauthorized Request', link: '/api/errors/unauthorized-request-error'},
                            {text: 'Unsupported Grant Type', link: '/api/errors/unsupported-grant-type-error'},
                            {text: 'Unsupported Response Type', link: '/api/errors/unsupported-response-type-error'},
                        ]
                    },
                    {
                        text: 'Grant Types', items: [
                            { text: 'Abstract Grant Type', link: '/api/grant-types/abstract-grant-type' },
                            { text: 'Authorization Code', link: '/api/grant-types/authorization-code-grant-type' },
                            { text: 'Client Credentials', link: '/api/grant-types/client-credentials-grant-type' },
                            { text: 'Password', link: '/api/grant-types/password-grant-type' },
                            { text: 'Refresh Token', link: '/api/grant-types/refresh-token-grant-type' },
                        ]
                    },
                    {
                        text: 'Handlers', items: [
                            { text: 'Authenticate Handler', link: '/api/handlers/authenticate-handler' },
                            { text: 'Authorize Handler', link: '/api/handlers/authorize-handler' },
                            { text: 'Token Handler', link: '/api/handlers/token-handler' },
                        ]
                    },
                    {
                        text: 'Models', items: [
                            { text: 'Token Model', link: '/api/models/token-model' },
                        ]
                    },
                    {
                        text: 'PKCE', items: [
                            { text: 'PKCE', link: '/api/pkce/pkce' },
                        ]
                    },
                    {
                        text: 'Response Types', items: [
                            { text: 'Code', link: '/api/response-types/code-response-type' },
                            { text: 'Token', link: '/api/response-types/token-response-type' },
                        ]
                    },
                    {
                        text: 'Token Types', items: [
                            { text: 'Bearer', link: '/api/token-types/bearer-token-type' },
                            { text: 'Mac', link: '/api/token-types/mac-token-type' },
                        ]
                    },
                    {
                        text: 'Utils', items: [
                            { text: 'Crypto', link: '/api/utils/crypto-util' },
                            { text: 'Date', link: '/api/utils/date-util' },
                            { text: 'Scope', link: '/api/utils/scope-util' },
                            { text: 'String', link: '/api/utils/string-util' },
                            { text: 'Token', link: '/api/utils/token-util' },
                        ]
                    },
                ]
            }
        ],

        socialLinks: [
            {icon: 'github', link: 'https://github.com/node-oauth/node-oauth2-server'}
        ]
    }
})

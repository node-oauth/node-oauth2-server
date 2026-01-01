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
            {text: 'API', link: '/api/oauth2-server'}
        ],

        sidebar: [
            {
                text: 'Guide',
                items: [
                    {text: 'Getting started', link: '/guide/getting-started'},
                    {text: 'Model', link: '/guide/model'},
                    {text: 'PKCE', link: '/guide/pkce'},
                    {text: 'Adapters', link: '/guide/adapters'},
                    {text: 'Extension grants', link: '/guide/extension-grants'},
                    {text: 'Migrating to v5', link: '/guide/migrating-to-v5'},
                ]
            },
            {
                text: 'API',
                items: [
                    {text: 'OAuth2Server', link: '/api/oauth2-server'},
                    {text: 'Model', link: '/api/model'},
                    {text: 'Request', link: '/api/request'},
                    {text: 'Response', link: '/api/response'},
                    {
                        text: 'Errors', items: [
                            {text: 'Overview', link: '/api/errors'},
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
                ]
            }
        ],

        socialLinks: [
            {icon: 'github', link: 'https://github.com/node-oauth/node-oauth2-server'}
        ]
    }
})

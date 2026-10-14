'use strict';

// Run from the repository root after npm run docs:build.
// Exercises the documentation's actual snippets, using only in-memory fixtures.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { parse } = require('@babel/parser');
const OAuth2Server = require('../..');
const { Request, Response } = OAuth2Server;
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
let passed = 0;
async function check(name, fn) {
  await fn();
  console.log(`PASS ${++passed}: ${name}`);
}

function example(name, db) {
  const block = read('lib/model.js').match(new RegExp(' \\* (?:async )?function ' + name + '\\([\\s\\S]*?\\n\\s*\\*/'))[0];
  const source = block.replace(/\n\s*\*\/$/, '').replace(/^\s*\* ?/gm, '');
  return new Function('db', `${source}\nreturn ${name};`)(db);
}
function fenced(file) {
  return [...read(file).matchAll(/```\s*js\n([\s\S]*?)```/g)].map(m => m[1]);
}
function frameworkResponse() {
  return {
    headers: {}, statusCode: 200,
    set(headers) { Object.assign(this.headers, headers); return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    end() { this.ended = true; return this; }
  };
}
const user = { id: 'user' };
const client = { id: 'client', grants: ['authorization_code', 'refresh_token', 'client_credentials'], redirectUris: ['https://client.example/callback'] };
const future = () => new Date(Date.now() + 60000);
const tokenRequest = body => new Request({ method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'content-length': '100' }, query: {}, body });
const authRequest = overrides => ({ method: 'GET', headers: {}, query: { client_id: client.id, response_type: 'code', state: 'state-123', ...overrides }, session: { user } });

async function main() {
  const records = {};
  const db = {
    async saveAccessToken(row) { records.access = row; return row; },
    async saveRefreshToken(row) { records.refresh = row; return row; },
    async saveAuthorizationCode(row) { records.code = row; return row; },
    async queryAccessToken({ access_token }) { return records.access?.access_token === access_token ? records.access : null; },
    async queryRefreshToken({ refresh_token }) { return records.refresh?.refresh_token === refresh_token ? records.refresh : null; },
    async queryAuthorizationCode({ authorization_code }) { return records.code?.authorization_code === authorization_code ? records.code : null; },
    async queryClient() { return client; },
    async queryUser() { return user; }
  };
  const snippets = Object.fromEntries(['saveToken', 'getAccessToken', 'getRefreshToken', 'saveAuthorizationCode', 'getAuthorizationCode'].map(name => [name, example(name, db)]));

  await check('native Promise save/load examples, with and without refresh fields', async () => {
    const access = { accessToken: 'access', accessTokenExpiresAt: future(), scope: ['read'] };
    assert.deepEqual(await snippets.saveToken(access, client, user), { ...access, client, user });
    assert.equal(records.refresh, undefined);
    assert.deepEqual(await snippets.getAccessToken('access'), { ...access, client, user });
    const token = { ...access, refreshToken: 'refresh', refreshTokenExpiresAt: future() };
    await snippets.saveToken(token, client, user);
    assert.deepEqual(await snippets.getRefreshToken('refresh'), { refreshToken: 'refresh', refreshTokenExpiresAt: token.refreshTokenExpiresAt, scope: ['read'], client, user });
    for (const name of ['getAccessToken', 'getRefreshToken', 'getAuthorizationCode']) assert.equal(await snippets[name]('missing'), false);
  });

  const verifier = 'a'.repeat(43);
  const pkce = require('../../lib/pkce/pkce');
  const challenge = pkce.getHashForCodeChallenge({ method: 'S256', verifier });
  const model = { ...snippets, getClient: async () => client, revokeAuthorizationCode: async () => { delete records.code; return true; } };
  const oauth = new OAuth2Server({ model });
  const code = { authorizationCode: 'code', expiresAt: future(), redirectUri: client.redirectUris[0], scope: ['read'], codeChallenge: challenge, codeChallengeMethod: 'S256' };
  await check('documented code mappings retain PKCE fields and matching verifier exchanges', async () => {
    const saved = await snippets.saveAuthorizationCode(code, client, user);
    assert.equal(saved.codeChallenge, challenge);
    assert.equal(saved.codeChallengeMethod, 'S256');
    assert.deepEqual(await snippets.getAuthorizationCode('code'), { ...code, client, user });
    const response = new Response();
    await oauth.token(tokenRequest({ grant_type: 'authorization_code', client_id: client.id, code: 'code', code_verifier: verifier, redirect_uri: code.redirectUri }), response);
    assert.equal(response.body.scope, 'read');
    assert.equal(response.body.token_type, 'Bearer');
    assert.equal(records.code, undefined);
  });
  await check('failed PKCE consumes the code', async () => {
    await snippets.saveAuthorizationCode(code, client, user);
    await assert.rejects(oauth.token(tokenRequest({ grant_type: 'authorization_code', client_id: client.id, code: 'code', code_verifier: 'b'.repeat(43), redirect_uri: code.redirectUri }), new Response()), { name: 'invalid_grant' });
    assert.equal(records.code, undefined);
  });

  const customSource = fenced('docs/guide/grant-types.md')[0];
  const module = { exports: {} };
  new Function('require', 'module', customSource)(() => OAuth2Server, module);
  const Custom = module.exports;
  let saves = 0;
  let generatorScopes = [];
  const customModel = {
    getClient: async () => ({ ...client, grants: ['urn:example:custom'] }),
    validateScope: async () => ['read'],
    generateAccessToken: async (_c, _u, scope) => { generatorScopes.push(scope); return 'access'; },
    generateRefreshToken: async (_c, _u, scope) => { generatorScopes.push(scope); return 'refresh'; },
    saveToken: async (token, client, user) => { saves++; return { ...token, client, user }; }
  };
  const custom = new Custom({ model: customModel, accessTokenLifetime: 60, refreshTokenLifetime: 60 });
  await check('extension snippet awaits and uses reduced scope', async () => {
    const token = await custom.saveToken(user, client, ['read', 'write']);
    assert.deepEqual(token.scope, ['read']);
    assert.deepEqual(generatorScopes, [['read'], ['read']]);
  });
  await check('async scope rejection prevents token generation and saving', async () => {
    customModel.validateScope = async () => { await Promise.resolve(); return false; };
    await assert.rejects(custom.saveToken(user, client, ['write']), { name: 'invalid_scope' });
    assert.equal(saves, 1);
    assert.equal(generatorScopes.length, 2);
  });
  await check('extension grant requires client approval and returns narrowed wire scope', async () => {
    Custom.prototype.getUserBySomething = async () => user;
    customModel.validateScope = async () => ['read'];
    const server = new OAuth2Server({ model: customModel, extendedGrantTypes: { 'urn:example:custom': Custom } });
    const request = tokenRequest({ grant_type: 'urn:example:custom', client_id: 'client', client_secret: 'secret', scope: 'read write' });
    const response = new Response();
    await server.token(request, response);
    assert.equal(response.body.scope, 'read');
    customModel.getClient = async () => client;
    await assert.rejects(server.token(request, new Response()), { name: 'unauthorized_client' });
  });

  const routes = {};
  const context = { OAuth2Server, Request, Response, oauth, app: { get: (route, fn) => { routes[route] = fn; } } };
  vm.createContext(context);
  vm.runInContext(fenced('docs/guide/getting-started.md')[1], context);
  await check('authorization route forwards denial redirect and state', async () => {
    const res = frameworkResponse();
    await routes['/authorize'](authRequest({ allowed: 'false' }), res);
    assert.equal(res.statusCode, 302);
    const location = new URL(res.headers.location);
    assert.equal(location.searchParams.get('error'), 'access_denied');
    assert.equal(location.searchParams.get('state'), 'state-123');
  });
  await check('authorization route sends early invalid-client failure locally', async () => {
    model.getClient = async () => false;
    const res = frameworkResponse();
    await routes['/authorize'](authRequest(), res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'invalid_client');
    assert.equal(res.headers.location, undefined);
    model.getClient = async () => client;
  });
  await check('local error helper hides arbitrary exception messages', () => {
    const res = frameworkResponse();
    context.sendLocalError(res, new Error('private storage details'), new Response());
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.error_description, 'Internal server error');
  });
  await check('early token and authentication failures do not become HTTP 200', async () => {
    const response = new Response();
    await assert.rejects(oauth.token(new Request(authRequest()), response), { name: 'invalid_request' });
    assert.equal(response.status, 200);
    let res = frameworkResponse();
    context.sendLocalError(res, new OAuth2Server.InvalidRequestError('method'), response);
    assert.equal(res.statusCode, 400);
    try { await oauth.authenticate(new Request(authRequest()), response); } catch (err) {
      res = frameworkResponse();
      context.sendLocalError(res, err, response);
    }
    assert.equal(res.statusCode, 401);
    assert.match(res.headers['www-authenticate'], /Bearer/);
  });
  await check('falsy custom user produces 503 before redirect', async () => {
    const response = new Response();
    await assert.rejects(oauth.authorize(new Request(authRequest()), response, { authenticateHandler: { handle: () => false } }), { name: 'server_error', code: 503 });
    assert.equal(response.get('location'), undefined);
  });

  const wrappers = fenced('docs/guide/pkce.md').find(s => s.includes('function modelForEndpoint'));
  const servers = new Function('OAuth2Server', 'storageModel', 'findClient', 'verifyClientSecret', `${wrappers}\nreturn { authorizationServer, tokenServer };`)(OAuth2Server, model, async id => id === client.id ? { ...client, confidential: true } : false, async (_client, secret) => secret === 'correct');
  await check('endpoint-specific lookup distinguishes missing and supplied secrets', async () => {
    assert.ok(await servers.authorizationServer.options.model.getClient(client.id, null));
    for (const secret of [undefined, null, '', 'wrong']) assert.equal(await servers.tokenServer.options.model.getClient(client.id, secret), false);
    assert.ok(await servers.tokenServer.options.model.getClient(client.id, 'correct'));
    const response = new Response();
    await servers.authorizationServer.authorize(new Request(authRequest()), response, { authenticateHandler: { handle: () => user } });
    assert.equal(response.status, 302);
    for (const secret of [undefined, 'wrong']) {
      await assert.rejects(servers.tokenServer.token(tokenRequest({ grant_type: 'authorization_code', client_id: client.id, client_secret: secret, code_verifier: verifier, code: 'code' }), new Response()), { name: 'invalid_client' });
    }
  });
  await check('scope wire boundary, helper return values and 64-character default', async () => {
    const { parseScope } = require('../../lib/utils/scope-util');
    assert.deepEqual(parseScope('read write'), ['read', 'write']);
    assert.equal(parseScope(null), undefined);
    assert.throws(() => parseScope(['read']), { name: 'invalid_scope' });
    assert.equal(tokenRequest({}).is('application/x-www-form-urlencoded'), 'application/x-www-form-urlencoded');
    assert.equal(tokenRequest({}).get('missing'), undefined);
    assert.match(await require('../../lib/utils/token-util').generateRandomToken(), /^[0-9a-f]{64}$/);
  });
  await check('per-grant map works while global false leaves authentication enabled', () => {
    const Handler = require('../../lib/handlers/token-handler');
    const opts = { model, accessTokenLifetime: 60, refreshTokenLifetime: 60 };
    assert.equal(new Handler({ ...opts, requireClientAuthentication: false }).isClientAuthenticationRequired('refresh_token'), true);
    assert.equal(new Handler({ ...opts, requireClientAuthentication: { refresh_token: false } }).isClientAuthenticationRequired('refresh_token'), false);
  });
  await check('plain PKCE gating and omitted-method defaults on both endpoints', () => {
    const Authorize = require('../../lib/handlers/authorize-handler');
    const Grant = require('../../lib/grant-types/authorization-code-grant-type');
    for (const enabled of [false, true]) {
      const options = { model, accessTokenLifetime: 60, authorizationCodeLifetime: 60, enablePlainPKCE: enabled, authenticateHandler: { handle: () => user } };
      const authorize = new Authorize(options);
      const grant = new Grant(options);
      assert.equal(authorize.getCodeChallengeMethod(new Request(authRequest())), enabled ? 'plain' : 'S256');
      assert.equal(grant.getCodeChallengeMethod(), enabled ? 'plain' : 'S256');
      if (!enabled) assert.throws(() => authorize.getCodeChallengeMethod(new Request(authRequest({ code_challenge_method: 'plain' }))));
    }
    assert.equal(pkce.isValidMethod('sha256'), false);
  });
  await check('disabled refresh rotation still requires revoke hook and omits new refresh fields', async () => {
    const Grant = require('../../lib/grant-types/refresh-token-grant-type');
    const options = { model: { getRefreshToken: () => ({ refreshToken: 'old', scope: ['read', 'write'], client, user }), saveToken: snippets.saveToken }, accessTokenLifetime: 60, refreshTokenLifetime: 60, alwaysIssueNewRefreshToken: false };
    assert.throws(() => new Grant(options), { name: 'invalid_argument' });
    options.model.revokeToken = () => { throw Error('must not revoke'); };
    const token = await new Grant(options).handle(tokenRequest({ refresh_token: 'old', scope: 'read' }), client);
    assert.equal(token.refreshToken, undefined);
    assert.deepEqual(token.scope, ['read']);
  });

  await check('generated server token example uses the resolved token', async () => {
    const source = fenced('docs/api/server.md').find(s => s.includes('function tokenHandler'));
    const factory = new Function('OAuth2Server', 'require', `${source}\nreturn tokenHandler;`)(OAuth2Server, () => ({ ...model, getUserFromClient: () => user }));
    const res = { ...frameworkResponse(), locals: {} };
    let continued = false;
    await factory({})(tokenRequest({ grant_type: 'client_credentials', client_id: client.id, client_secret: 'secret' }), res, () => { continued = true; });
    assert.equal(continued, true);
    assert.ok(res.locals.oauth.token.accessToken);
  });
  await check('PKCE guide endpoint sketches run with their documented prerequisites', async () => {
    const endpoints = {};
    const ctx = {
      require: () => OAuth2Server,
      model,
      app: { get: (p, fn) => { endpoints[p] = fn; }, post: (p, fn) => { endpoints[p] = fn; } },
      sendLocalError: context.sendLocalError
    };
    vm.createContext(ctx);
    for (const source of fenced('docs/guide/pkce.md').filter(s => s.includes("app.get('/authorize'") || s.includes("app.post('/token'"))) vm.runInContext(source, ctx);
    const authRes = frameworkResponse();
    await endpoints['/authorize'](authRequest({ code_challenge: challenge, code_challenge_method: 'S256', scope: 'read' }), authRes);
    assert.equal(authRes.statusCode, 302);
    const codeValue = new URL(authRes.headers.location).searchParams.get('code');
    const res = frameworkResponse();
    await endpoints['/token'](tokenRequest({ grant_type: 'authorization_code', client_id: client.id, code: codeValue, code_verifier: verifier, redirect_uri: client.redirectUris[0] }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.scope, 'read');
    assert.ok(res.body.access_token);
  });
  await check('early and caught programming errors follow the documented normalization boundaries', async () => {
    const failure = new OAuth2Server.InvalidArgumentError('fixture');
    const options = { authenticateHandler: { handle: () => user } };
    const early = new OAuth2Server({ model: { ...model, getClient: () => { throw failure; } } });
    await assert.rejects(early.authorize(new Request(authRequest()), new Response(), options), err => err === failure);
    const caught = new OAuth2Server({ model: { ...model, saveAuthorizationCode: () => { throw failure; } } });
    await assert.rejects(caught.authorize(new Request(authRequest()), new Response(), options), err => err.name === 'server_error' && err.inner === failure);
    const authenticate = new OAuth2Server({ model: { getAccessToken: () => { throw failure; } } });
    const request = new Request({ method: 'GET', query: {}, headers: { authorization: 'Bearer token' } });
    await assert.rejects(authenticate.authenticate(request, new Response()), err => err === failure);
    let ran = false;
    const generator = new OAuth2Server({ model: { *getAccessToken() { ran = true; return { user, accessTokenExpiresAt: future() }; } } });
    await assert.rejects(generator.authenticate(request, new Response()), { name: 'server_error' });
    assert.equal(ran, false);
  });

  await check('all changed library and generator executable ASTs match HEAD', () => {
    const files = execFileSync('git', ['diff', '--name-only', '--', 'lib', 'docs/build-api.js'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    function ast(source) {
      return JSON.stringify(parse(source), (key, value) => ['start', 'end', 'loc', 'comments', 'leadingComments', 'trailingComments', 'innerComments', 'extra'].includes(key) ? undefined : value);
    }
    for (const file of files) assert.equal(ast(read(file)), ast(execFileSync('git', ['show', `HEAD:${file}`], { cwd: root, encoding: 'utf8' })), file);
  });
  await check('guide JavaScript fences and repaired model examples parse', () => {
    for (const file of ['getting-started', 'pkce', 'grant-types']) for (const source of fenced(`docs/guide/${file}.md`)) parse(source);
    for (const file of ['server', 'request', 'response']) for (const source of fenced(`docs/api/${file}.md`)) parse(source);
    for (const block of read('lib/model.js').matchAll(/@example\n([\s\S]*?)(?=\n\s*\* @example|\n\s*\*\/)/g)) parse(block[1].replace(/^\s*\* ?/gm, ''));
  });
  await check('published HTML links resolve to pages and real rendered fragments', () => {
    const dist = path.join(root, 'docs/.vitepress/dist');
    const htmlFiles = fs.readdirSync(dist, { recursive: true }).filter(p => p.endsWith('.html'));
    const cache = new Map(htmlFiles.map(p => [p, fs.readFileSync(path.join(dist, p), 'utf8')]));
    let checked = 0;
    const failures = new Set();
    for (const [file, html] of cache) {
      for (const [, raw] of html.matchAll(/href="([^"]+)"/g)) {
        if (/^(https?:|mailto:|data:)/.test(raw)) continue;
        const url = new URL(raw.replaceAll('&amp;', '&'), `https://docs.example/node-oauth2-server/${file}`);
        let target = decodeURIComponent(url.pathname).replace(/^\/node-oauth2-server\//, '');
        if (!target) target = 'index.html';
        if (target.endsWith('/')) target += 'index.html';
        if (!path.extname(target)) target += '.html';
        if (!target.endsWith('.html')) continue;
        const content = cache.get(target);
        if (!content) { failures.add(`${file}: missing page ${raw}`); continue; }
        const fragment = decodeURIComponent(url.hash.slice(1));
        if (fragment && !content.includes(`id="${fragment}"`) && !content.includes(`name="${fragment}"`)) failures.add(`${file}: missing fragment ${raw}`);
        checked++;
      }
    }
    assert.deepEqual([...failures], []);
    assert.ok(!htmlFiles.some(p => p.startsWith('plans/')));
    console.log(`  ${checked} local page/fragment links checked; planning files excluded`);
  });
  console.log(`${passed} documentation checks passed.`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });

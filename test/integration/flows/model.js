const db = require('./db');
const scopes = ['read', 'write'];

async function getUser (username, password) {
  return db.findUser(username, password);
}

async function getClient (clientId, clientSecret) {
  return db.findClient(clientId, clientSecret);
}

async function saveToken (token, client, user) {
  const meta = {
    clientId: client.id,
    userId: user.id,
    scope: token.scope
  };

  token.client = client;
  token.user = user;

  if (token.accessToken) {
    db.saveAccessToken(token.accessToken, meta);
  }

  if (token.refreshToken) {
    db.saveRefreshToken(token.refreshToken, meta);
  }

  return token;
}

async function getAccessToken (accessToken) {
  const meta = db.findAccessToken(accessToken);

  return {
    accessToken,
    user: db.findUserById(meta.userId),
    client: db.findClientById(meta.clientId),
    scope: meta.scope
  };
}

async function verifyScope (token, scope) {
  if (typeof scope === 'string') {
    return scopes.includes(scope);
  } else {
    return scope.every(s => scopes.includes(s));
  }
}

const model = {
  getUser,
  getClient,
  saveToken,
  getAccessToken,
  verifyScope
};

module.exports = model;


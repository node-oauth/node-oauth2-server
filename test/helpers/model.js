const scopes = ['read', 'write'];

function createModel (db) {
  async function getUser (username, password) {
    return db.findUser(username, password);
  }

  async function getClient (clientId, clientSecret) {
    return db.findClient(clientId, clientSecret);
  }

  async function saveToken (token, client, user) {
    if (token.scope && !Array.isArray(token.scope)) {
      throw new Error('Scope should internally be an array');
    }
    const meta = {
      clientId: client.id,
      userId: user.id,
      scope: token.scope,
      accessTokenExpiresAt: token.accessTokenExpiresAt,
      refreshTokenExpiresAt: token.refreshTokenExpiresAt
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

    if (!meta) {
      return false;
    }
    if (meta.scope && !Array.isArray(meta.scope)) {
      throw new Error('Scope should internally be an array');
    }
    return {
      accessToken,
      accessTokenExpiresAt: meta.accessTokenExpiresAt,
      user: db.findUserById(meta.userId),
      client: db.findClientById(meta.clientId),
      scope: meta.scope
    };
  }

  async function getRefreshToken (refreshToken) {
    const meta = db.findRefreshToken(refreshToken);

    if (!meta) {
      return false;
    }
    if (meta.scope && !Array.isArray(meta.scope)) {
      throw new Error('Scope should internally be an array');
    }
    return {
      refreshToken,
      refreshTokenExpiresAt: meta.refreshTokenExpiresAt,
      user: db.findUserById(meta.userId),
      client: db.findClientById(meta.clientId),
      scope: meta.scope
    };
  }

  async function revokeToken (token) {
    db.deleteRefreshToken(token.refreshToken);

    return true;
  }

  async function verifyScope (token, scope) {
    if (!Array.isArray(scope)) {
      throw new Error('Scope should internally be an array');
    }
    return scope.every(s => scopes.includes(s));
  }

  return  {
    getUser,
    getClient,
    saveToken,
    getAccessToken,
    getRefreshToken,
    revokeToken,
    verifyScope
  };
}

module.exports = createModel;

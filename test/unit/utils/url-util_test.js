const { parseRedirectUri } = require('../../../lib/utils/url-util');
const InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
const should = require('chai').should();
const url = require('url');

describe(parseRedirectUri.name, () => {
  it('should return the fields of a legacy url.parse() result', () => {
    const uri = parseRedirectUri('https://user:pa%20ss@example.com:8443/a/b?x=1&x=2&y=#frag');

    uri.should.deep.equal({
      protocol: 'https:',
      slashes: true,
      auth: 'user:pa ss',
      host: 'example.com:8443',
      port: '8443',
      hostname: 'example.com',
      hash: '#frag',
      search: '?x=1&x=2&y=',
      query: 'x=1&x=2&y=',
      pathname: '/a/b',
      path: '/a/b?x=1&x=2&y=',
      href: 'https://user:pa%20ss@example.com:8443/a/b?x=1&x=2&y=#frag',
    });
  });

  it('should parse the query into an object when asked to', () => {
    const uri = parseRedirectUri('https://example.com/cb?x=1&x=2&y=', true);

    // A null-prototype object, as url.parse(value, true) returns.
    should.equal(Object.getPrototypeOf(uri.query), null);
    ({ ...uri.query }).should.deep.equal({ x: ['1', '2'], y: '' });
  });

  it('should return an empty query object for a URI without a query when asked to', () => {
    const uri = parseRedirectUri('https://example.com/cb', true);

    ({ ...uri.query }).should.deep.equal({});
    (uri.search === null).should.equal(true);
  });

  it('should keep an empty query as `?`, as url.parse() does', () => {
    const uri = parseRedirectUri('https://example.com/cb?');

    uri.search.should.equal('?');
    uri.query.should.equal('');
    uri.path.should.equal('/cb?');
  });

  it('should return null for the parts a URI does not have', () => {
    const uri = parseRedirectUri('http://localhost:3333/callback');

    (uri.auth === null).should.equal(true);
    (uri.hash === null).should.equal(true);
    (uri.search === null).should.equal(true);
    (uri.query === null).should.equal(true);
    uri.path.should.equal('/callback');
  });

  it('should give an IPv6 hostname without brackets, as url.parse() does', () => {
    const uri = parseRedirectUri('http://[::1]:5000/cb');

    uri.host.should.equal('[::1]:5000');
    uri.hostname.should.equal('::1');
  });

  it('should support private-use URI schemes for native apps (RFC 8252)', () => {
    const slashless = parseRedirectUri('com.example.app:/oauth2redirect');
    const slashed = parseRedirectUri('com.example.app://callback');

    slashless.protocol.should.equal('com.example.app:');
    (slashless.slashes === null).should.equal(true);
    (slashless.host === null).should.equal(true);
    slashless.pathname.should.equal('/oauth2redirect');
    slashed.slashes.should.equal(true);
    slashed.host.should.equal('callback');
    (slashed.pathname === null).should.equal(true);
    (slashed.path === null).should.equal(true);
    parseRedirectUri('com.example.app://callback?x=1').path.should.equal('?x=1');
  });

  it('should serialize with url.format() as a url.parse() result does', () => {
    const uris = [
      'http://example.com/cb',
      'http://example.com/cb?foo=bar',
      'https://example.com',
      'https://example.com:8443/a/b?x=1&x=2&y=',
      'http://[::1]:5000/cb?a=b',
      'https://user:pa%20ss@example.com/cb',
      'https://example.com/cb?q=a%20b&r=%E2%9C%93',
      'com.example.app:/oauth2redirect',
      'myapp://auth/callback?x=1',
    ];
    const expected = [
      'http://example.com/cb?code=c&state=s',
      'http://example.com/cb?foo=bar&code=c&state=s',
      'https://example.com/?code=c&state=s',
      'https://example.com:8443/a/b?x=1&x=2&y=&code=c&state=s',
      'http://[::1]:5000/cb?a=b&code=c&state=s',
      'https://user:pa%20ss@example.com/cb?code=c&state=s',
      'https://example.com/cb?q=a%20b&r=%E2%9C%93&code=c&state=s',
      'com.example.app:/oauth2redirect?code=c&state=s',
      'myapp://auth/callback?x=1&code=c&state=s',
    ];

    uris.forEach((value, index) => {
      // As CodeResponseType#buildRedirectUri and AuthorizeHandler#updateResponse change it.
      const uri = parseRedirectUri(value, true);
      uri.query.code = 'c';
      uri.search = null;
      uri.query.state = 's';

      url.format(uri).should.equal(expected[index]);
    });
  });

  it('should throw on a value that is not an absolute URI', () => {
    const invalid = ['/cb', 'cb', '', 'http://', '//example.com/cb', 'https://exa mple.com/cb'];

    invalid.forEach((value) => {
      try {
        parseRedirectUri(value);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid parameter: `redirectUri`');
      }
    });
  });

  it('should return the userinfo as it is when it is not valid percent-encoding', () => {
    const uri = parseRedirectUri('https://us%zzer@example.com/cb');

    uri.auth.should.equal('us%zzer');
  });
});

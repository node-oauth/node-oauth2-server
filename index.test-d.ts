import {expectType} from 'tsd';
import express from 'express'
import {
  OAuth2Server,
  OAuthError,
  Request,
  Response,
  AccessDeniedError,
  InsufficientScopeError,
  InvalidArgumentError,
  InvalidClientError,
  InvalidGrantError,
  InvalidRequestError,
  InvalidScopeError,
  InvalidTokenError,
  ServerError,
  UnauthorizedClientError,
  UnauthorizedRequestError,
  UnsupportedGrantTypeError,
  UnsupportedResponseTypeError
} from '.';
import {Request as UndiciRequest, Response as UndiciResponse} from 'undici';

// ----------------------------------------------------------------------------
// REQUEST
// ----------------------------------------------------------------------------
function testRequest(req: Request): void {
  expectType<string>(req.method);
  expectType<Record<string, string>>(req.headers);
  expectType<Record<string, string>>(req.query);
  expectType<any>(req.body);
}

const args = [
  undefined,
  {},
  {method: 'get'},
  {method: 'get', headers: {x: 'y'}},
  {method: 'get', query: {moo: 'foo'}},
  {method: 'get', headers: {x: 'y'}, query: {moo: 'foo'}},
  {method: 'get', headers: {x: 'y'}, query: {moo: 'foo', bar: 'baz'}},
  // check for express request compatibility
  new express.Request({
    method: 'get',
    query: {moo: 'foo'},
    headers: {x: 'y'}
  }),
  // check for compatibility with fetch api Request
  // we use undici Request as a stand-in for fetch api Request
  // because we still support older versions of Node.js
  new UndiciRequest(
    'https://example.com?moo=foo%2Cbar',
    {
      method: 'get', headers: {x: 'y'}
    })
];

for (const arg of args) {
  testRequest(new Request(arg));
}


// ----------------------------------------------------------------------------
// RESPONSE
// ----------------------------------------------------------------------------
function testResponse(res: Response): void {
  expectType<number>(res.status);
  expectType<Record<string, string>>(res.headers);
  expectType<any>(res.body);
}

const resArgs = [
  undefined,
  {},
  {status: 200},
  {status: 200, headers: {x: 'y'}},
  {status: 200, body: 'foo'},
  {status: 200, headers: {x: 'y'}, body: 'foo'},
  {status: 200, headers: {x: 'y'}, body: 'foo', statusText: 'OK'},
  // check for express response compatibility
  new express.Response({
    status: 200,
    headers: {x: 'y'},
    body: 'foo'
  }),
  // check for compatibility with fetch api Response
  // we use undici Response as a stand-in for fetch api Response
  // because we still support older versions of Node.js
  new UndiciResponse(
    'foo',
    {
      status: 200,
      headers: {x: 'y'},
      statusText: 'OK'
    })
];

for (const arg of resArgs) {
  testResponse(new Response(arg));
}

// ----------------------------------------------------------------------------
// ERRORS
// ----------------------------------------------------------------------------
function testError(err: OAuthError): void {
  expectType<string>(err.name);
  expectType<string>(err.message);
  expectType<number>(err.code);
}

const errorTypes = [
  AccessDeniedError,
  InsufficientScopeError,
  InvalidArgumentError,
  InvalidClientError,
  InvalidGrantError,
  InvalidRequestError,
  InvalidScopeError,
  InvalidTokenError,
  ServerError,
  UnauthorizedClientError,
  UnauthorizedRequestError,
  UnsupportedGrantTypeError,
  UnsupportedResponseTypeError
];

const errorArgs = [
  undefined,
  {},
  {message: 'foo'},
  {message: 'foo', code: 400},
  {message: 'foo', code: 400, data: {bar: 'baz'}},
  // check for express error compatibility
  new express.Error('foo'),
  // native error compatibility
  new Error('foo')
];

for (const arg of errorArgs) {
  for (const ErrorType of errorTypes) {
    testError(new ErrorType(arg));
  }
}
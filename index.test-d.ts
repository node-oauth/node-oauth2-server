import {expectType} from 'tsd';
import express from 'express'
import {OAuth2Server, Request, Response} from '.';
import { Request as UndiciRequest } from 'undici';

expectType<Request>(new Request());
expectType<Request>(new Request({}));

const req1 = new Request({ method: 'get', headers: { x: 'y'} });
expectType<string>(req1.method);
expectType<Record<string, string>>(req1.headers);

// check for express request compatibility
const expressReq = new express.Request({ method: 'get', query: { moo: 'foo' }, headers: { x: 'y'} });
const req2 = new Request(expressReq);
expectType<string>(req2.method);
expectType<Record<string, string>>(req2.headers);
expectType<Record<string, string>>(req2.query);

// check for compatibility with fetch api Request
// we use undici Request as a stand-in for fetch api Request
// because we still support older versions of Node.js
const undiciReq = new UndiciRequest('https://example.com', { method: 'get', headers: { x: 'y'} });
const req3 = new Request(undiciReq);
expectType<string>(req3.method);
expectType<Record<string, string>>(req3.headers);
expectType<Record<string, string>>(req3.query);

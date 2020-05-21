import { findRoute } from '../src/findRoute';

const routes = [
  {
    method: 'get',
    path: ':id',
    handler: 'get-:id',
    children: [
      {
        method: 'get',
        path: 'foos',
        handler: 'get-:id-foos',
        children: [
          {
            method: 'get',
            path: ':foo',
            handler: 'get-:id-foos-:foo',
          },
        ],
      },
      {
        method: 'post',
        path: 'foos',
        handler: 'post-:id-foos',
      },
    ],
  },
  { method: 'get', path: '.', handler: 'get-.' }, // any get on this resource only
  { method: 'post', path: '*', handler: 'post-*' },
  { method: 'patch', path: ':id', handler: 'patch-:id' },
  { method: 'put', path: ':id', handler: 'put-:id' },

  { path: '.', handler: '.' }, // catch anything on this resource only
  { path: '*', handler: '*' }, // catch anything
];

const tests = [
  ['foo', '', { handler: '.', params: {} }],
  ['foo', '/123', { handler: '*', params: {} }],
  ['foo', '/bar/123', { handler: '*', params: {} }],
  ['delete', '', { handler: '.', params: {} }],
  ['delete', '/123', { handler: '*', params: {} }],
  ['delete', '/123/456', { handler: '*', params: {} }],
  ['post', '', { handler: 'post-*', params: {} }],
  ['post', '/', { handler: 'post-*', params: {} }],
  ['post', '/123', { handler: 'post-*', params: {} }],
  ['post', '/123/456', { handler: 'post-*', params: {} }],
  ['get', '', { handler: 'get-.', params: {} }],
  ['get', '/', { handler: 'get-:id', params: { id: '' } }], // trailing / is the same as id=''
  ['get', '/123', { handler: 'get-:id', params: { id: '123' } }],
  ['get', '/123/foos', { handler: 'get-:id-foos', params: { id: '123' } }],
  [
    'get',
    '/123/foos/456',
    { handler: 'get-:id-foos-:foo', params: { id: '123', foo: '456' } },
  ],

  ['get', '/123/foos/456/bar', { handler: '*', params: {} }],
];

describe('findRoute', () => {
  tests.forEach((test) => {
    const [method, path, expected] = test;
    it(`${method} ${path}`, () => {
      const pathSegments = path.split('/').slice(1);
      const results = findRoute(method, pathSegments, routes, {});
      expect(results).toEqual(expect.objectContaining(expected));
    });
  });
});

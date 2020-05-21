import { findRoute } from '../src/findRoute';

// the sample in the readme had better work ;)
const routes = [
  {
    method: 'get',
    path: 'orders',
    handler: 'getAllOrders',
  },
  {
    method: 'post',
    path: 'orders',
    handler: 'createOrder',
  },
  {
    path: 'orders',
    children: [
      { method: 'get', path: ':orderId', handler: 'getOrder' },
      { method: 'put', path: ':orderId', handler: 'updateOrder' },
      { method: 'delete', path: ':orderId', handler: 'deleteOrder' },
      { path: ':orderId', handler: 'catchAllOrder' },
    ],
  },
  { path: '*', handler: 'notFound' },
];

const tests = [
  ['get', '/orders', { handler: 'getAllOrders', params: {} }],
  ['get', '/orders/123', { handler: 'getOrder', params: { orderId: '123' } }],
  ['post', '/orders', { handler: 'createOrder', params: {} }],
  [
    'patch',
    '/orders/123',
    { handler: 'catchAllOrder', params: { orderId: '123' } },
  ],
  [
    'put',
    '/orders/123',
    { handler: 'updateOrder', params: { orderId: '123' } },
  ],
  [
    'delete',
    '/orders/123',
    { handler: 'deleteOrder', params: { orderId: '123' } },
  ],
  ['put', '/orders', { handler: 'notFound', params: {} }],
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

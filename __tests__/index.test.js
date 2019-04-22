import { withJSONHandler } from '../src';

describe('withJSONHandler', () => {
  it('returns a function', () => {
    const spy = jest.fn();
    const fn = withJSONHandler(spy, {});
    expect(typeof fn).toBe('function');
  });

  describe('for a GET the returned function', () => {
    const event = {
      httpMethod: 'GET',
      headers: {},
      queryStringParameters: { name: 'donavon' },
      path: '/foo',
    };

    const myFn = props => props;
    const fn = withJSONHandler(myFn);

    it('when called returns a Promise', async () => {
      const result = fn(event);
      expect(result instanceof Promise).toBe(true);
    });

    it('resolves with an object containing body', async () => {
      const result = await fn(event);
      expect(result.body).toBe(JSON.stringify(event.queryStringParameters));
    });

    it('resolves with an object containing statusCode of 200', async () => {
      const result = await fn(event);
      expect(result.statusCode).toBe(200);
    });

    it('resolves with an object containing the etag header', async () => {
      const result = await fn(event);
      expect(!!result.headers.etag).toBe(true);
    });

    it('resolves with an object containing the content-type header of application/json', async () => {
      const result = await fn(event);
      expect(result.headers['content-type']).toBe('application/json');
    });

    it('resolves with an object containing statusCode of 304 if etag matches', async () => {
      const result = await fn(event);
      const headers = {
        'if-none-match': result.headers.etag,
      };
      const nextEvent = {
        ...event,
        headers,
      };
      const nextResult = await fn(nextEvent);
      expect(nextResult.statusCode).toBe(304);
    });
  });

  describe('for a GET with a config the returned function', () => {
    const event = {
      httpMethod: 'GET',
      headers: {},
      queryStringParameters: { name: 'donavon' },
      path: '/foo/bar',
    };

    const myFn = props => props;
    const fn = withJSONHandler(myFn, {
      pathToProps: 'foo/:name2/:namex',
      maxAge: 1000,
    });

    it('is passed a combined props object', async () => {
      const result = await fn(event);
      expect(JSON.parse(result.body)).toEqual({ name: 'donavon', name2: 'bar' });
    });

    it('resolves with an object containing the cache-control header', async () => {
      const result = await fn(event);
      expect(result.headers['cache-control']).toBe('max-age=1000');
    });
  });

  describe('for a POST with a config the returned function', () => {
    const event = {
      httpMethod: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      queryStringParameters: { name: 'donavon' },
      path: '/foo/bar',
      body: JSON.stringify({ name3: 'Jill' }),
    };

    const myFn = props => props;
    const fn = withJSONHandler(myFn, {
      pathToProps: 'foo/:name2',
      maxAge: 1000,
    });

    it('is passed a combined props object', async () => {
      const result = await fn(event);
      expect(result.body).toBe(JSON.stringify({ name: 'donavon', name2: 'bar', name3: 'Jill' }));
    });

    it('resolves with an object containing the cache-control header', async () => {
      const result = await fn(event);
      expect(result.headers['cache-control']).toBe(undefined);
    });
  });

  describe('when a function throws an Error', () => {
    const event = {
      httpMethod: 'GET',
      queryStringParameters: { name: 'donavon' },
      path: '/foo/bar',
    };

    const myFn = () => {
      throw new Error('test');
    };
    const fn = withJSONHandler(myFn);

    it('resolves with an object containing statusCode of 500', async () => {
      const result = await fn(event);
      expect(result.statusCode).toBe(500);
    });

    it('resolves with an object containing the content-type header of application/json', async () => {
      const result = await fn(event);
      expect(result.headers['content-type']).toBe('application/json');
    });

    it('and a body contining the error message', async () => {
      const result = await fn(event);
      expect(result.body).toBe(JSON.stringify('test'));
    });
  });

  describe('when a function throws an Object', () => {
    const event = {
      httpMethod: 'GET',
      queryStringParameters: { name: 'donavon' },
      path: '/foo/bar',
    };

    const myFn = () => {
      // eslint-disable-next-line no-throw-literal
      throw { foo: 'bar' };
    };
    const fn = withJSONHandler(myFn);

    it('resolves with the same object', async () => {
      const result = await fn(event);
      expect(result).toEqual({ foo: 'bar' });
    });
  });
});

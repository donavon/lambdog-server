import { withJSONHandler, withHandler } from '../src';

describe('withHandler', () => {
  it('returns a function', () => {
    const spy = jest.fn();
    const fn = withHandler(spy, {});
    expect(typeof fn).toBe('function');
  });

  describe('for a GET the returned function', () => {
    const event = {
      httpMethod: 'GET',
      headers: {},
      queryStringParameters: { name: 'donavon' },
      path: '/foo',
    };

    const myFn = (props) => ({
      body: props.name,
    });
    const fn = withHandler(myFn);

    it('when called returns a Promise', async () => {
      const result = fn(event);
      expect(result instanceof Promise).toBe(true);
    });

    it('resolves with an object containing body', async () => {
      const result = await fn(event);
      expect(result.body).toEqual(event.queryStringParameters.name);
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
      expect(result.headers['content-type']).toBe('text/plain');
    });

    it('resolves with an object containing a "lambdog" header', async () => {
      const result = await fn(event);
      expect(result.headers['lambdog']).not.toBe(undefined);
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
    it('resolves with an object containing statusCode of 204 if body=undefined returned', async () => {
      const myFn = (props) => ({ body: undefined });
      const fn = withHandler(myFn);
      const result = await fn(event);
      expect(result.statusCode).toBe(204);
    });
    it('resolves with an object containing statusCode of 204 if undefined returned', async () => {
      const myFn = (props) => undefined;
      const fn = withHandler(myFn);
      const result = await fn(event);
      expect(result.statusCode).toBe(204);
    });

    it('resolves with an object containing a "lambdog" header', async () => {
      const result = await fn(event);
      expect(result.headers['lambdog']).not.toBe(undefined);
    });
  });
});

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

    const myFn = (props) => props;
    const fn = withJSONHandler(myFn);

    it('when called returns a Promise', async () => {
      const result = fn(event);
      expect(result instanceof Promise).toBe(true);
    });

    it('resolves with an object containing body', async () => {
      const result = await fn(event);
      expect(JSON.parse(result.body)).toEqual(event.queryStringParameters);
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

    it('resolves with an object containing a "lambdog" header', async () => {
      const result = await fn(event);
      expect(result.headers['lambdog']).not.toBe(undefined);
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
    it('resolves with an object containing statusCode of 204 if undefined returned', async () => {
      const myFn = (props) => undefined;
      const fn = withJSONHandler(myFn);
      const result = await fn(event);
      expect(result.statusCode).toBe(204);
    });

    it('resolves with an object containing a "lambdog" header', async () => {
      const result = await fn(event);
      expect(result.headers['lambdog']).not.toBe(undefined);
    });
  });

  describe('for a GET with a config the returned function', () => {
    const event = {
      httpMethod: 'GET',
      headers: {},
      queryStringParameters: { name: 'donavon' },
      path: '/.netlify/functions/function-name/x/bar',
    };

    const myFn = (props) => props;
    const fn = withJSONHandler(myFn, {
      pathToProps: 'x/:name2/:namex',
      maxAge: 1000,
    });

    it('is passed a combined props object', async () => {
      const result = await fn(event);
      expect(JSON.parse(result.body)).toEqual({
        name: 'donavon',
        name2: 'bar',
      });
    });

    it('is passed a second argument – an object containing event, context, and params', async () => {
      const myFn = jest.fn();
      const fn = withJSONHandler(myFn, {
        pathToProps: 'x/:name/:namex',
        maxAge: 1000,
      });

      await fn(event, 'context');
      expect(myFn).toBeCalledWith(
        {
          name: 'bar',
        },
        expect.objectContaining({
          event,
          context: 'context',
          params: { name: 'bar' },
          body: '',
          query: { name: 'donavon' },
        })
      );
    });

    it('resolves with an object containing the cache-control header', async () => {
      const result = await fn(event);
      expect(result.headers['cache-control']).toBe('max-age=1000');
    });
  });

  describe('for a GET with an async function', () => {
    const event = {
      httpMethod: 'GET',
      headers: {},
      queryStringParameters: { name: 'donavon' },
      path: '/foo/bar',
    };

    const myFn = async (props) => props;
    const fn = withJSONHandler(myFn);

    it('resolves with an object containing body', async () => {
      const result = await fn(event);
      expect(JSON.parse(result.body)).toEqual(event.queryStringParameters);
    });
  });

  describe('for a POST with a config the returned function', () => {
    const event = {
      httpMethod: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      queryStringParameters: { name: 'donavon' },
      path: '/.netlify/functions/function-name/x/bar',
      body: JSON.stringify({ name: 'body', name3: 'Jill' }),
    };

    const myFn = (props) => props;
    const fn = withJSONHandler(myFn, {
      pathToProps: ':name2',
      maxAge: 1000,
    });

    it('is passed a combined props object when JSON encoded', async () => {
      const result = await fn(event);
      expect(JSON.parse(result.body)).toEqual({
        name: 'donavon',
        name2: 'x',
        name3: 'Jill',
      });
    });

    it('is passed a combined props object FORM URL encoded', async () => {
      const event = {
        httpMethod: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        queryStringParameters: { name: 'donavon' },
        path: '/.netlify/functions/function-name/bar',
        body: 'name3=Jill&name4=Bob%20Smith',
      };

      const myFn = (props) => props;
      const fn = withJSONHandler(myFn, {
        pathToProps: ':name2',
        maxAge: 1000,
      });

      const result = await fn(event);
      expect(JSON.parse(result.body)).toEqual({
        name: 'donavon',
        name2: 'bar',
        name3: 'Jill',
        name4: 'Bob Smith',
      });
    });

    it('order of precidence is path, query, body', async () => {
      const event = {
        httpMethod: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        queryStringParameters: { name: 'query' },
        path: '/.netlify/functions/function-name/path',
        body: '{"name":"body"}',
      };

      const myFn = (props) => props;
      const fn = withJSONHandler(myFn, {
        pathToProps: ':name',
      });

      const result = await fn(event);
      expect(JSON.parse(result.body)).toEqual({
        name: 'path',
      });

      const fn2 = withJSONHandler(myFn);

      const result2 = await fn2(event);
      expect(JSON.parse(result2.body)).toEqual({
        name: 'query',
      });
    });

    it('resolves with an object containing the cache-control header', async () => {
      const result = await fn(event);
      expect(result.headers['cache-control']).toBe(undefined);
    });

    it('is passed a second argument – an object containing event, context, and params', async () => {
      const myFn = jest.fn();
      const fn = withJSONHandler(myFn, {
        pathToProps: 'x/:name/:namex',
        maxAge: 1000,
      });

      await fn(event, 'context');
      expect(myFn).toBeCalledWith(
        {
          name: 'bar',
          name3: 'Jill',
        },
        expect.objectContaining({
          event,
          context: 'context',
          params: { name: 'bar' },
          body: { name: 'body', name3: 'Jill' },
          query: { name: 'donavon' },
        })
      );
    });
  });

  describe('when a function throws an Error', () => {
    // from https://stackoverflow.com/questions/48033841/test-process-env-with-jest
    const OLD_ENV = process.env;

    beforeEach(() => {
      jest.resetModules(); // this is important - it clears the cache
      process.env = { ...OLD_ENV };
      delete process.env.NODE_ENV;
    });

    afterEach(() => {
      process.env = OLD_ENV;
    });

    const event = {
      httpMethod: 'GET',
      queryStringParameters: { name: 'donavon' },
      path: '/foo/bar',
    };

    const myFn = () => {
      throw new Error('test');
    };
    const fn = withJSONHandler(myFn);

    it('resolves with an object containing statusCode of 400', async () => {
      const result = await fn(event);
      expect(result.statusCode).toBe(400);
    });

    it('resolves with an object containing the content-type header of text/plain', async () => {
      const result = await fn(event);
      expect(result.headers['content-type']).toBe('text/plain');
    });

    it('and a body contining the error stack (if not in prod)', async () => {
      process.env.NODE_ENV = 'development';
      const result = await fn(event);
      expect(result.body.startsWith('Error: test')).toBe(true);
    });

    it('and a body contining the error stack (if in prod)', async () => {
      process.env.NODE_ENV = 'production';
      const result = await fn(event);
      expect(result.body).toBe('test');
    });

    it('resolves with an object containing a "lambdog" header', async () => {
      const result = await fn(event);
      expect(result.headers['lambdog']).not.toBe(undefined);
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

    it('resolves with the same object, and defaults statusCode and body', async () => {
      const result = await fn(event);
      expect(result.foo).toBe('bar');
      expect(result.statusCode).toBe(400);
      expect(result.body).toBe('');
    });

    it('resolves with the same object, statusCode and body not overridden', async () => {
      const myFn = () => {
        // eslint-disable-next-line no-throw-literal
        throw { statusCode: 1000, body: 'foo' };
      };
      const fn = withJSONHandler(myFn);

      const result = await fn(event);
      expect(result.statusCode).toBe(1000);
      expect(result.body).toBe('foo');
    });

    it('resolves with an object containing a "lambdog" header', async () => {
      const result = await fn(event);
      expect(result.headers['lambdog']).not.toBe(undefined);
    });
  });
});

import { applyMiddleware } from '../src/applyMiddleware';

describe('applyMiddleware', () => {
  const args = {
    event: {},
  };

  it('resolves when middleware calls next()', async () => {
    const sampleMiddleware = (req, res, next) => {
      req.count = (req.count || 0) + 1;
      next();
    };
    await applyMiddleware([sampleMiddleware], args);
    expect(args.req.count).toBe(1);
  });
  it('can execute an array of middleware', async () => {
    const sampleMiddleware = (req, res, next) => {
      req.count = (req.count || 0) + 1;
      next();
    };
    await applyMiddleware([sampleMiddleware, sampleMiddleware], args);
    expect(args.req.count).toBe(2);
  });
  it('throws when middleware calls next(anything)', async () => {
    const sampleMiddleware = (req, res, next) => {
      next({});
    };
    try {
      await applyMiddleware([sampleMiddleware], args);
    } catch (ex) {
      expect(ex).toEqual(expect.objectContaining({ body: undefined }));
    }
  });
  it('throws when middleware calls next(Error)', async () => {
    const sampleMiddleware = (req, res, next) => {
      next(new Error('foo'));
    };
    try {
      await applyMiddleware([sampleMiddleware], args);
    } catch (ex) {
      expect(ex.message).toEqual(ex.body);
    }
  });
});

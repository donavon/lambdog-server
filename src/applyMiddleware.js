// import { promisify } from 'util';
const executeMiddleware = (handler, req, res) =>
  new Promise((next) => {
    handler(req, res, next);
  });

export const applyMiddleware = async (_middleware, args) => {
  const middleware = [..._middleware];

  const req = {
    method: args.event.httpMethod,
    headers: args.event.headers,
  };
  const res = undefined; // TODO emulate status and append mostly

  for (let index = 0; index < middleware.length; index++) {
    const handler = middleware[index];
    // const executeMiddleware = promisify(handler);

    // const nextArg = await executeMiddleware(req, res);
    const nextArg = await executeMiddleware(handler, req, res);
    if (nextArg === 'route') {
      break;
    }
    if (nextArg) {
      nextArg.body = nextArg.message; // works if err is an object or instanceof Error
      throw nextArg;
    }
  }
  args.req = req;
};

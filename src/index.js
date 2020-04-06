import crypto from 'crypto';

const applicationJson = 'application/json';
const applicationUrl = 'application/x-www-form-urlencoded';
const contentType = 'content-type';

// use this if/when Object.fromEntries is supported in Netlify
// const decode = (encode) => {
//   const url = new URL(`http://example.com?${encode}`);
//   return Object.fromEntries([...url.searchParams.entries()]);
// };

const decode = (encode) => {
  const obj = {};
  const url = new URL(`?${encode}`, 'http://example.com/'); // requires a value base URL
  [...url.searchParams.entries()].forEach(([key, val]) => {
    obj[key] = val;
  });
  return obj;
};

const defaultErrorCallback = (error) => ({
  statusCode: 500,
  headers: {
    [contentType]: applicationJson,
  },
  body: JSON.stringify(error.message),
});

const mapPathToProps = (pathToProps, path) => {
  const pathSegments = path.substr(1).split('/').slice(3); // skip .netlify/functions/{function-name}
  const mapSegments = pathToProps.split('/');
  const result = {};
  mapSegments.forEach((segment, i) => {
    if (segment.startsWith(':')) {
      const key = segment.substr(1);
      const value = pathSegments[i];
      if (value !== undefined) {
        result[key] = decodeURIComponent(value);
      }
    }
  });
  return result;
};

const withJSONHandler = (
  fn,
  { pathToProps, errorCallback = defaultErrorCallback, maxAge = -1 } = {}
) => async (event) => {
  const { httpMethod, headers = {}, queryStringParameters, path } = event;

  try {
    const bodyProps =
      // eslint-disable-next-line no-nested-ternary
      httpMethod === 'POST' && headers[contentType] === applicationJson
        ? JSON.parse(event.body)
        : headers[contentType] === applicationUrl
        ? decode(event.body)
        : {};
    const pathProps = pathToProps ? mapPathToProps(pathToProps, path) : {};
    const props = {
      ...queryStringParameters,
      ...pathProps,
      ...bodyProps,
    };
    const result = await fn(props, event);

    if (result === undefined) {
      return {
        statusCode: 204, // No Content
      };
    }

    const body = JSON.stringify(result);
    const hash = crypto.createHash('md5').update(body).digest('base64');
    const etag = `"${hash}"`;
    const ifNoneMatch = headers['if-none-match'];
    const isMatch = ifNoneMatch === etag;

    return isMatch
      ? {
          statusCode: 304,
        }
      : {
          statusCode: 200,
          body,
          headers: {
            [contentType]: applicationJson,
            ...(httpMethod !== 'POST' &&
              maxAge !== -1 && { 'cache-control': `max-age=${maxAge}` }),
            ...(httpMethod !== 'POST' && { etag }),
          },
        };
  } catch (ex) {
    return ex instanceof Error ? errorCallback(ex) : ex;
  }
};

export { withJSONHandler };

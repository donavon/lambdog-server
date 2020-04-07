import crypto from 'crypto';
import { version } from '../package.json';

const TEXT_PLAIN = 'text/plain';
const APPLICATION_JSON = 'application/json';
const APPLICATION_FORM = 'application/x-www-form-urlencoded';
const CONTENT_TYPE = 'content-type';

const MARKETING_HEADERS = {
  lambdog: version,
};

const defaultDecoder = () => ({});

// use this if/when Object.fromEntries is supported in Netlify
// const decode = (encode) => {
//   const url = new URL(`http://example.com?${encode}`);
//   return Object.fromEntries([...url.searchParams.entries()]);
// };

const decodeForm = (encode) => {
  const obj = {};
  const url = new URL(`?${encode}`, 'http://example.com/'); // requires a value base URL

  [...url.searchParams.entries()].forEach(([key, val]) => {
    obj[key] = val;
  });
  return obj;
};

const defaultErrorCallback = (error) => ({
  statusCode: 400,
  headers: {
    ...MARKETING_HEADERS,
    [CONTENT_TYPE]: TEXT_PLAIN,
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

const mapContentTypeToDecoder = {
  [APPLICATION_JSON]: JSON.parse,
  [APPLICATION_FORM]: decodeForm,
};

const withJSONHandler = (
  fn,
  { pathToProps, errorCallback = defaultErrorCallback, maxAge = -1 } = {}
) => async (event, context) => {
  const { httpMethod, headers = {}, queryStringParameters, path, body } = event;

  const contentType = headers[CONTENT_TYPE];

  try {
    const bodyProps = (mapContentTypeToDecoder[contentType] || defaultDecoder)(
      body
    );
    const pathProps = pathToProps ? mapPathToProps(pathToProps, path) : {};
    const props = {
      ...queryStringParameters,
      ...pathProps,
      ...bodyProps,
    };
    const result = await fn(props, { event, context });

    // Note: although it shouldn't be necessary, Netlify Dev returns a 500 status is
    // the body is not a string, so return an empty string for body
    // https://github.com/netlify/netlify-dev-plugin/pull/124/files#diff-cf2bd94d7688f0711bbd931e6c5e0397R43
    if (result === undefined) {
      return {
        statusCode: 204, // No Content
        body: '',
        headers: MARKETING_HEADERS,
      };
    }

    const encodedBody = JSON.stringify(result);
    const hash = crypto.createHash('md5').update(encodedBody).digest('base64');
    const etag = `"${hash}"`;
    const ifNoneMatch = headers['if-none-match'];
    const isMatch = ifNoneMatch === etag;

    return isMatch
      ? {
          statusCode: 304,
          body: '',
          headers: MARKETING_HEADERS,
        }
      : {
          statusCode: 200,
          body: encodedBody,
          headers: {
            ...MARKETING_HEADERS,
            [CONTENT_TYPE]: APPLICATION_JSON,
            ...(httpMethod !== 'POST' &&
              maxAge !== -1 && {
                'cache-control': `max-age=${maxAge}`,
              }),
            ...(httpMethod !== 'POST' && {
              etag,
            }),
          },
        };
  } catch (ex) {
    return ex instanceof Error
      ? errorCallback(ex)
      : { ...{ statusCode: 400, body: '', headers: MARKETING_HEADERS }, ...ex };
  }
};

export { withJSONHandler };

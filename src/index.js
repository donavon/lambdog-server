import crypto from 'crypto';
import { version } from '../package.json';
import { findRoute } from './findRoute';

const TEXT_PLAIN = 'text/plain';
const APPLICATION_JSON = 'application/json';
const APPLICATION_FORM = 'application/x-www-form-urlencoded';
const CONTENT_TYPE = 'content-type';

const MARKETING_HEADERS = {
  lambdog: version,
};

const defaultDecoder = (body) => body;

const decodeForm = (encode) => {
  const url = new URL(`http://example.com?${encode}`);
  return Object.fromEntries([...url.searchParams.entries()]);
};

const defaultErrorCallback = (error) => ({
  statusCode: 400,
  headers: {
    ...MARKETING_HEADERS,
    [CONTENT_TYPE]: TEXT_PLAIN,
  },
  body: process.env.NODE_ENV === 'production' ? error.message : error.stack,
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

// TODO re-think this
const stripPrefix = (pathPrefix, path) => {
  if (pathPrefix instanceof RegExp) {
    const parts = pathPrefix.exec();
    if (path) {
      return parts[1];
    }
  }
  if (typeof pathPrefix === 'string' && path.startsWith(pathPrefix)) {
    return path.substr(pathPrefix.length);
  }
  if (typeof pathPrefix === 'function') {
    return pathPrefix(path);
  }
  throw {
    statusCode: 500,
    body: 'invalid config.pathPrefix',
  };
};

export const withHandler = (
  routes,
  {
    pathToProps,
    pathPrefix = /\/\.netlify\/functions\/?.*?\/(.*)/,
    errorCallback = defaultErrorCallback,
    maxAge = -1,
    contentEncoder = (c) => c || {},
    contentType: responseContentType = 'text/plain',
  } = {}
) => async (event, context) => {
  const { httpMethod, headers = {}, queryStringParameters, path, body } = event;
  const contentType = headers[CONTENT_TYPE];

  // TODO name things much?
  const getFn = () => {
    if (typeof routes === 'function') {
      const params = pathToProps ? mapPathToProps(pathToProps, path) : {};
      return {
        handler: routes,
        params,
      };
    }

    const pathSegments = stripPrefix(pathPrefix, path).split('/').slice(1);
    const routeInfo = findRoute(
      httpMethod.toLowerCase(),
      pathSegments,
      routes,
      {}
    );
    if (routeInfo) {
      return routeInfo;
    }
    throw {
      statusCode: 405,
      'content-type': 'text/plain',
      body: 'method not allowed on this resource or route not found',
    };
  };

  try {
    const bodyProps = body
      ? (mapContentTypeToDecoder[contentType] || defaultDecoder)(body)
      : '';

    const { handler, route, params } = getFn();

    const props = {
      ...bodyProps,
      ...queryStringParameters,
      ...params, // path props MUST come last so that PUT/PATCH favor /resource/:id
    };

    const resultMaybe = await handler(props, {
      event,
      context,
      route,
      params,
      body: bodyProps,
      query: queryStringParameters,
    });

    const {
      body: encodedBody,
      // if returned status, use that
      // else default to either 200 (if body) or 204
      statusCode: responseStatusCode = encodedBody ? 200 : 204,
      headers: responseHeaders = {},
      isBase64Encoded = false,
    } = contentEncoder(resultMaybe);

    // don't 204 if handler returned a status.
    // ex: could have returned a 301 with a lcoation header and no body
    if (encodedBody === undefined) {
      return {
        statusCode: responseStatusCode, // No Content or returned value (301?)
        body: '',
        headers: { ...MARKETING_HEADERS, ...responseHeaders },
      };
    }

    const hash = crypto.createHash('md5').update(encodedBody).digest('base64');
    const etag = `"${hash}"`;
    const ifNoneMatch = headers['if-none-match'];
    const isMatch = ifNoneMatch === etag;

    return isMatch
      ? {
          statusCode: 304,
          body: '',
          headers: { ...MARKETING_HEADERS, ...responseHeaders },
        }
      : {
          statusCode: responseStatusCode,
          body: encodedBody,
          isBase64Encoded,
          headers: {
            ...MARKETING_HEADERS,
            [CONTENT_TYPE]: responseContentType,
            ...responseHeaders, // below so handler can override content-type
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
    const { headers: exHeaders, ...exRest } = ex;
    return ex instanceof Error
      ? errorCallback(ex)
      : {
          ...{
            statusCode: 400,
            body: '',
            headers: {
              ...MARKETING_HEADERS,
              [CONTENT_TYPE]: TEXT_PLAIN,
              ...exHeaders,
            },
          },
          ...exRest,
        };
  }
};

export const withJSONHandler = (routes, config = {}) =>
  withHandler(routes, {
    ...config,
    contentEncoder: (body) => ({
      body: body && JSON.stringify(body),
      headers: {},
    }),
    contentType: APPLICATION_JSON,
  });

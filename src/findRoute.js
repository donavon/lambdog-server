export const findRoute = (httpMethod, pathSegments, routes, _params) => {
  const params = { ..._params };

  for (let index = 0; index < routes.length; index++) {
    const route = routes[index];
    const { method = httpMethod, path, handler, children } = route;
    const [segment] = pathSegments;
    const isLastSegment = segment === undefined;
    const segmentMatch =
      path === '*' ||
      (path === '.' && isLastSegment) ||
      path.startsWith(':') ||
      path === segment;

    // if method and path segment match the route, then return handler
    if (segmentMatch) {
      // set parms
      if (pathSegments.length && path.startsWith(':')) {
        const key = path.substr(1);
        const value = segment;
        params[key] = decodeURIComponent(value);
      }

      if (handler && method === httpMethod) {
        if (path === '*' || path === '.') {
          return { handler, route, params: _params }; // note: using original parms
        }
        if (pathSegments.length === 1) {
          return { handler, route, params };
        }
      }

      if (children) {
        const childRouteInfo = findRoute(
          httpMethod,
          pathSegments.slice(1),
          children,
          params
        );
        if (childRouteInfo) {
          return childRouteInfo;
        }
      }
    }
  }
};

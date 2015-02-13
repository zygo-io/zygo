import pattern from 'url-pattern';

//Represents a redirect in a handler.
export class RouteRedirect extends Error {
  constructor(redirect) {
    this.redirect = redirect;
  }
}

//Returns an ordered list (by most to least general) of route objects matched by the path.
//The routes list returned contains flattened routes, so no huge trees being passed.
//If nothing matches, we return null.
export function match(path, routes) {
  //Get all matches.
  let result = [];
  _match(path, '', routes);

  //push their default on
  if (routes.default) {
    result.push({
      _isDefault: true,
      options: {},
      routes: routes.default
    });
  }

  //zygo default route
  result.push({
    options: {},
    routes: [{ component: "zygo/lib/default-component.jsx!" }]
  });

  return result;

  //Recursion helper for match.
  //Returns null, or an array of routes currently matched in reverse order.
  function _match(path, curPattern, curRoute, curParams=[]) {
    //Extract child routes and other params.
    let childRoutes = {};
    let otherParams = {
      _path: curPattern
    };

    //Child routes are properties starting with '/'. Else they are treated as other.
    Object.keys(curRoute).map((key) => {
      if (key[0] === '/') childRoutes[key] = curRoute[key];
      else otherParams[key] = curRoute[key];
    });

    //Check direct match, to see if we are done.
    let match = pattern.newPattern(curPattern || '/').match(path);
    if (match !== null) {
      curParams.push(otherParams);

      return result.push({
        options: match,
        routes: curParams
      });
    }

    //Check the path partial matches current pattern, if so recurse on children.
    if (pattern.newPattern(curPattern + '(.*)').match(path)) {
      curParams.push(otherParams);

      Object.keys(childRoutes).map((key) => {
        childRoutes[key].map((route) => {
          _match(path, curPattern + key, route, curParams.slice());
        });
      });
    }
  }
}


//Given a list of routes, runs the handlers for each route, propagating a
// request 'global' context object. Returns the context object.
export function runHandlers(routes, context={}) {
  return routes.reduce((chain, route) => {
    return chain
      .then(() => getHandler(route))
      .then((module) => module ? module.default(context) : null)
      .then((result) => {
        if (result === false) throw new RouteRedirect(false);
        if (result && result.redirect) throw new RouteRedirect(result.redirect);
        if (result && result.status) throw new RouteRedirect(result);
      });
  }, Promise.resolve())
    .then(() => routes);
}

//Gets the handler module for a given route object or null.
//Handlers are specified in the route component. They may not exist necessarily.
export function getHandler(route) {
  if (!route.component) return Promise.resolve();

  return System.import(route.component)
  .then((module) => {
    return Promise.resolve()
    .then(() => {
      //try if there is a clientHandler specified
      if (module.default.clientHandler) return normalizeAndImport(module.default.clientHandler);
      return null;
    })
    .then((handler) => {
      //if not, fallback onto the handler
      if (handler) return handler;
      if (module.default.handler) return normalizeAndImport(module.default.handler);
      return null;
    });
  });

  function normalizeAndImport(handler) {
    //Check if the handler is defined inline. IF so, just return it wrapped as a module.
    if (typeof handler === "function") return {
      default: handler
    };

    //Else we need to import it
    return System.normalize(handler, route.component)
      .then((normalized) => System.import(normalized));
  }
}

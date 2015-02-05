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
  let result = _match(path, '', routes);
  if (!result) return null;

  //Extract the options from the route matches.
  //Also reverse the matched list, as we want most general match to come first.
  let options = result[0].options;
  delete result[0].options;
  return {
    options: options,
    routes: result.reverse()
  };
}

//Recursion helper for match.
//Returns null, or an array of routes currently matched in reverse order.
function _match(path, curPattern, curRoute) {
  //Extract child routes and other params.
  let childRoutes = {};
  let otherParams = {
    _path: curPattern
  };
  Object.keys(curRoute).map((key) => {
    if (key[0] === '/') childRoutes[key] = curRoute[key];
    else otherParams[key] = curRoute[key];
  });

  //Check direct match, to see if we are done.
  let match = pattern.newPattern(curPattern || '/').match(path);
  if (match !== null) {
    //Set match options, for instance /hello/(:id) the id.
    //We only set it on the deepest match, then pass it through to zygo in match().
    otherParams.options = match;
    return [otherParams];
  }

  //Check the path partial matches current pattern, if so recurse on children.
  if (pattern.newPattern(curPattern + '(.*)').match(path)) {
    Object.keys(childRoutes).map((key) => {
      let result = _match(path, curPattern + key, childRoutes[key]);
      if (result) {
        result.push(otherParams);
        match = result;
      }
    });
  }

  //Return what we have, possibly null.
  return match;
}

//Given a list of routes, runs the handlers for each route, propagating a
// request 'global' context object. Returns the context object.
export function runHandlers(routes, context={}) {
  return routes.reduce((chain, route) => {
    return chain
      .then(() => getHandler(route))
      .then((module) => module ? module.handler(context) : null)
      .then((result) => {
        if (result && result.redirect) throw new RouteRedirect(result.redirect);
      });
  }, Promise.resolve())
    .then(() => routes);
}

//Gets the handler module for a given route object or null.
//Handlers are specified in the route component. They may not exist necessarily.
export function getHandler(route) {
  if (!route.component) return null;

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
    return System.normalize(handler, route.component)
      .then((normalized) => System.import(normalized));
  }
}

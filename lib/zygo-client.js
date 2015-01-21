import React from 'react';
import urlPattern from 'url-pattern';

export let state;
export let routes;
export let bundles;
export let currentPath;

//Represents a handler aborted in the middle of a transition.
class TransitionAborted extends Error {}

//Represents a redirect in a handler.
class RouteRedirect extends Error {
  constructior(redirect) {
    this.redirect = redirect;
  }
}

export function route(path, headers={}) {
  return _getRouteObject(path, headers)
    .then(_renderLoadingRoute)
    .then(_setMetadata)
    .catch((error) => {
      //We rethrow errors if they aren't Zygo-internal, as the user
      // might be expecting to catch them somewhere.
      if (error instanceof TransitionAborted) return;
      if (error instanceof RouteRedirect) return route(error.redirect, headers);
      throw error;
  });
}

//Takes current component and rerenders it with current state.
export function refresh(route=state.route) {
  return renderComponent(route.component, route.meta.title);
}

export function renderComponent(component, title=undefined) {
  return System.import(component).then(function(componentModule) {
    let container = document.getElementById('__zygo-body-container__');
    let element = React.createElement(componentModule.default, state);

    React.render(element, container);

    //There can only be one title tag by the HTML5 standard,
    // so this is an acceptable solution.
    var titleTag = document.getElementsByTagName('title');
    if (titleTag[0]) titleTag[0].innerHTML = title;
  });
}

//Sets the routes object as if the given request occured
export function pushState(path, headers={}) {
  return _getRouteObject(path,  headers).then(_setMetadata);
}

//render given route if the route path has not changed
function _renderLoadingRoute(loadingRoute) {
  return new Promise((resolve, reject) => {
    //Early out if another transition has taken priority
    if (currentPath !== loadingRoute.path) return reject(new TransitionAborted());

    refresh(loadingRoute).then(function() {
      resolve(loadingRoute);
    });
  });
}

//matches a given route and returns route object
// throws an exception if no route is matched
//runs the route handlers
function _getRouteObject(path, headers={}) {
  let loadingRoute = _matchRoute(path);
  loadingRoute.headers = headers;

  if (bundles) {
    return _configureBundles(path)
      .then(() => _runHandler(loadingRoute));
  }

  return _runHandler(loadingRoute);
}

//Does exactly what the name says.
function _matchRoute(path) {
  for (let routeString in routes) {
    let  pattern = urlPattern.newPattern(routeString);
    let match = pattern.match(path);

    if (match) return _handleMatch(routeString);
  }

  if (routes.default) return _handleMatch(routeString);
  throw new Error("No match found for " + path);

  function _handleMatch(routeString) {
    let handler = routes[routeString];

    //The path we are transitioning to.
    currentPath = path;

    return {
      //returned by handler, hence we get these later
      meta: undefined,
      component: undefined,

      //already know these
      path: path,
      handler: handler,
      options: match,
      headers: undefined,
      method: 'GET'
    };
  }
}

function _runHandler(route) {
  return Promise.resolve()
    .then(() => {
      if (typeof route.handler === "object")
        return route.handler;
      return System.import(route.handler);
    })
    .then((handlerModule) => {
      route.component = handlerModule.component;

      if (handlerModule.handler)
        return handlerModule.handler(state, route);
      return {};
    })
    .then((meta) => {
      if (meta.redirect) throw new RouteRedirect(meta.redirect);
      route.meta = meta;
    })
    .then(() => route);
}

//Swap loading route into state.route and set HTML5 history if available.
function _setMetadata(loadingRoute) {
  return new Promise((resolve, reject) => {
    //If transition has changed, don't swap this route in.
    if (currentPath !== loadingRoute.path) return reject(new TransitionAborted());

    //Finished loading route, swap it into current state.
    state.route = loadingRoute;

    //Push current state to history - according to mozilla specs,
    // second argument is currently unused.
    if (typeof history !== 'undefined' && history.pushState) {
      history.pushState(state, "", loadingRoute.path);
    }

    resolve();
  });
}

//Given a route, configures the System.js loader to load route's bundles
//TODO: maybe not so robust a solution if they use other bundles too.
function _configureBundles(route) {
  if (!bundles) throw new Error("configureBundles called without bundles defined.");

  return Promise.resolve().then(() => {
    System.bundles = {};
    Object.keys(bundles).map((key) => {
      if (bundles[key].routes.indexOf(route) !== -1)
        System.bundles[key] = bundles[key].modules;
    });
  });
}

export function _setInitialState(_state) {
  state = _state;
}

export function _setRoutes(_routes) {
  routes = _routes;
}

export function _setBundles(_bundles) {
  bundles = _bundles;
}

//adds hooks to link-clicks if they match a route
export function _addLinkHandlers() {
  if (typeof document === 'undefined') return;

  let zygoBody = document.getElementById('__zygo-body-container__');
  if (zygoBody.addEventListener)
    zygoBody.addEventListener('click', _zygoListener, true);

  function _zygoListener(event) {
    if (event.target.localName === 'a') {
      //TODO IE 8 not supported here currently
      if (event.preventDefault && event.stopPropagation) {
        //determining whether to 404 here is actually quite tricky.
        // we need to grab state.route.path, subtract from location
        let baseHref = location.href.substr(0, location.href.length - state.route.path.length);
        let basePath = location.href.substr(-state.route.path.length);

        //Someone's tampered with the url
        if (basePath !== state.route.path)
          throw new Error("Error: url path does not match current route path.");

        //Check if href matches our baseHref, if so we either 404 or switch routes
        if (event.target.href.match(baseHref)) {
          event.preventDefault();
          event.stopPropagation();

          var hrefRoute = event.target.href.substr(baseHref.length);
          route(hrefRoute);
        }
      }
    }
  }
}

//A tiny event-emitter subset implementation for the client.
let pubSub = new Map();

export function on(event, callback) {
  if (!pubSub.has(event)) pubSub.set(event, []);
  pubSub.get(event).push(callback);
}

export function _emit(event, args) {
  if (!(args instanceof Array)) args = [args];

  if (pubSub.has(event)) {
    pubSub.get(event).map((callback) => callback.apply(callback, args));
  }
}

//Define window popstate event. We want this to be consistent with our routing.
if (typeof history !== 'undefined' && typeof window !== 'undefined') {
  window.onpopstate = function(event) {
    state = event.state;
    refresh();
  };
}

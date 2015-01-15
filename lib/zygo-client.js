import React from 'react';
import urlPattern from 'url-pattern';

export let state;
export let routes;
export let currentPath;

//Represents a handler chain aborted in the middle of a transition.
class TransitionAborted extends Error {}

// TODO: keeping options as an object is not good. we need to parse them out
export function route(path, headers={}) {
  return _getRouteObject(path, headers)
    .then(_renderLoadingRoute)
    .then(_setMetadata)
    .catch((error) => {
      //We rethrow errors if they aren't Zygo-internal, as the user
      // might be expecting to catch them somewhere.
      if (error instanceof TransitionAborted) return;
      throw error;
  });
}

//Takes current component and rerenders it with current state.
export function refresh(route=state.route) {
  return renderComponent(route.component, route.title);
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

  return _runHandlers(loadingRoute).then(function(result) {
    loadingRoute.title = result.title;
    loadingRoute.component = result.component;

    return loadingRoute;
  });
}

//Does exactly what the name says.
function _matchRoute(path) {
  for (let routeString in routes) {
    let  pattern = urlPattern.newPattern(routeString);
    let match = pattern.match(path);

    if (match) {
      let handlers = routes[routeString];
      if (!(handlers instanceof Array)) handlers = [handlers];

      //The path we are transitioning to.
      currentPath = path;

      return {
        //returned by handlers, hence we get these later
        title: undefined,
        component: undefined,

        //already know these
        path: path,
        handlers: handlers,
        options: match,
        headers: undefined,//headers,
        method: 'GET'
      };
    }
  }

  //TODO: should actually just 404
  throw new Error("No matching client-side route for " + path);
}

function _runHandlers(loadingRoute) {
  return loadingRoute.handlers.reduce(function(handlerChain, nextHandler) {
    return handlerChain.then(function(result) {
      return new Promise((resolve, reject) => {
        //Handler redirected, rerun with new route.
        if (result && result.redirect) return resolve(route(result.redirect));

        //Handler returned a component to be rendered, we are go.
        if (result && result.component) return resolve(result);

        //If another transition has occured and this one is no longer valid,
        // we early out to avoid rendering conflicts and other issues.
        if (currentPath !== loadingRoute.path) return reject(new TransitionAborted());

        //TODO don't like this whole force default business
        return resolve(System.import(nextHandler).then(function(handlerModule) {
          return handlerModule.default(state, loadingRoute);
        }));
      });
    });
  }, Promise.resolve());
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

export function _setInitialState(_state) {
  state = _state;
}

export function _setRoutes(_routes) {
  routes = _routes;
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

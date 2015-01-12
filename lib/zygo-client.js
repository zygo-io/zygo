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
  for (let routeString in routes) {
    let  pattern = urlPattern.newPattern(routeString);
    let match = pattern.match(path);

    if (match) {
      let handlers = routes[routeString];
      if (!(handlers instanceof Array)) handlers = [handlers];

      //The path we are transitioning to.
      currentPath = path;

      let loadingRoute = {
        //returned by handlers, hence we get these later
        title: undefined,
        component: undefined,

        //already know these
        path: path,
        handlers: handlers,
        options: match,
        headers: headers,
        method: 'GET'
      };

      return _runHandlers(loadingRoute).then(function(result) {
        loadingRoute.title = result.title;
        loadingRoute.component = result.component;

        return loadingRoute;
      });
    }
  }

  //No match!
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
    if (history && history.pushState) {
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
if (history && window && window.onpopstate) {
  window.onpopstate = function(event) {
    state = event.state;
    refresh();
  };
}

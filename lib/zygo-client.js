import React from 'react';
import urlPattern from 'url-pattern';
import * as Render from './render';
import * as Routes from './routes';

export let currentRoutes;
export let context;
export let routes;
export let bundles;
export let currentPath;

//Represents a handler aborted in the middle of a transition.
class TransitionAborted extends Error {}

export function route(path, headers={}) {
  let match = Routes.match(path, routes);
  if (!match) throw new Error("No match found for path: " + path);

  context.loadRoute = {
    path: path,
    headers: headers,
    method: "GET"
  };

  //Flatten options directly onto loadRoute object.
  Object.keys(match.options).map((key) => {
    //Reserved words
    if (key == 'path' || key == 'routes' || key == 'headers' || key == 'method')
      throw new Error("Invalid option id in route path: :" + key);

    context.loadRoute[key] = match.options[key];
  });

  //So we can abort the handler chain if necessary.
  currentPath = path;

  setVisibleBundles(match.routes);
  return Routes.runHandlers(match.routes, context)
    .then(abortOnTransition)
    .then(() => {
      //Finished loading route, swap it into curr
      if (context.loadRoute) {
        context.curRoute = context.loadRoute;
        context.loadRoute = undefined;
      }
    })
    .then(() => Render.renderRoutes(match.routes, context))
    .then(setMetadata)
    .then(() => currentRoutes = match.routes)
    .catch((error) => {
      //We rethrow errors if they aren't Zygo-internal, as the user
      // might be expecting to catch them somewhere.
      if (error instanceof TransitionAborted) return;
      if (error instanceof Routes.RouteRedirect) return route(error.redirect, headers);
      throw error;
  });
}

//Takes current routes and rerenders with current context.
export function refresh(routes = currentRoutes) {
  return Render.renderRoutes(routes, context);
}

//Swap loading route into state.route and set HTML5 history if available.
export function setMetadata() {
  return new Promise((resolve, reject) => {
    //Push current state to history - according to mozilla specs,
    // second argument is currently unused.
    if (typeof history !== 'undefined' && history.pushState) {
      history.pushState(context, "", context.curRoute.path);
    }

    resolve();
  });
}

//Set bundles visible to given routes
export function setVisibleBundles(routes) {
  if (!bundles) return;

  System.bundles = [];
  Object.keys(bundles).map((key) => {
    let sharedRoutes =
      routes.filter((route) => bundles[key].routes.indexOf(route._path) !== -1);

    if (sharedRoutes.length > 0)
      System.bundles[key] = bundles[key].modules;
  });
}

//Check if the curent transition is still valid, if so continue.
function abortOnTransition() {
  return Promise.resolve()
    .then(() => {
      if (!context.loadRoute || currentPath !== context.loadRoute.path)
        throw new TransitionAborted();
    });
}

export function _setCurrentRoutes(_currentRoutes) {
  currentRoutes = _currentRoutes;
}

export function _setContext(_context) {
  context = _context;
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

  let zygoBody = document.getElementById('__zygo-container__');
  if (zygoBody.addEventListener)
    zygoBody.addEventListener('click', _zygoListener, false);

  function _zygoListener(event) {
    var anchor = getWrappedAnchor(event.target);

    if (anchor) {
      //TODO IE 8 not supported here currently
      if (event.preventDefault && event.stopPropagation) {
        //determining whether to 404 here is actually quite tricky.
        // we need to grab state.route.path, subtract from location
        let baseHref = location.href.substr(0, location.href.length - context.curRoute.path.length);
        let basePath = location.href.substr(-context.curRoute.path.length);

        //Someone's tampered with the url
        if (basePath !== context.curRoute.path)
          throw new Error("Error: url path does not match current route path.");

        //Check if href matches our baseHref, if so we either 404 or switch routes
        if (anchor.href.match(baseHref)) {
          event.preventDefault();
          event.stopPropagation();

          var hrefRoute = anchor.href.substr(baseHref.length);
          route(hrefRoute);
        }
      }
    }
  }

  function getWrappedAnchor(node) {
    if (node.localName === 'a') return node;
    if (node.parentNode) return getWrappedAnchor(node.parentNode);
    return null;
  }
}

//Run through routes, deserializing context where necessary
export function _deserializeContext(route=routes) {
  return Promise.resolve()
    .then(() => Routes.getHandler(route))
    .then((handler) => handler && handler.deserialize ? handler.deserialize(context) : null)
    .then(() =>
      Promise.all(
        Object.keys(route).map((key) =>
          (key[0] === '/') ? _deserializeContext(route[key], context) : null
        )
      )
    );
}

//Define window popstate event. We want this to be consistent with our routing.
if (typeof history !== 'undefined' && typeof window !== 'undefined') {
  window.onpopstate = function(event) {
    if (!event.state) return;
    context = event.state;
    refresh();
  };
}

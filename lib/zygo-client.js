import React from 'react';
import urlPattern from 'url-pattern';
import * as Render from './render';
import * as Routes from './routes';

export let context;
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
  let match = Routes.match(path, routes);
  if (!match) throw new Error("No match found for path: " + path);

  //TODO: some kind of current/next route thing as before
  context.loadingRequest = {
    path: path,
    headers: headers,
    method: "GET",
    options: match.option,
    routes: match.routes
  };

  //So we can abort the handler chain if necessary.
  currentPath = path;

  return Routes.runHandlers(match.routes, context)
    .then(() => Render.renderRoutes(match.routes, context))
    .then(_setMetadata)
    .catch((error) => {
      //We rethrow errors if they aren't Zygo-internal, as the user
      // might be expecting to catch them somewhere.
      if (error instanceof TransitionAborted) return;
      if (error instanceof RouteRedirect) return route(error.redirect, headers);
      throw error;
  });
}

//Takes current routes and rerenders with current context.
export function refresh() {
  return Render.renderRoutes(context.currentRequest.routes, context);
}

//Swap loading route into state.route and set HTML5 history if available.
function _setMetadata() {
  return new Promise((resolve, reject) => {
    //If transition has changed, don't swap this route in.
    if (currentPath !== context.loadingRequest.path) return reject(new TransitionAborted());

    //Finished loading route, swap it into current state.
    context.currentRequest = context.loadingRequest;
    delete context.loadingRequest;

    //Set title
    document.getElementsByTagName('title')[0].innerHTML = context.meta.title;

    //Push current state to history - according to mozilla specs,
    // second argument is currently unused.
    if (typeof history !== 'undefined' && history.pushState) {
      history.pushState(context, "", context.currentRequest.path);
    }

    resolve();
  });
}

//Given a route, configures the System.js loader to load route's bundles
//TODO: maybe not so robust a solution if they use other bundles too.
export function _configureBundles(route) {
  if (!bundles) throw new Error("configureBundles called without bundles defined.");

  System.bundles = {};
  Object.keys(bundles).map((key) => {
    if (bundles[key].routes.indexOf(route) !== -1)
      System.bundles[key] = bundles[key].modules;
  });
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

  let zygoBody = document.getElementById('__zygo-body-container__');
  if (zygoBody.addEventListener)
    zygoBody.addEventListener('click', _zygoListener, true);

  function _zygoListener(event) {
    if (event.target.localName === 'a') {
      //TODO IE 8 not supported here currently
      if (event.preventDefault && event.stopPropagation) {
        //determining whether to 404 here is actually quite tricky.
        // we need to grab state.route.path, subtract from location
        let baseHref = location.href.substr(0, location.href.length - context.currentRequest.path.length);
        let basePath = location.href.substr(-context.currentRequest.path.length);

        //Someone's tampered with the url
        if (basePath !== context.currentRequest.path)
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

//Run through routes, deserializing context where necessary
export function _deserializeContext(route=routes) {
  return Promise.resolve()
    .then(() => route.handler ? System.import(route.handler) : null)
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
    context = event.state;
    refresh();
  };
}

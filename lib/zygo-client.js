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

  context.loadingRequest = {
    path: path,
    headers: headers,
    method: "GET",
    options: match.options,
    routes: match.routes
  };

  //So we can abort the handler chain if necessary.
  currentPath = path;

  setVisibleBundles(match.routes);
  return Routes.runHandlers(match.routes, context)
    .then(abortOnTransition)
    .then(() => Render.renderRoutes(match.routes, context))
    .then(abortOnTransition)
    .then(setMetadata)
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
  //Enforce guarantee that context.loadingRoute contains the route being rendered, then render.
  context.loadingRequest = context.currentRequest;
  return Render.renderRoutes(context.currentRequest.routes, context);
}

//Swap loading route into state.route and set HTML5 history if available.
function setMetadata() {
  return new Promise((resolve, reject) => {
    //Finished loading route, swap it into current state.
    context.currentRequest = context.loadingRequest;
    delete context.loadingRequest;

    //Only 1 title tag in doc allowed by the html standard, so this is fine.
    let titleTag = document.getElementsByTagName('title')[0];
    if (titleTag) titleTag.innerHTML = context.meta.title;

    //Push current state to history - according to mozilla specs,
    // second argument is currently unused.
    if (typeof history !== 'undefined' && history.pushState) {
      history.pushState(context, "", context.currentRequest.path);
    }

    resolve();
  });
}

//Set bundles visible to given routes
function setVisibleBundles(routes) {
  if (!bundles) return;

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
      if (!context.loadingRequest || currentPath !== context.loadingRequest.path)
        throw new TransitionAborted();
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
    zygoBody.addEventListener('click', _zygoListener, false);

  function _zygoListener(event) {
    var anchor = getWrappedAnchor(event.target);

    if (anchor) {
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

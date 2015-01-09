import React from 'react';
import urlPattern from 'url-pattern';

export let state;
export let routes;

// TODO: keeping options as an object is not good. we need to parse them out
export function route(path, headers={}) {
  for (let routeString in routes) {
    let  pattern = urlPattern.newPattern(routeString);
    let match = pattern.match(path);

    if (match) {
      let handlers = routes[routeString];
      if (!(handlers instanceof Array)) handlers = [handlers];

      state.loadingRoute = {
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

      return _renderRoute();
    }
  }

  //No match!
  throw new Error("No matching client-side route for " + path);
}

//Run a routes handlers and render the route.
export function _renderRoute() {
  let route = state.loadingRoute;

  return route.handlers.reduce(function(handlerChain, nextHandler) {
    return handlerChain.then(function(result) {
      //Handler redirected, rerun with new route.
      if (result && result.redirect) return route(result.redirect);

      //Handler returned a component to be rendered, we are go.
      if (result && result.component) return result;

      return System.import(nextHandler).then(function(handlerModule) {
        //TODO don't like this whole force default business
        return handlerModule.default(state);
      });
    });
  }, Promise.resolve()).then(function(result) {
    route.title = result.title;
    route.component = result.component;

    return refresh(route);
  }).then(function() {
    //No longer loading the state, swap it as actual route object.
    state.route = state.loadingRoute;
    state.loadingRoute = null;

    //Push current state to history - according to mozilla specs,
    // second argument is currently unused.
    history.pushState(state, "", state.route.path);
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

export function pushRoutes() {

}

export function _setInitialState(_state) {
  state = _state;
}

export function _setRoutes(_routes) {
  routes = _routes;
}

//Define window popstate event. We want this to be consistent with out routing.
window.onpopstate = function(event) {
  state = event.state;
  refresh();
};

var React = require('react');
var urlPattern = require('url-pattern');

//TODO: an event emitter basic solution
var Zygo = {};

Zygo.route = function(path, headers) {
  headers |= {};

  for (var routeString in this.routes) {
    var  pattern = urlPattern.newPattern(routeString);
    var match = pattern.match(path);

    if (match) {
      console.log(path + " matches " + routeName);

      var handlers = this.routes[routeString];
      if (handlers instanceof String) handlers = [handlers];

      this.state.loadingRoute = {
        //returned by handlers, hence we get these later
        title: undefined,
        component: undefined,

        //already know these
        path: path,
        handlers: this.routes[routeString],
        options: match,
        headers: headers,
        method: 'GET'
      };

      return this._renderRoute();
    }
  }
};

//Run a routes handlers and render the route.
Zygo._renderRoute = function() {
  var route = this.state.loadingRoute;

  return route.handlers.reduce(function(handlerChain, nextHandler) {
    return handlerChain.then(function(result) {
      //Handler redirected, rerun with new route.
      if (result.redirect) return Zygo.route(result.redirect);

      //Handler returned a component to be rendered, we are go.
      if (result.component) return result;

      return System.import(nextHandler).then(function(handler) {
        return handler();
      });
    });
  }).then(function(result) {
    route.title = result.title;
    route.component = result.component;

    return Zygo.refresh(route);
  }).then(function() {
    //TODO: ?? does this break reference thing... ??
    Zygo.state.route = Zygo.state.loadingRoute;
    Zygo.state.loadingRoute = null;
  });
};

//Takes current component and rerenders it with current state.
Zygo.refresh = function(route) {
  route |= this.state.route;

  return System.import(route.component).then(function(component) {
    var container = document.getElementById('__zygo-body-container__');
    var element = React.createElement(component, Zygo.state);
    React.render(element, container);

    //set title now that rendering has taken place, and push TODO history state
    // TODO title might not be returned.
    document.getElementsByTagName('title')[0].innerHTML = route.title;
  });
};

Zygo.pushRoute = function() {

};

Zygo._setInitialState = function(state) {
  this.state = state;
};

Zygo._setRoutes = function(routes) {
  this.routes = routes;
};

module.exports = Zygo;

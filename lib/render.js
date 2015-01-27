import React from 'react';

//Renders the given react component to zygo div.
export function renderComponent(component) {
  let container = document.getElementById('__zygo-body-container__');
  React.render(component, container);
}

//Given an ordered list of matched routes, most general to least general,
// return component render nesting them and render it to page elements.
//The given context is that modfied and returned by the component handlers.
export function renderRoutes(routes, context) {
  //We render backwards - we need to inject the least general into its parent etc
  // all the way up the chain.
  routes.reverse();

  //Get component modules
  let loadedModules = [];

  //Load in component modules in order, grabbing identity if component not specified.
  return Promise.all(
    routes
      .map((route) => route.component)
      .map((module, i) => {
        return Promise.resolve()
          .then(() => {
            if (module) return System.import(module);
            return idComponent;
          })
          .then((componentModule) =>
            loadedModules[i] = componentModule.default
          );
      })
  )
  .then(() => routes.reverse()) //reverse is mutable, undo it
  .then(() => {
    //Reduce routes down to a single component, return render.
    return loadedModules.reduce((component, next, i) => {
      return React.createElement(next, context, component);
    }, null);
  })
  .then(renderComponent);
}

//Identity component if one not specified in a given route.
let idComponent = {
  default: React.createClass({
    render: function() {
      return this.props.children;
    }
  })
};

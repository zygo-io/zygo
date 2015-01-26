import React from 'react';

//Renders the given react component to zygo div.
export function renderComponent(component) {
  let container = document.getElementById('__zygo-body-container__');
  React.render(component, container);
}

//Given an ordered list of matched routes, most general to least general,
// return component render nesting them and render it to page elements.
//The given context is that modfied and returned by the component handlers.
//TODO: imply the identity component if component not specified.
export function renderRoutes(routes, context) {
  //We render backwards - we need to inject the least general into its parent etc
  // all the way up the chain.
  routes.reverse();

  //Get list of modules for loading and cssTrace purposes.
  let modules = routes.map((route) => route.component);
  let loadedModules = [];

  //Load in component modules in order
  return Promise.all(modules.map((module, i) =>
    System.import(module).then((componentModule) =>
      loadedModules[i] = componentModule.default
    )
  ))
  .then(() => {
    //Reduce routes down to a single component, return render.
    return loadedModules.reduce((component, next, i) => {
      return React.createElement(next, context, component);
    }, null);
  })
  .then((component) => renderComponent(component));
}

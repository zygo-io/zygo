# Zygo

Zygo is the beginnings of a slim dual client/server rendering framework built around [JSPM](github.com/jspm/jspm-cli) and [React](github.com/facebook/react).  It is not in a usable state at the moment.

---

### Client API
- `zygo.route('/some/path' [, headers])`  
    Matches the given path against `zygo.routes`, runs the route handlers and then renders the route component.  
    If the window history API is supported the route state is pushed and forward/backward history manipulation enabled.  
    `zygo.state.route` is then set with the route state.

- `zygo.pushState('/some/path' [, headers])`  
    Matches the route path, runs the handlers and pushes the route information into `zygo.state.route` without rendering.  
    Useful if you want to handle route transitions by hand.

- `zygo.refresh()`  
    Re-render the current route's component with the current state.

- `zygo.routes`  
    The client-side `routes.json`, pushed in from the server. See the section on configuration for details.

- `zygo.state`  
    Current state of the application. Modified by route handlers and pushed as React props to the route components at render time.

- `zygo.state.route`  
    Information on the current active route.

- `zygo.on('deserialize', callback(state))`  
    The state object is serialised before being pushed to the client - use this hook if you need to run custom deserialisation.

---

### Route Configuration

__example-routes-file.json:__
```
{
  '/messages/[:id]': 'handler-id',
  '/': ['handler-index'],
  'default': '404-handler'
}
```

<br />
The route paths link to an array (or a single string) of handler files, which need to default export a __handler function:__

```
export default function(state) {
  return Promise.resolve().then(function() {
    ... handler code ...

    return {
      component: '',
      title: ''
    };
  });
}
```

<br />
These handlers are run consecutively as chained promises when the route runs. The chain is considered finished as soon as one of the promises returns either of the following objects:
- `{ component: 'file', title: 'route-title' }`  
    Specifies the file containing the component to render and the page title.

- `{ redirect: '/path/to/redirect' }`  
    Aborts the handler chain and redirects the router to the given path.

<br />
In a similar vein to the handlers, the component file needs to default export a __react component__. When the component is rendered, `zygo.state` is accessible through the react `props` field:
```
export default React.createClass({
  render: function() {
    ... do cool things with this.props ..
  }
});
```

---

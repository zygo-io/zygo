# Zygo

Zygo is the beginnings of a slim dual client/server rendering framework built around JSPM and React.  It is not in a usable state at the moment.

### Client API
- `zygo.route('/some/path' [, headers])`  
    Matches the given path against `zygo.routes`, runs the route handlers and then renders the route component.  
    If the window history API is supported the route state is pushed and forward/backward history manipulation enabled.  
  `zygo.state.route` is then set with the route state.

- `zygo.pushState('/some/path' [, headers])`  
    Matches the route path, runs the handlers and pushes the route information into `zygo.state.route` without rendering.  
    Useful if you want to handle route transitions by hand.

- `zygo.refresh()`

- `zygo.routes`

- `zygo.state`

- `zygo.state.route`

- `zygo.on('deserialize')`

# Zygo-Client

Zygo is the beginnings of a slim dual client/server rendering framework built around [JSPM](https://www.github.com/jspm/jspm-cli) and [React](https://www.github.com/facebook/react). This repo contains the client side routing and rendering code, and if desired can be used independently of [Zygo-Server](https://www.github.com/Bubblyworld/zygo-server).

## Why?

Isomorphic client/server rendering comes with well-known benefits - faster page render times for the client, and SEO benefits for single-page apps being chief among them. There are also a number of problems - dataflow from server to client, interactivity issues  before the javascript is bootstrapped, scalability etcetera.

We believe that the development of tools such as [JSPM](https://www.github.com/jspm/jspm-cli) and [React](https://www.github.com/facebook/react) has illuminated the way forward for isomorphic rendering. [JSPM](https://www.github.com/jspm/jspm-cli) provides the means to write code that runs on both client and server with zero overhead, while [React](https://www.github.com/facebook/react) provides fast rendering abstractions for quick bootstrapping on the client. Zygo wraps these tools into a simple solution to the rendering problem.

## How?

Zygo is essentially a __stateless render server__, and is agnostic to how you store your data - the handler abstraction provides the link between data and app. By decoupling data from rendering, we believe Zygo is easier to distribute and scale. There are three components to Zygo:
- __Routes__  
A route in zygo is a URL path that maps to a component for rendering and to a handler for data loading. Existing React-based routers typically require the entire app to be included upfront before rendering can take place. For larger apps, this can cause an unacceptable delay between first and last page render time, during which the app is static and less responsive.  
To solve this, Zygo implements a simple asynchronous router - this allows the client to only load only what it needs of the app at any point in time.

- __Components__  
By using React for the components, Zygo can render the app identically on the server and client. At page load, the Zygo server packages a CSS trace and data loaded by the route handler into the page HTML, leading to a fast bootstrap on the client.

- __Handlers__  
Handlers load the data required by a route. Zygo stores the data on a per-request basis, remaining stateless. This encourages the separation of data and rendering.

## Should I?

There is a time and place for everything. If app responsiveness is absolutely critical, and data is less important, isomorphic rendering is perhaps not the solution. On the other hand, situations where the app is built around it's data could benefit from this approach.

The point of Zygo is to make this decision as easy as possible from an architectural point of view.

## Installation
To install it in a JSPM project, run:
``` bash
$ jspm install github:bubblyworld/zygo
```

## Example Usage
For a more detailed description of the client API, see the [project wiki](https://www.github.com/Bubblyworld/zygo/wiki).  
For a complete example, see [zygo-example](https://www.github.com/Bubblyworld/zygo-example).

``` javascript
import * as zygo from 'zygo';

//Set the initial state of the application.
zygo._setInitialState({
  myState: someValue,
  meOtherState: someOtherValue
});

//Set up the routes.
zygo._setRoutes({
  '/' : 'handlers/indexHandler',
  '/about' : 'handlers/aboutHandler',
  '/post/[:id]' : 'handlers/postHandler'
});

//Link anchor tags to router
zygo._addLinkHandlers();

//Start the router at the index route
zygo.route('/');
```

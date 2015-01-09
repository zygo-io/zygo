import * as zygo from './zygo/lib/zygo-client';
import mocha from 'mocha';

mocha.setup('bdd');

let initialState = {
  stores: {},
  route: {}
};

let routes = {
  '/first': 'app/first_handler',
  '/second': ['app/second_handler'],
  '/messages': 'app/messages_handler'
};

describe("Initial State/Routes", function() {
  it("should initialise state correctly", function() {
    zygo._setInitialState(initialState);
    //assert.equal(zygo.state, initialState);
  });

  it("should initialise routes correctly", function() {
    zygo._setRoutes(routes);
    //assert.equal(zygo.routes, routes);
  });
});

mocha.run();

zygo._setInitialState(initialState);
zygo._setRoutes(routes);
zygo.route('/first');

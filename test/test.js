import * as zygo from "./zygo/lib/zygo-client";

zygo._setInitialState({
  stores: {},
  route: {}
});

zygo._setRoutes({
  '/first': 'app/first_handler',
  '/second': ['app/second_handler'],
  '/messages': 'app/messages_handler'
});

zygo.route('/first');

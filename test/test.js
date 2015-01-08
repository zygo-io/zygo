import * as zygo from "./zygo/lib/zygo-client";

zygo._setInitialState({
  stores: {},
  route: {}
});

zygo._setRoutes({
  '/': 'app/index_handler',
  '/message': ['app/message_handler']
});

//zygo.renderComponent('app/index.jsx!', 'my title');
zygo.route('/message');

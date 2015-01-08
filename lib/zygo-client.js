var urlPattern = require('url-pattern');

//TODO: an event emitter basic solution
var Zygo = {};

Zygo.route = function(routeName, options) {
  options |= {};

  for (var routeString in Zygo.routes) {
    var  pattern = urlPattern.newPattern(routeString);
    var match = pattern.match(routeName);

    if (match) {
      console.log(routeString + " matches " + routeName);
      //TODO: transition into the new route
      // we need to set appropriate properties
    }
  }
};

Zygo.refresh = function() {

};

module.exports = Zygo;

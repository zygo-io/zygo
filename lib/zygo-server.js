var EventEmitter = require('events').EventEmitter;
var Config = require('./config');

var Zygo = new EventEmitter();

Zygo.initialise = function(configFile) {
  Zygo.config = new Config(configFile);

  try {
    Zygo.config.parse();
  } catch(error) { throw error; }

  //We need to run through each handler to grab their serialisation hooks.
  //As modules are referenced by their jspm handles, this is actually going to take
  // a bit of api reading.
};

/**
 * Default serialisation of the zygo.state.route object.
 */
Zygo.on('serialise', function() {
  //TODO
});

module.exports = Zygo;

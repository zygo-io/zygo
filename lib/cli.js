var cli = require('cli');
var path = require('path');
var Config = require('./config');

cli.parse({
  config: ['c', 'Path to config file.', 'file', __dirname + 'zygo.json']
});

cli.main(function(args, options) {
  try {
    var config = new Config(path.resolve(options.config)).parse();
  } catch(error) {
    _errorMessage("Error loading config file.", error);
  }
});

function _errorMessage(msg, err) {
  console.log("\033[31m err \x1b[39;49m" + msg + "\n     " + err.stack);
}

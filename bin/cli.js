var cli = require('cli');
var path = require('path');
var Zygo = require('./zygo-server');
var Jspm = require('jspm');

cli.parse({
  config: ['c', 'Path to config file.', 'file', 'zygo.json']
});
cli.main(main);

function main(args, options) {
  try {
    Zygo.initialise(options.config);
  } catch(error) {
    _errorMessage("Error: initialising Zygo.");
    _normalMessage(error);
    return;
  }
  _errorMessage("blah %d", 4);
  _okMessage("Initialised Zygo.");

  //Cd to their config directory, intialise Jspm
  var configDir = path.dirname(Zygo.config.configPath);
  Jspm.setPackagePath(path.dirname(configDir));
  process.chdir(configDir);

  _okMessage("Initialised Jspm.");

  server();
}

//TODO: refactor this mess
function server() {
  var port = +Zygo.config.port || 80;
  _infoMessage("Starting server on port %d.", port);
}

function _normalMessage() {
  var fmt = "     " + arguments[0];
  console.log.apply(this, [fmt].concat(Array.prototype.slice.call(arguments, 1)));
}

function _errorMessage() {
  var fmt = "\033[31m err \x1b[39;49m" + arguments[0];
  console.log.apply(this, [fmt].concat(Array.prototype.slice.call(arguments, 1)));
}

function _infoMessage() {
  var fmt = "\033[34minfo \x1b[39;49m"+ arguments[0];
  console.log.apply(this, [fmt].concat(Array.prototype.slice.call(arguments, 1)));
}

function _okMessage() {
  var fmt = "\033[32m  ok \x1b[39;49m" + arguments[0];
  console.log.apply(this, [fmt].concat(Array.prototype.slice.call(arguments, 1)));
}

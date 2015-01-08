var cli = require('cli');
var path = require('path');
var Zygo = require('./zygo');

cli.parse({
  config: ['c', 'Path to config file.', 'file', 'zygo.json']
});

cli.main(function(args, options) {
  try {
    Zygo.initialise(options.config);
  } catch(error) {
    _errorMessage("Error: initialising Zygo.");
    _normalMessage(error);
    return;
  }

  //Change working dir to config path
  process.chdir(path.dirname(Zygo.config.configPath));
});

function _normalMessage(msg) {
  console.log("     " + msg);
}

function _errorMessage(msg) {
  console.log("\033[31m err \x1b[39;49m" + msg);
}

function _infoMessage(msg) {
  console.log("\033[34minfo \x1b[39;49m" + msg);
}

function _okMessage(msg) {
  console.log("\033[32m  ok \x1b[39;49m" + msg);
}

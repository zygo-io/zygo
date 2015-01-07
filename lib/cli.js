var cli = require('cli');
var path = require('path');

cli.parse({
  config: ['c', 'Path to config file.', 'file', __dirname + 'zygo.json']
});

cli.main(function(args, options) {
  options.config = path.resolve(options.config);
});

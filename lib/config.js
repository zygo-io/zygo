var path = require('path');
var fs = require('fs');

var Config = function(configPath) {
  this.configPath = configPath;
};

Config.prototype.parse = function() {
  this.config = this._getJSONFile(this.configPath);
};

Config.prototype._getJSONFile = function(path, relativeTo) {
  if (relativeTo) {
    try {
      return JSON.parse(fs.readFileSync(relativeTo + path, "utf-8"));
    } catch(_) { /* try absolute path as a fallback */ }
  }

  return JSON.parse(fs.readFileSync(path, "utf-8"));
};

module.exports = Config;

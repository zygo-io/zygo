import path from 'path';
import fs from 'fs';

export default class Config {
  constructor(configFile) {
    this.configPath = path.resolve(configFile);
  }

  parse() {
    var baseDir = path.dirname(this.configPath);

    this.config = this._getJSONFile(this.configPath);
    this.template = this._getFile(this.config.template, baseDir);

    var self = this;
    ['routes', 'clientRoutes', 'serverRoutes'].map(function(route) {
      self[route] = self._getJSONFile(self.config[route], baseDir);
    });
  }

  _getFile(file, relativeTo) {
    if (relativeTo) {
      try {
        return fs.readFileSync(path.join(relativeTo, file), "utf-8");
      } catch(_) { /* try absolute path as a fallback */ }
    }

    return fs.readFileSync(file, "utf-8");
  }

  _getJSONFile(file, relativeTo) {
    return JSON.parse(this._getFile(file, relativeTo));
  }
}

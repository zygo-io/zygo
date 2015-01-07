System.config({
  "paths": {
    "*": "*.js",
    "Zygo/*": "lib/*.js",
    "github:*": "jspm_packages/github/*.js",
    "npm:*": "jspm_packages/npm/*.js"
  }
});

System.config({
  "map": {
    "rsvp": "npm:rsvp@3.0.16",
    "url-pattern": "npm:url-pattern@0.6.0",
    "github:jspm/nodelibs-process@0.1.0": {
      "process": "npm:process@0.10.0"
    },
    "npm:rsvp@3.0.16": {
      "process": "github:jspm/nodelibs-process@0.1.0"
    }
  }
});


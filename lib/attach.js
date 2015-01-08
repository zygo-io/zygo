var Jspm = require('jspm');
var React = require('react');
var Zygo = require('./zygo');
var fs = require('fs');

module.exports = {
  _generateTitle: function() {
    return Promise.resolve().then(function() {
      return '<title>' + Zygo.state.route.title + '</title>';
    });
  },

  //Only async function here.
  _generateBody: function() {
    return Jspm.import(Zygo.pageComponent).then(function(component) {
      var element = React.createElement(component, Zygo.state);
      return React.renderToString(element);
    });
  },

  _generateHeader: function() {
    return Promise.resolve().then(function() {
      return "";
    });
  },

  _generateFooter: function() {
    return Promise.resolve().then(function() {
      //TODO: serialise here
      return "<script>\n" +
      "System.paths['zygo'] = '/zygo_internals/zygo.js';" +
      "System.import('zygo').then(function(zygo) {\n" +
      "  zygo._setInitialState(\n" +
      JSON.stringify(Zygo.state) +
      "  );\n" +
      "});";
    });
  }
};

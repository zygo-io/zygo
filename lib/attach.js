var Zygo = require('./zygo');
var React = require('react');
var fs = require('fs');

module.exports = {
  _generateTitle: function() {
    return '<title>' + Zygo.state.route.title + '</title>';
  },

  //TODO: broken, need to wrap jspm module loading, might be tricky
  _generateBody: function() {
    var component = React.createElement(Zygo.pageComponent, Zygo.state);
    return react.renderToString(component);
  }
};

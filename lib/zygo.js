function _isServer() {
  return typeof exports !== 'undefined' && this.exports !== exports;
}

module.exports  = _isServer() ?
  require('./zygo-server') :
  require('./zygo-client');

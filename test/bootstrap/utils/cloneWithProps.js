/* */ 
var React = require("react");
var joinClasses = require("./joinClasses");
var assign = require("./Object.assign");
function createTransferStrategy(mergeStrategy) {
  return function(props, key, value) {
    if (!props.hasOwnProperty(key)) {
      props[key] = value;
    } else {
      props[key] = mergeStrategy(props[key], value);
    }
  };
}
var transferStrategyMerge = createTransferStrategy(function(a, b) {
  return assign({}, b, a);
});
function emptyFunction() {}
var TransferStrategies = {
  children: emptyFunction,
  className: createTransferStrategy(joinClasses),
  style: transferStrategyMerge
};
function transferInto(props, newProps) {
  for (var thisKey in newProps) {
    if (!newProps.hasOwnProperty(thisKey)) {
      continue;
    }
    var transferStrategy = TransferStrategies[thisKey];
    if (transferStrategy && TransferStrategies.hasOwnProperty(thisKey)) {
      transferStrategy(props, thisKey, newProps[thisKey]);
    } else if (!props.hasOwnProperty(thisKey)) {
      props[thisKey] = newProps[thisKey];
    }
  }
  return props;
}
function mergeProps(oldProps, newProps) {
  return transferInto(assign({}, oldProps), newProps);
}
var ReactPropTransferer = {mergeProps: mergeProps};
var CHILDREN_PROP = 'children';
function cloneWithProps(child, props) {
  var newProps = ReactPropTransferer.mergeProps(props, child.props);
  if (!newProps.hasOwnProperty(CHILDREN_PROP) && child.props.hasOwnProperty(CHILDREN_PROP)) {
    newProps.children = child.props.children;
  }
  if (React.version.substr(0, 4) === '0.12') {
    var mockLegacyFactory = function() {};
    mockLegacyFactory.isReactLegacyFactory = true;
    mockLegacyFactory.type = child.type;
    return React.createElement(mockLegacyFactory, newProps);
  }
  return React.createElement(child.type, newProps);
}
module.exports = cloneWithProps;

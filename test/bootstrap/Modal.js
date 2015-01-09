/* */ 
var React = require("react");
var joinClasses = require("./utils/joinClasses");
var classSet = require("./utils/classSet");
var BootstrapMixin = require("./BootstrapMixin");
var FadeMixin = require("./FadeMixin");
var EventListener = require("./utils/EventListener");
var Modal = React.createClass({
  displayName: 'Modal',
  mixins: [BootstrapMixin, FadeMixin],
  propTypes: {
    title: React.PropTypes.node,
    backdrop: React.PropTypes.oneOf(['static', true, false]),
    keyboard: React.PropTypes.bool,
    closeButton: React.PropTypes.bool,
    animation: React.PropTypes.bool,
    onRequestHide: React.PropTypes.func.isRequired
  },
  getDefaultProps: function() {
    return {
      bsClass: 'modal',
      backdrop: true,
      keyboard: true,
      animation: true,
      closeButton: true
    };
  },
  render: function() {
    var modalStyle = {display: 'block'};
    var dialogClasses = this.getBsClassSet();
    delete dialogClasses.modal;
    dialogClasses['modal-dialog'] = true;
    var classes = {
      modal: true,
      fade: this.props.animation,
      'in': !this.props.animation || !document.querySelectorAll
    };
    var modal = (React.createElement("div", React.__spread({}, this.props, {
      title: null,
      tabIndex: "-1",
      role: "dialog",
      style: modalStyle,
      className: joinClasses(this.props.className, classSet(classes)),
      onClick: this.props.backdrop === true ? this.handleBackdropClick : null,
      ref: "modal"
    }), React.createElement("div", {className: classSet(dialogClasses)}, React.createElement("div", {className: "modal-content"}, this.props.title ? this.renderHeader() : null, this.props.children))));
    return this.props.backdrop ? this.renderBackdrop(modal) : modal;
  },
  renderBackdrop: function(modal) {
    var classes = {
      'modal-backdrop': true,
      'fade': this.props.animation
    };
    classes['in'] = !this.props.animation || !document.querySelectorAll;
    var onClick = this.props.backdrop === true ? this.handleBackdropClick : null;
    return (React.createElement("div", null, React.createElement("div", {
      className: classSet(classes),
      ref: "backdrop",
      onClick: onClick
    }), modal));
  },
  renderHeader: function() {
    var closeButton;
    if (this.props.closeButton) {
      closeButton = (React.createElement("button", {
        type: "button",
        className: "close",
        'aria-hidden': "true",
        onClick: this.props.onRequestHide
      }, "×"));
    }
    return (React.createElement("div", {className: "modal-header"}, closeButton, this.renderTitle()));
  },
  renderTitle: function() {
    return (React.isValidElement(this.props.title) ? this.props.title : React.createElement("h4", {className: "modal-title"}, this.props.title));
  },
  iosClickHack: function() {
    this.refs.modal.getDOMNode().onclick = function() {};
    this.refs.backdrop.getDOMNode().onclick = function() {};
  },
  componentDidMount: function() {
    this._onDocumentKeyupListener = EventListener.listen(document, 'keyup', this.handleDocumentKeyUp);
    if (this.props.backdrop) {
      this.iosClickHack();
    }
  },
  componentDidUpdate: function(prevProps) {
    if (this.props.backdrop && this.props.backdrop !== prevProps.backdrop) {
      this.iosClickHack();
    }
  },
  componentWillUnmount: function() {
    this._onDocumentKeyupListener.remove();
  },
  handleBackdropClick: function(e) {
    if (e.target !== e.currentTarget) {
      return;
    }
    this.props.onRequestHide();
  },
  handleDocumentKeyUp: function(e) {
    if (this.props.keyboard && e.keyCode === 27) {
      this.props.onRequestHide();
    }
  }
});
module.exports = Modal;

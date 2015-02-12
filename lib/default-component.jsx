import React from 'react';

export default React.createClass({
  render: function() {
    return (
      <div>
        {"Error: " + (this.props.errorCode || 404)}
      </div>
    );
  }
});

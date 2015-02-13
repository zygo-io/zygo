import React from 'react';

export default React.createClass({
  render: function() {
    if (!this.props.error) {
      this.props.error = {
        status: 404,
        message: 'route not found'
      }
    }

    return (
      <div>
        {"Error: " + this.props.error.status}
        <br />
        {this.props.error.message}
      </div>
    );
  }
});

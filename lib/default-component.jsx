import "./default-component.css!";
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
        <h2> {"Error: " + this.props.error.status} </h2>
        <p>
          {this.props.error.message}
        </p>
      </div>
    );
  }
});

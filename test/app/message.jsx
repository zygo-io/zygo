import React from 'react';
import * as zygo from 'zygo/lib/zygo-client';

export default React.createClass({
  render: function() {
    return (
      <div>
        <h5> MESSAGE: {this.props.message} </h5>
        <button onClick={this.clickHandler}> Switch back to the index route. </button>
      </div>
    );
  },

  clickHandler: function() {
    zygo.route('/');
  }
});

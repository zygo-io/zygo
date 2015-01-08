import React from 'react';
import * as zygo from 'zygo/lib/zygo-client';

export default React.createClass({
  render: function() {
    return (
      <div>
        <button onClick={this.clickHandler}> Switch to the messages route. </button>
      </div>
    );
  },

  clickHandler: function() {
    zygo.route('/message');
  }
});

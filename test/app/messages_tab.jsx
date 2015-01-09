import React from 'react';

export default React.createClass({
  render: function() {
    var messages = this.props.messages.map((msg, key) => {
      return (<li key={key}> msg </li>);
    });

    return (
      <ul>
        {messages}
      </ul>
    );
  }
});

import React from 'react';

export default React.createClass({
  render: function() {
    return (
      <div>
        <a href="/first" id="gotoOne"> One </a>
        <a href="/FAIL" id="gotoFail"> Fail </a>
      </div>
    );
  }
});

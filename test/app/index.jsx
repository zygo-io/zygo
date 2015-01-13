import './index.css!';

import React from 'react';
import * as zygo from '../zygo/lib/zygo-client';

import Links from './links.jsx!';
import MessagesTab from './messages_tab.jsx!';
import TabbedArea from '../bootstrap/TabbedArea';
import TabPane from '../bootstrap/TabPane';

export default React.createClass({
  render: function() {
    return (
      <TabbedArea animation={false} activeKey={this.props.indexTabKey} onSelect={this.handleSelect}>
        <TabPane eventKey={1} tab="First Tab">
          {this.props.firstTabContent}
        </TabPane>

        <TabPane eventKey={2} tab="Second Tab">
          {this.props.secondTabContent}
        </TabPane>

        <TabPane eventKey={3} tab="Messages">
          <MessagesTab messages={this.props.messages || []} />
        </TabPane>

        <TabPane eventKey={4} tab="Links">
          <Links />
        </TabPane>
      </TabbedArea>
    );
  },

  handleSelect: function(key) {
    switch(key) {
      case 1: zygo.route('/first'); break;
      case 2: zygo.route('/second'); break;
      case 3: zygo.route('/messages'); break;
      case 4: zygo.route('/links'); break;
    }
  }
});

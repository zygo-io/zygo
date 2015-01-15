import * as zygo from '../zygo/lib/zygo-client';

export default function(assert) {
  describe("zygo-client.js tests", function() {
    this.timeout(5000);

    before(function() {
      zygo._setInitialState(initialState);
      zygo._setRoutes(routes);
      zygo._addLinkHandlers();
    });

    let initialState = {
      stores: {},
      route: {}
    };

    let routes = {
      '/first': 'test/app/first_handler',
      '/second': ['test/app/second_handler'],
      '/messages': 'test/app/messages_handler',
      '/links': 'test/app/links_handler',
      'default': 'test/app/second_handler'
    };

    describe("zygo._setInitialState(), zygo._setRoutes()", function() {
      it("should initialise state correctly", function() {
        zygo._setInitialState(initialState);
        assert.equal(zygo.state, initialState);
      });

      it("should initialise routes correctly", function() {
        zygo._setRoutes(routes);
        assert.equal(zygo.routes, routes);
      });
    });

    describe("zygo.route()", function() {
      it("should not throw an error on correct route", function(done) {
          assert.doesNotThrow(function() {
            zygo.route("/first").then(done);
          });
      });

      describe("should transition to the first tab on /first", function() {
        before(function(done) {
          zygo.route("/first").then(done).catch(done);
        });

        it("should set the title correctly", function() {
          _assertTitleEquals('On the first tab!');
        });

        it("should set the body html correctly", function() {
          _assertContentEquals('Setting the first tab content.');
        });

        it("should set state in the handlers correctly", function() {
          assert.equal(zygo.state.indexTabKey, 1);
          assert.equal(zygo.state.firstTabContent, 'Setting the first tab content.');
        });
      });

      describe("should cancel transition if another interrupts it", function() {
        before(function(done) {
          zygo.route('/messages');
          zygo.route('/second').then(done).catch(done);
        });

        it("should have transitioned into the interrupting route", function() {
          assert.equal(zygo.state.route.path, '/second');
          assert.equal(zygo.state.indexTabKey, 2);
          assert.equal(zygo.state.secondTabContent, 'Second tab content.');
          _assertContentEquals('Second tab content.');
          _assertTitleEquals('On the second tab!');
        });
      });

      describe("<a> tags with route hrefs handled by router", function() {
        beforeEach(function(done) {
          zygo.route('/links').then(done);
        });

        it("should work if valid route link clicked", function() {
          document.getElementById('gotoOne').click();
          assert.equal(zygo.currentPath, '/first');
        });
      });
    });

    describe("zygo.on(), zygo._emit()", function() {
      let x = false, y = false;

      before(function() {
        zygo.on('test_callback', (data) => {
          x = data;
        });

        zygo.on('fake_test_callback', () => {
          y = true;
        });

        zygo._emit('test_callback', true);
      });

      it("should run callback when event is emitted", function() {
        assert(x);
      });

      it("should not run callback when different event is emitted", function() {
        assert(!y);
      });
    });

    describe("zygo.pushState()", function() {
      let route;

      before(function(done) {
        zygo.route('/first').then(function() {
          zygo.pushState('/messages', { fakeOption: true }).then(done);
        });
      });

      it("should set state with message data", function() {
        assert.deepEqual(zygo.state.messages,  ['msg1', 'msg2', 'msg3']);
      });

      it("should resolve to the correct component", function() {
        assert.equal(zygo.state.route.component, "test/app/index.jsx!");
      });

      it("should set route headers correctly", function() {
        assert.deepEqual(zygo.state.route.headers, { fakeOption: true });
      });

      it("should not have rendered the route", function() {
        _assertContentEquals('Setting the first tab content.');
      });
    });

    describe("zygo.refresh()", function() {
      before(function(done) {
        zygo.pushState('/second').then(function() {
          zygo.refresh().then(done);
        });
      });

      it("should have rendered the current route", function() {
        _assertContentEquals('Second tab content.');
      });

      it("should set the title correctly", function() {
        _assertTitleEquals('On the second tab!');
      });
    });

    describe("zygo.renderComponent()", function() {
      before(function(done) {
        zygo.state.indexTabKey = 1;
        zygo.renderComponent("test/app/index.jsx!").then(function() {
          zygo.state.indexTabKey = 2;
          zygo.state.secondTabContent = 'fake content';

          return zygo.renderComponent("test/app/index.jsx!", "fake title");
        }).then(done);
      });

      it("should have rendered the current route", function() {
        _assertContentEquals('fake content');
      });

      it("should set the title correctly", function() {
        _assertTitleEquals('fake title');
      });
    });
  });

  function _assertTitleEquals(title) {
    let titleTags = document.getElementsByTagName("title");

    assert(titleTags.length == 1);
    assert.equal(titleTags[0].innerHTML, title);
  }

  function _assertContentEquals(content) {
    let tabTags = document.getElementsByClassName("tab-pane active");

    assert(tabTags.length == 1);
    assert.equal(tabTags[0].innerHTML, content);
  }
}

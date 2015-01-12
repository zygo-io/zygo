import * as zygo from './zygo/lib/zygo-client';

export default function(assert) {
  let initialState = {
    stores: {},
    route: {}
  };

  let routes = {
    '/first': 'app/first_handler',
    '/second': ['app/second_handler'],
    '/messages': 'app/messages_handler'
  };

  describe("Initial State/Routes", function() {
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
    this.timeout(5000);

    it("should throw an error on incorrect route", function() {
        assert.throws(function() {
          zygo.route("/does/not/exist");
        }, Error);
    });

    it("should not throw an error on correct route", function(done) {
        assert.doesNotThrow(function() {
          zygo.route("/first").then(done);
        });
    });

    describe("should transition to the first tab on /first", function() {
      before(function(done) {
        zygo._setInitialState(initialState);
        zygo._setRoutes(routes);

        zygo.route("/first").then(done).catch(done);
      });

      it("should set the title correctly", function() {
        let titleTags = document.getElementsByTagName("title");

        assert(titleTags.length == 1);
        assert.equal(titleTags[0].innerHTML, 'On the first tab!');
      });

      it("should set the body html right", function() {
        let tabTags = document.getElementsByClassName("tab-pane active");

        assert(tabTags.length == 1);
        assert.equal(tabTags[0].innerHTML, 'Setting the first tab content.');
      });
    });
  });
}

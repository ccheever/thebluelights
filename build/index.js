'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _ = require('lodash-node');
var radiora2 = require('radiora2');

var LutronClient = (function () {
  function LutronClient(opts) {
    _classCallCheck(this, LutronClient);

    opts = opts || {};
    this.host = opts.host || '192.168.1.201';
    this.username = opts.username || 'lutron';
    this.password = opts.password || 'integration';
    this.client = new radiora2.RadioRa2(this.host, this.username, this.password);
  }

  _createClass(LutronClient, [{
    key: 'connect',
    value: function connect() {
      this.client.connect();
    }
  }, {
    key: 'charliesRoomLights',
    value: function charliesRoomLights(x) {
      if (_.isBoolean(x)) {
        if (x) {
          this.client.pressButton(24, 2);
        } else {
          this.client.pressButton(24, 4);
        }
      } else if (_.isNumber(x)) {
        this.client.setDimmer(20, x);
      } else {
        throw new Error('boolean or number required');
      }
    }
  }, {
    key: 'allLights',
    value: function allLights(x) {
      if (_.isBoolean(x)) {
        if (x) {
          this.client.pressButton(32, 1);
        } else {
          this.client.pressButton(32, 2);
        }
      } else {
        throw new Error('boolean required');
      }
    }
  }, {
    key: 'commonAreaLights',
    value: function commonAreaLights(x) {
      if (_.isBoolean(x)) {
        if (x) {
          this.client.pressButton(32, 3);
        } else {
          this.client.pressButton(32, 4);
        }
      } else {
        throw new Error('boolean required');
      }
    }
  }]);

  return LutronClient;
})();

module.exports = function () {
  var _client = new LutronClient();
  _client.connect();
  return _client;
};

module.exports.LutronClient = LutronClient;
//# sourceMappingURL=sourcemaps/index.js.map
let _ = require('lodash-node');
let radiora2 = require('radiora2');

class LutronClient {
  constructor(opts) {
    opts = opts || {};
    this.host = opts.host || '192.168.1.201';
    this.username = opts.username || 'lutron';
    this.password = opts.password || 'integration';
    this.client = new radiora2.RadioRa2(this.host, this.username, this.password);
  }

  connect() {
    this.client.connect();
  }

  charliesRoomLights(x) {
    if (_.isBoolean(x)) {
      if (x) {
        this.client.pressButton(24, 2);
      } else {
        this.client.pressButton(24, 4);
      }
    } else if (_.isNumber(x)) {
      this.client.setDimmer(20, x);
    } else {
      throw new Error("boolean or number required");
    }
  }

  allLights(x) {
    if (_.isBoolean(x)) {
      if (x) {
        this.client.pressButton(32, 1);
      } else {
        this.client.pressButton(32, 2);
      }
    } else {
      throw new Error("boolean required");
    }
  }

  commonAreaLights(x) {
    if (_.isBoolean(x)) {
      if (x) {
        this.client.pressButton(32, 3);
      } else {
        this.client.pressButton(32, 4);
      }
    } else {
      throw new Error("boolean required");
    }
  }

}

module.exports = function () {
  let _client = new LutronClient();
  _client.connect();
  return _client;
}

module.exports.LutronClient = LutronClient;

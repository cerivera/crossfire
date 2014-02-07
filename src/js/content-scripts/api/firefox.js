function FirefoxApi() {}

FirefoxApi.prototype.sendMessage = function(msg, data) {
    // TODO i'm not convinced we need this stuff
    data = data || {};
    data[msg] = true;
    data.msg = msg;
    self.port.emit(msg, data);
};

FirefoxApi.prototype.onMessage = function(msg, callback) {
    self.port.on(msg, callback);
};

exports.FirefoxApi = FirefoxApi;
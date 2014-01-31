function SafariApi() {
    var callbacks = {};

    safari.self.addEventListener("message", function(msg) {
        if (msg.name != "fromGlobal") {
            return;
        }

        var request = msg.message;
        if (callbacks[request.msg]) {
            callbacks[request.msg](request);
        }
    }, false);


    this.onMessage = function(msg, callback) {
        callbacks[msg] = callback;
    };
}

SafariApi.prototype.sendMessage = function(msg, data) {
    data = data || {};
    data[msg] = true;
    data.msg = msg;
    safari.self.tab.dispatchMessage("fromInjected", data);
}

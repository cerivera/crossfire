function ChromeApi() {
    var callbacks = {};

    chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
        if (callbacks[request.msg]) {
            callbacks[request.msg](request);
            sendResponse({});
        }
    });

    this.onMessage = function(msg, callback) {
        callbacks[msg] = callback;
    };
}

ChromeApi.prototype.sendMessage = function(msg, data) {
    data = data || {};
    data[msg] = true;
    data.msg = msg;
    chrome.runtime.sendMessage(data);
}

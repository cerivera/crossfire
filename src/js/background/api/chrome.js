function ChromeApi() {
    var callbacks = {};

    chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
        if (callbacks[request.msg]) {
            sendResponse({});
            callbacks[request.msg](request, sender.tab);
        }
    });

    this.onMessage = function(msg, callback) {
        callbacks[msg] = callback;
    };
}

ChromeApi.prototype.sendMessage = function(tab, msg, data) {
    data = data || {};
    data.msg = msg;
    chrome.tabs.sendMessage(tab.id, data);
};

ChromeApi.prototype.getCurrentTab = function(callback) {
    chrome.tabs.query({"active":true, "currentWindow": true}, function(tabs) {
        callback(tabs[0]);
    });
};

ChromeApi.prototype.onClick = function(callback) {
    chrome.browserAction.onClicked.addListener(function(tab) {
        callback(tab);
    });
};

ChromeApi.prototype.enableIcon = function(tab) {
    chrome.browserAction.enable(tab.id);
};

ChromeApi.prototype.disableIcon = function(tab) {
    chrome.browserAction.disable(tab.id);
}

exports.ChromeApi = ChromeApi;
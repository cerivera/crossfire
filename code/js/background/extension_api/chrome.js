// Functions specific to each extension.  Used to communicate with CS and listen for tab events.
var ExtensionApi = (function() {
    var _listenerInitialized = false;
    var _listenerCallbacks = {};

    function _initListener() {
        chrome.extension.onMessage.addListener(_listener);
        _listenerInitialized = true;
    }

    function _listener(request, sender, sendResponse) {
        if (_listenerCallbacks[request.msg]) {
            _listenerCallbacks[request.msg](request, sender.tab);
            sendResponse({});
        }
    }

    return {
        // Sends message to CS
        sendMessage : function(tab, msg, data) {
            data = data || {};
            data.msg = msg;
            chrome.tabs.sendMessage(tab.id, data);
        },

        // Listens to messages from CS
        onMessage : function(msg, callback) {
            _listenerCallbacks[msg] = callback;
            if (!_listenerInitialized) {
                _initListener();
            }
        },

        getCurrentTab : function (callback) {
            chrome.tabs.query({"active":true, "currentWindow": true}, function(tabs) {
                callback(tabs[0]);
            });
        },

        onClick : function(callback) {
            chrome.browserAction.onClicked.addListener(function(tab) {
                callback(tab);
            });
        },

        enableIcon : function(tab) {
            chrome.browserAction.enable(tab.id);
        },

        disableIcon : function(tab) {
            chrome.browserAction.disable(tab.id);
        }
    };
})();

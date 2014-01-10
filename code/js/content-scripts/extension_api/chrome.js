// Used to communicate with Background
var ExtensionApi = (function() {
    var _listenerInitialized = false;
    var _listenerCallbacks = {};
    
    function _initListener() {
        chrome.extension.onMessage.addListener(_listener);
        _listenerInitialized = true;
    }

    function _listener(request, sender, sendResponse) {
        if (_listenerCallbacks[request.msg]) {
            _listenerCallbacks[request.msg](request);
            sendResponse({});
        }
    }

    return {
        sendMessage : function(name, data) {
            data = data || {};
            data[name] = true;
            data.msg = name;
            chrome.runtime.sendMessage(data);
        },

        onMessage : function(msg, callback) {
            _listenerCallbacks[msg] = callback;
            if (!_listenerInitialized) {
                _initListener();
            }
        },
        
        getUrl : function(asset) {
            return chrome.extension.getURL(asset);
        }
    };
})();
// API sepific to the platform the extension lives on.  Mainly used to communicate with Background world. 
var ExtensionApi = (function() {
    var _listenerInitialized = false;
    var _listenerCallbacks = {};
    
    function _initListener() {
        safari.self.addEventListener("message", _listener, false);
        _listenerInitialized = true;
    }

    function _listener(msgEvent) {
        if (msgEvent.name != "fromGlobal") {
            return;
        }

        var request = msgEvent.message;
        if (_listenerCallbacks[request.msg]) {
            _listenerCallbacks[request.msg](request);
        }
    }

    return {
        sendMessage : function(name, data) {
            data = data || {};
            data[name] = true;
            data.msg = name;
            safari.self.tab.dispatchMessage("fromInjected", data);        
        },
        onMessage : function(msg, callback) {
            _listenerCallbacks[msg] = callback;
            if (!_listenerInitialized) {
                _initListener();
            }
        }
    };
})();

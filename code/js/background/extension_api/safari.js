// Functions specific to each extension.  Used to communicate with CS and listen for tab events.
var ExtensionApi = (function() {
    var _listenerInitialized = false;
    var _listenerCallbacks = {};

    function _initListener() {
        safari.application.activeBrowserWindow.addEventListener("message", _listener);
        _listenerInitialized = true;
    }

    function _listener(msgEvent) {
        if (msgEvent.name != "fromInjected") {
            return;
        }

        var request = msgEvent.message;
        if (_listenerCallbacks[request.msg]) {
            var tab = safari.application.activeBrowserWindow.activeTab;
            _listenerCallbacks[request.msg](request, tab);
        }
    }

    return {
        // Sends message to CS
        sendMessage : function(tab, msg, data) {
            data = data || {};
            data.msg = msg;
            safari.application.activeBrowserWindow.activeTab.page.dispatchMessage("fromGlobal", data);
        },

        // Listens to messages from CS
        onMessage : function(msg, callback) {
            _listenerCallbacks[msg] = callback;
            if (!_listenerInitialized) {
                _initListener();
            }
        },

        // Setups up listener for icon click.  Sends current tab to callback.
        onClick : function(callback) {
            safari.application.addEventListener("command", function(event){
                if (event.command === "start_command") {
                    callback(safari.application.activeBrowserWindow.activeTab);
                }
            }, false);
        },

        getCurrentTab : function(callback) {
            callback(safari.application.activeBrowserWindow.activeTab);
        },

        isPageValid : function(url) {
            return url && !(url.indexOf('file') == 0);
        },

        enableIcon : function(tab) {
            safari.extension.toolbarItems[0].disabled = false;
        },
        disableIcon : function(tab) {
            safari.extension.toolbarItems[0].disabled = true;
        }
    };
})();

if (typeof require !== 'undefined') {
    var ExtensionApi = require("./extension_api/firefox.js").ExtensionApi;
    var Constants = require("./constants.js").Constants;
    var _ = require("./lib/underscore");
}

var App = (function() {
    function _sendMessageToCurrentTab(msg, data) {
        data = data || {};
        ExtensionApi.getCurrentTab(function(tab) {
            ExtensionApi.sendMessage(tab, msg, data);
        });
    }

    return {
        init : function(options) {
            ExtensionApi.enableIcon(tab);

            // Listen for message from content scripts
            ExtensionApi.onMessage("open-link", function(request, tab) {
                ExtensionApi.openLinkInNewTab(request.url);
            });

            // Listen for icon click
            ExtensionApi.onClick(function(tab) {
                ExtensionApi.sendMessage(tab, "do-something");
            });
        }
    }
})();

if (typeof require !== 'undefined') {
    exports.App = App;
}

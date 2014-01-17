if (typeof require !== 'undefined') {
    var ExtensionApi = require("./extension_api/firefox.js").ExtensionApi;
    var Constants = require("./constants.js").Constants;
}

var App = (function() {
    return {
        init : function() {
            // Listen for message from content scripts
            ExtensionApi.onMessage("do-something-bg", function(request, tab) {
                alert("Doing something in the Background");
            });

            // Listen for icon click
            ExtensionApi.onClick(function(tab) {
                ExtensionApi.sendMessage(tab, "do-something-cs");
            });
        }
    }
})();

if (typeof require !== 'undefined') {
    exports.App = App;
}

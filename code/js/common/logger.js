if (typeof require !== 'undefined') {
    var Constants = require("./constants.js").Constants;
}

var Logger = (function() {
    return {
        log : function(msg) {
            if (Constants.DEBUG_MODE && (typeof console != "undefined" || window.console)) {
                console.log("======" + msg + "======");
            }
        }
    };
})();

if (typeof require !== "undefined") {
    exports.Logger = Logger;
}
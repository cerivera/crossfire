// Strategy pattern to get the correct storage mechanism
var storage = (function() {
    var LocalStorage = require('./storage/local').LocalStorage;
    var SimpleStorage = require('./storage/local').SimpleStorage;
    var instance;

    function init() {
        if (typeof chrome !== "undefined" || typeof safari !== "undefined") {
            return new LocalStorage();
        } else {
            return new SimpleStorage();
        }
    }

    return {
        get: function() {
            if (!instance) {
                instance = init();
            }

            return instance;
        }
    }
})();

exports.storage = storage;
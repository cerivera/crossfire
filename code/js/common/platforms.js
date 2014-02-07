var ChromeApi = require('./api/chrome.js').ChromeApi;
var SafariApi = require('./api/safari.js').SafariApi;
var FirefoxApi = require('./api/firefox.js').FirefoxApi;

var platforms = (function() {
    var instance;

    function init() {
        if (chrome !== undefined) {
            return new ChromeApi();
        } else if (safari !== undefined) {
            return new SafariApi();
        } else {
            return new FirefoxApi();
        }
    }

    return {
        getApi: function() {
            if (!instance) {
                instance = init();
            }

            return instance;
        }
    }
})();

exports.platforms = platforms;
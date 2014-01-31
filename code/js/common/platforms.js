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
var App = (function() {
    return {
        init : function() {
           // Messages that come from BG
            ExtensionApi.onMessage("do-something", function(request) {
                alert("Doing something!"); 
            });
        }
    };
})();

App.init();

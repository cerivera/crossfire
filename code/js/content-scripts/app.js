var App = (function() {
    return {
        init : function() {
           // Messages that come from Background
            ExtensionApi.onMessage("do-something-cs", function(request) {
                alert("Content Scripts are doing something!  Forcing Background to do something in two seconds..."); 
                setTimeout(function() {
                    ExtensionApi.sendMessage("do-something-bg");
                }, 2000);
            });
        }
    };
})();

App.init();

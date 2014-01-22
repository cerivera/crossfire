var App = (function() {
    return {
        init : function() {
            // Messages that come from Background
            ExtensionApi.onMessage("doSomethingCs", function(request) {
                alert("Content Scripts are doing something!  Forcing Background to do something in two seconds..."); 
                setTimeout(function() {
                    ExtensionApi.sendMessage("doSomethingBg");
                }, 2000);
            });
        }
    };
})();

App.init();

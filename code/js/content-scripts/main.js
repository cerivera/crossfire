var api = platforms.getApi();

api.onMessage("doSomethingCs", function(request) {
    alert("Content Script");
    setTimeout(function() {
        api.sendMessage("doSomethingBg");
    }, 2000);
});
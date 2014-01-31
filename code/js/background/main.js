var api = platforms.getApi();

api.onMessage("doSomethingBg", function(request, tab) {
    alert("Doing something in the Background");
});

api.onClick(function(tab) {
    api.sendMessage(tab, "doSomethingCs");
});





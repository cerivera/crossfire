var api = platforms.getApi();

api.onMessage("bgDo", function(request, tab) {
    alert("Doing something in the Background");
});

api.onClick(function(tab) {
    api.sendMessage(tab, "csDo");
});

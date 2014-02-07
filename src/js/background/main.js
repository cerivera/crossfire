var api = require('./api.js').api.get();

api.onMessage("bgDo", function(request, tab) {
   // TODO store something in cache?
});

api.onClick(function(tab) {
    // TODO send cached data
    api.sendMessage(tab, "csDo");
});
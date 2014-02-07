var platforms = require('./platforms.js').platforms;

var api = platforms.getApi();

api.onMessage("bgDo", function(request, tab) {
   // TODO store something in cache?
});

api.onClick(function(tab) {
    // TODO send cached data
    api.sendMessage(tab, "csDo");
});
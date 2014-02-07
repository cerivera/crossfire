var api = require('./api.js').api.get();

api.onMessage("csDo", function(request) {
    // TODO spit out cached data
    alert("Content Script");
    setTimeout(function() {
        api.sendMessage("bgDo");
    }, 2000);
});
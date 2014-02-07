var platforms = require('./platforms.js').platforms;

var api = platforms.getApi();

api.onMessage("csDo", function(request) {
    alert("Content Script");
    setTimeout(function() {
        api.sendMessage("bgDo");
    }, 2000);
});
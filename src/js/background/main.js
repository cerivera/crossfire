var api = require('./api.js').api.get();
var storage = require('./storage.js').storage.get();

api.onClick(function(tab) {
    api.sendMessage(tab, 'incCounter', {
        counter: parseInt(storage.get('counter')) || 0
    });
});

api.onMessage('storeCounter', function(request, tab) {
    storage.set('counter', request.counter);
});

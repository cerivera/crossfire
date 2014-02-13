var api = require('./api.js').api.get();

api.onMessage('incCounter', function(request) {
    var counter = (request.counter || 0) + 1;
    alert('counter: ' + counter);
    api.sendMessage('storeCounter', {counter: counter});
});
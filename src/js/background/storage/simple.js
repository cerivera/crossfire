var SimpleStorage = function() {
    var storage = require("sdk/simple-storage").storage;

    this.set = function(key, val) {
        return storage[key] = val;
    };

    this.get = function(key) {
        return storage[key];
    }
};

exports.SimpleStorage = SimpleStorage;
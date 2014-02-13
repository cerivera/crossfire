var LocalStorage = function() {
    this.set = function(key, val) {
        return localStorage.setItem(key, val);
    };

    this.get = function(key) {
        return localStorage.getItem(key);
    };
};

exports.LocalStorage = LocalStorage;
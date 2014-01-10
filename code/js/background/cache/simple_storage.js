var ss = require("sdk/simple-storage");

var Storage = {
    get : function(key) {
        return ss.storage[key];
    },
    set : function(key, data) {
        ss.storage[key] = data;
    }
}

//Makes this accessible for whatever files require it
exports.Storage = Storage;

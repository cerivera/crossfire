var Storage = {
    get : function(key) {
        return localStorage.getItem(key);
    },
    set : function(key, data) {
        return localStorage.setItem(key, data);
    }
};
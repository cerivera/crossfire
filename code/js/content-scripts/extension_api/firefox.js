// API sepific to the platform the extension lives on.  Mainly used to communicate with Background world. 
var ExtensionApi = (function() {
    return {
        sendMessage : function(name, data) {
            data = data || {};
            data[name] = true;
            data.msg = name;
            self.port.emit(name, data);
        },
        onMessage : function(msg, callback) {
            self.port.on(msg, function(request) {
                if (!_dataUrl && request.data_url) {
                    _dataUrl = request.data_url;
                }
                callback(request);
            });
        }
    };
})();

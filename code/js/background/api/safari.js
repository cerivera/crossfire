function SafariApi() {
   var callbacks = {};

    safari.application.activeBrowserWindow.addEventListener("message", function(msg) {
        if (msg.name != "fromInjected") {
            return;
        }
        var request = msg.message;
        if (callbacks[request.msg]) {
            callbacks[request.msg](request, safari.application.activeBrowserWindow.activeTab);
        }
    });

    this.onMessage = function(msg, callback) {
        callbacks[msg] = callback;
    };
}

SafariApi.prototype.sendMessage = function(tab, msg, data) {
    data = data || {};
    data.msg = msg;
    safari.application.activeBrowserWindow.activeTab.page.dispatchMessage("fromGlobal", data);
};

SafariApi.prototype.onClick = function(callback) {
    safari.application.addEventListener("command", function(event){
        if (event.command === "start_command") {
            callback(safari.application.activeBrowserWindow.activeTab);
        }
    }, false);
};

SafariApi.prototype.getCurrentTab = function(callback) {
    callback(safari.application.activeBrowserWindow.activeTab);
};

SafariApi.prototype.enableIcon = function(tab) {
    safari.extension.toolbarItems[0].disabled = false;
};

SafariApi.prototype.disableIcon = function(tab) {
    safari.extension.toolbarItems[0].disabled = true;
};

exports.SafariApi = SafariApi;
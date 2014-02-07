
function FirefoxApi() {
    var self = this;
    var constants = require('../constants').constants;
    var tabs = require("sdk/tabs");
    var selfData = require("sdk/self").data;
    var widgets = require("sdk/widget");
    var onClickFn = null;
    var onReadyFn = null;
    var workers = {};
    var contentScripts = [selfData.url("js/bundle.js")];
    var cssScripts = [];
    var listeners = {};

    function attachListeners(worker) {
        var keys = Object.keys(listeners);
        for(var i = 0; i < keys.length; i++) {
            var callback = listeners[keys[i]];
            var msg = keys[i];
            worker.port.on(msg, function(request, sender) {
                callback(request, worker.tab);
            });
        }
    }

    var widget = widgets.Widget({
      id: constants.codename,
      label: constants.label,
      contentURL: selfData.url('images/icons/default/32x32.png'),
      onClick: function() {
        if (typeof onClickFn === "function") {
            self.getCurrentTab(onClickFn);
        }
      }
    });

    // Get this going to start collecting workers
    require("sdk/page-mod").PageMod({
        include : ['*'],
        contentScriptWhen: "start",
        attachTo: ['top'],
        onAttach: function(worker) {
            if (worker.tab) {
                workers[worker.tab.id] = worker;
            }
        }
    });

    require("sdk/page-mod").PageMod({
        include: ['*'],
        contentScriptFile: contentScripts,
        contentStyleFile: cssScripts,
        attachTo: ['top'],
        onAttach: function(worker) {
            // Ready message that gets fired by all windows (including iframes) whenever it's ready.
            workers[worker.tab.id] = worker;
            worker.tab.attach({contentScriptFile: contentScripts, contentStyleFile: cssScripts});
            attachListeners(worker);
            if (typeof onReadyFn === "undefined") {
                onReadyFn(worker.tab);
            }
        }
    });


    this.sendMessage = function(tab, msg, data) {
        data = data || {};
        data.data_url = selfData.url('');
        workers[tab.id].port.emit(msg, data);
    };

    this.onMessage = function(msg, callback) {
        listeners[msg] = callback;
    };

    this.getCurrentTab = function(callback) {
        callback(tabs.activeTab);
    };

    this.onClick = function(callback) {
        onClickFn = callback;
    };

    this.onTabReady = function(callback) {
        onReadyFn = callback;
    };

    this.enableIcon = function(tab) {
        widget.contentURL = selfData.url("images/icons/default/32x32.png");
    };

    this.disableIcon = function(tab) {
        widget.contentURL = selfData.url("images/icons/default/disabled-32x32.png");
    };
}

exports.FirefoxApi = FirefoxApi;
function FirefoxApi() {
    var self = this;

    var _toolbar = require("../lib/firefox/toolbarbutton");
    var _tabs = require("sdk/tabs");
    var _self = require("sdk/self");
    var _data = _self.data;
    var _onClickCallback = null;
    var _workers = {};

    var _contentScripts = [
        _data.url("js/bundle.js")];
    
    var _cssScripts = [];

    var _listeners = {};

    function _attachListeners(worker) {
        var keys = Object.keys(_listeners);
        for(var i = 0; i < keys.length; i++) {
            var callback = _listeners[keys[i]];
            var msg = keys[i];
            worker.port.on(msg, function(request, sender) {
                callback(request, worker.tab);
            });
        }
    }

    var _tbb = _toolbar.ToolbarButton({
        id: "myapp-button",
        label: "My App",
        image: _data.url("images/icons/default/32x32.png"),
        onCommand: function(){
            if (typeof _onClickCallback === "function") {
                self.getCurrentTab(_onClickCallback);
            }
        }
    });

    _tbb.moveTo({toolbarID:"nav-bar", forceMove:false});


    // Get this going to start collecting workers
    require("sdk/page-mod").PageMod({
        include : ['*'],
        contentScriptWhen: "start",
        attachTo: ['top'],
        onAttach: function(worker) {
            if (worker.tab) {
                _workers[worker.tab.id] = worker;
            }
        }
    });

    require("sdk/page-mod").PageMod({
        include: ['*'],
        contentScriptFile: _contentScripts,
        contentStyleFile: _cssScripts,
        attachTo: ['top'],
        onAttach: function(worker) {
            // Ready message that gets fired by all windows (including iframes) whenever it's ready.
            _workers[worker.tab.id] = worker;
            worker.tab.attach({contentScriptFile: _contentScripts, contentStyleFile: _cssScripts});
            _attachListeners(worker);
            if (typeof _onTabReadyCallback === "undefined") {
                _onTabReadyCallback(worker.tab);
            }
        }
    });


    this.sendMessage = function(tab, msg, data) {
        data = data || {};
        data.data_url = _data.url('');
        _workers[tab.id].port.emit(msg, data);
    };

    this.onMessage = function(msg, callback) {
        _listeners[msg] = callback;
    };

    this.getCurrentTab = function(callback) {
        callback(_tabs.activeTab);
    };

    this.onClick = function(callback) {
        _onClickCallback = callback;
    };

    this.enableIcon = function(tab) {
        _tbb.image = _data.url("images/icons/default/32x32.png");
    };

    this.disableIcon = function(tab) {
        _tbb.image = _data.url("images/icons/default/disabled-32x32.png");
    };
}

exports.FirefoxApi = FirefoxApi;
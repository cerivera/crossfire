var ExtensionApi = (function() {
    var _ = require("../lib/underscore");
    var _tabs = require("sdk/tabs");
    var _self = require("sdk/self");
    var _data = _self.data;
    var _onClickCallback = null;
    var _workers = {};

    var _commonScripts = [
        _data.url("js/lib/underscore.js"),
        _data.url("js/lib/extend.js"),
        _data.url("js/constants.js"),
        _data.url("js/extension_api/firefox.js"),
        _data.url("js/app.js")];
    
    var _cssScripts = [
        _data.url("css/firefox.css")];


    _listeners = {};

    function _attachListeners(worker) {
        _.each(_listeners, function(callback, msg, list) {
            worker.port.on(msg, function(request, sender) {
                callback(request, worker.tab);
            });
        });
    }

    var _tbb = _toolbar.ToolbarButton({
        id: "oneid-button",
        label: "OneID QuickFill",
        image: _data.url("images/icons/icon-enabled-32.png"),
        onCommand: function(){
            if (_.isFunction(_onClickCallback)) {
                ExtensionApi.getCurrentTab(_onClickCallback);
            }
        },
        panel: popup
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
        contentScriptFile: _commonScripts,
        contentStyleFile: _cssScripts,
        attachTo: ['top'],
        onAttach: function(worker) {
            // Ready message that gets fired by all windows (including iframes) whenever it's ready.
            _workers[worker.tab.id] = worker;
            worker.tab.attach({contentScriptFile: _commonScripts, contentStyleFile: _cssScripts});
            _attachListeners(worker);
            if (_.isFunction(_onTabReadyCallback)) {
                _onTabReadyCallback(worker.tab);
            }
        }
    });

    return {
        // Sends message to CS
        sendMessage : function(tab, msg, data) {
            data = data || {};
            data.data_url = _data.url('');
            _workers[tab.id].port.emit(msg, data);
        },
        
        // Listens to messages from CS
        onMessage : function(msg, callback) {
            _listeners[msg] = callback;
        },

        getCurrentTab : function (callback) {
            callback(_tabs.activeTab);
        },

        // Setups up listener for icon click.  Sends current tab to callback.
        onClick : function(callback) {
            _onClickCallback = callback;
        },

        enableIcon : function(tab) {
            _tbb.image = _data.url("images/icons/icon-enabled-32.png");
        },

        disableIcon : function(tab) {
            _tbb.image = _data.url("images/icons/icon-disabled-32.png");
        }
    };
})();

exports.ExtensionApi = ExtensionApi;

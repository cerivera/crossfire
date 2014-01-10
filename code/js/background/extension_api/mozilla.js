if (typeof require !== 'undefined') {
    var _ = require("../lib/underscore");
    var Logger = require("../logger").Logger;
}

var ExtensionApi = (function() {
    var _tabs = require("sdk/tabs");
    var _self = require("sdk/self");
    var _data = _self.data;
    var _sp = require("sdk/simple-prefs");
    var _timers = require("sdk/timers");
    var _options = _sp.prefs;
    var _toolbar = require("../lib/mozilla/toolbarbutton.oneid");
    var _panel = require("sdk/panel");
    var _onClickCallback = null;
    var _onTabReadyCallback = null;
    var _workers = {};

    var _commonScripts = [
        _data.url("js/lib/jquery.js"),
        _data.url("js/lib/bean.js"),
        _data.url("js/lib/underscore.js"),
        _data.url("js/lib/jquery-ext.js"),
        _data.url("js/lib/oneid.js"),
        _data.url("js/lib/extend.js"),
        _data.url("js/constants.js"),
        _data.url("js/logger.js"),
        // _data.url("js/lib/jquery-ui.js"),
        _data.url("js/lib/mutation-summary.js"),
        _data.url("js/lib/jquery.mutation-summary.js"),
        _data.url("js/lib/visibility.js"),
        _data.url("js/mapping/tiles.js"),
        _data.url("js/mapping/dragdrop.js"),
        _data.url("js/mapping/active_form.js"),
        _data.url("js/extension_api/mozilla.js"),
        _data.url("js/draw/dropdown.js"),
        _data.url("js/draw/fill_animation.js"),
        _data.url("js/draw/note.js"),
        _data.url("js/draw/notifications.js"),
        _data.url("js/draw/sidebar.js"),
        _data.url("js/sites/rules.js"),
        _data.url("js/util.js"),
        _data.url("js/app.js"),
        _data.url("js/analytics.js"),
        _data.url("js/pwm.js")];
    
    var _cssScripts = [
        _data.url("css/mozilla.css")];


    _listeners = {};

    function _attachListeners(worker) {
        _.each(_listeners, function(callback, msg, list) {
            worker.port.on(msg, function(request, sender) {
                callback(request, worker.tab);
            });
        });
    }

    var popup = require("sdk/panel").Panel({
      width: 191,
      height: 140,
      contentURL: _data.url("templates/popup.html"),
      contentScriptFile: [_data.url("js/lib/jquery.js"), _data.url("js/popup.js")],
      onHide: function() {
        popup.port.emit('popup-hide');
      },
      onShow: function() {
        popup.port.emit('popup-show');
      }
    });
    _.each([
        'popup-fill',
        'popup-dashboard',
        'popup-feedback'
    ], function(_event) {
        popup.port.on(_event, function() {
            _listeners[_event]();
        })
    })
    popup.port.on('popup-hide', function() {
        popup.hide()
    })
    popup.port.on('popup-resize', function(dim) {
        popup.resize(dim.w, dim.h);
    })


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

    //This seems to run once per activation, which is good
    //Keep an eye on it just to be sure
    _tbb.moveTo({toolbarID:"nav-bar", forceMove:false});

    /** Not sure what happened to exports.main, but this doesn't work
    exports.main = function(settings, callbacks){
        _tbb.moveTo({
            toolbarID: "nav-bar",
            forceMove: false // don't move if button is already in the window
        });
    };
    */

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
            //TODO: Throw an error here if data is empty? That should only happen while in PWM mode only.
            data = data || {};
            data.data_url = _data.url('');
            _workers[tab.id].port.emit(msg, data);
/*
            else {
                Logger.log("Can't send message " + msg + " to a closed tab.");
            }
*/
        },
        
        // Listens to messages from CS
        onMessage : function(msg, callback) {
            _listeners[msg] = callback;
        },

        setInterval : function(callback, ms) {
            return _timers.setInterval(callback, ms);
        },

        clearInterval : function(id) {
            _timers.clearInterval(id);
        },
        
        setTimeout : function(callback, ms) {
            return _timers.setTimeout(callback, ms);
        }, 

        clearTimeout : function(id) {
            _timers.clearTimeout(id);
        },

        // Setups up listener for icon click.  Sends current tab to callback.
        // onClick : function(callback) {
        //     _onClickCallback = callback;
        // },

        // getVersion : function() {
        //     return _self.version;
        // },

        onUpdated : function(callback) {
            if (require('sdk/self').loadReason != 'upgrade') return;
            setTimeout(callback, 10000) // 10 secs into browsing
        },

        onTabReady : function(callback) {
            _onTabReadyCallback = callback;
        },

        onTabClosed : function(tab, callback) {
            tab.on('close', function(closedTab) {
                ExtensionApi.clearTimeout(ExtensionApi.closed_timeout);
                ExtensionApi.closed_timeout = ExtensionApi.setTimeout(callback, 100);
            });
        },

        getCurrentTab : function (callback) {
            callback(_tabs.activeTab);
        },
        openLinkInNewTab : function(url) {
            _tabs.open(url);
        },
        isPageValid : function(url) {
            return url && !(url.indexOf('about:blank') == 0 || url.indexOf('about:newtab') == 0 ||
                url.indexOf('about:home') == 0 || url.indexOf('about:addons') == 0 ||
                url.indexOf('file') == 0);
        },
        enableIcon : function(tab) {
            _tbb.image = _data.url("images/icons/icon-enabled-32.png");
        },

        disableIcon : function(tab) {
            _tbb.image = _data.url("images/icons/icon-disabled-32.png");
        },

        setCaptureIcon : function(idx) {
            _tbb.image = _data.url('images/capture/capture-32-'+idx+'.png');
        },

        setFillIcon : function(idx) {
            _tbb.image = _data.url('images/fill/fill-32-'+idx+'.png');
        },
        
        addBadgeToIcon : function(tab, text, color) {
            // Do nothing.
        },

        insertSpritesIntoTab : function(tab) {
            tab.attach({contentStyle:
                'div.ocrx-sprite { '+
                    'background: url(' + _data.url("images/sprite.png") + ') no-repeat top left !important;' +
                '}' + 
                'div.ocrx-sidebar, div#ocrx-sidebar-footer {' +
                    'background: url(' + _data.url("images/sidebar-bg.png") + ');' +
                '}'});
        }
    };
})();

if (typeof require !== 'undefined') {
    exports.ExtensionApi = ExtensionApi;
}

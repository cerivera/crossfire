// Functions specific to each extension.  Used to communicate with CS and listen for tab events.
var ExtensionApi = (function() {
    var _listenerInitialized = false;
    var _listenerCallbacks = {};

    function _initListener() {
        safari.application.activeBrowserWindow.addEventListener("message", _listener);
        _listenerInitialized = true;
    }

    function _listener(msgEvent) {
        if (msgEvent.name != "fromInjected") {
            return;
        }

        var request = msgEvent.message;
        if (_listenerCallbacks[request.msg]) {
            var tab = safari.application.activeBrowserWindow.activeTab;
            _listenerCallbacks[request.msg](request, tab);
        }
    }

    return {
        // Sends message to CS
        sendMessage : function(tab, msg, data) {
            data = data || {};
            data.msg = msg;
            safari.application.activeBrowserWindow.activeTab.page.dispatchMessage("fromGlobal", data);
        },

        // Listens to messages from CS
        onMessage : function(msg, callback) {
            _listenerCallbacks[msg] = callback;
            if (!_listenerInitialized) {
                _initListener();
            }
        },

        setInterval : function(callback, ms) {
            return setInterval(callback, ms);
        },

        clearInterval : function(id) {
            clearInterval(id);
        },

        setTimeout : function(callback, ms) {
            return setTimeout(callback, ms);
        },

        clearTimeout : function(id) {
            clearTimeout(id);
        },

        // Setups up listener for icon click.  Sends current tab to callback.
        // onClick : function(callback) {
        //     safari.application.addEventListener("command", function(event){
        //         if (event.command === "start_command") {
        //             var tab = safari.application.activeBrowserWindow.activeTab;
        //             callback(tab);
        //         }
        //     }, false);
        // },

        getVersion : function() {
            return safari.extension.displayVersion;
        },

/*  To be deleted
        onUpdateAvailable : function(callback) {
            function _readUpdateFile(xml_doc) {
                return $(xml_doc).find('key:contains(CFBundleVersion)').next().text()
            }
            function _checkVersion() {
                $.ajax({
                    type: 'GET',
                    url: Constants.STENCIL_SERVER+'/public/safari/update.plist',
                    dataType: 'xml',
                    success: function(xml_doc) {
                        callback(_readUpdateFile(xml_doc));
                    }
                })
            }
            ExtensionApi.setInterval(_checkVersion, 86400000) // 24 hours
            ExtensionApi.setTimeout(_checkVersion, 30000) // 30 secs into browsing
        },
*/

        onUpdated : function(callback) {
            if (!Util.isUpgrade()) return;
            setTimeout(callback, 10000) // 10 secs into browsing
        },
        
        onTabReady : function(callback) {
            var tab = safari.application.activeBrowserWindow.activeTab;
            
            safari.application.activeBrowserWindow.addEventListener('open', function(tabEvent) {
                callback(tab);    
            }, true);

            safari.application.activeBrowserWindow.addEventListener('navigate', function(tabEvent) {
                callback(tab);    
            }, true);

            safari.application.activeBrowserWindow.addEventListener('activate', function(tabEvent) {
                callback(tab);
            }, true);
        },

        onTabLoading : function(callback) {
            // TODO
        },

        onTabClosed : function(tab, callback) {
            // TODO: test this a lot, since I'm not 100% on safari api
            safari.application.activeBrowserWindow.addEventListener('close', function(tabEvent) {
                var closedTab = tabEvent.target.activeTab;
                if (tab.id == closedTab.id) {
                    ExtensionApi.clearTimeout(ExtensionApi.closed_timeout);
                    ExtensionApi.closed_timeout = ExtensionApit.setTimeout(callback, 100);
                }
            }, true);
        },

        getCurrentTab : function(callback) {
            callback(safari.application.activeBrowserWindow.activeTab);
        },

        openLinkInNewTab : function(url) {
            safari.application.activeBrowserWindow.openTab().url = url;
        },
        isPageValid : function(url) {
            return url && !(url.indexOf('file') == 0);
        },
        enableIcon : function(tab) {
            safari.extension.toolbarItems[0].disabled = false;
        },
        disableIcon : function(tab) {
            safari.extension.toolbarItems[0].disabled = true;
        },
        setCaptureIcon: function(idx) {
            safari.extension.toolbarItems[0].image = safari.extension.baseURI + 'images/capture/capture-32-'+idx+'.png';
        },
        setFillIcon: function(idx) {
            safari.extension.toolbarItems[0].image = safari.extension.baseURI + 'images/fill/fill-32-'+idx+'.png';
        },

        addBadgeToIcon : function() {
            // do nothing for safari
        },

        insertSpritesIntoTab : function() {
            // do nothing for safari
        },
        processForm : function(tab) {
            ExtensionApi.sendMessage(tab, "fill-form");
        }
    };
})();

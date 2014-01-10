// Functions specific to each extension.  Used to communicate with CS and listen for tab events.
var ExtensionApi = (function() {
    var _listenerInitialized = false;
    var _listenerCallbacks = {};
    var _tabLoadingCallback = undefined;
    var _tabReadyCallback = undefined;

    function _initListener() {
        chrome.extension.onMessage.addListener(_listener);
        _listenerInitialized = true;
    }

    function _listener(request, sender, sendResponse) {
        if (_listenerCallbacks[request.msg]) {
            _listenerCallbacks[request.msg](request, sender.tab);
            sendResponse({});
        }
    }

    // start tab loading
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
        if (changeInfo.status == "complete") {
            if (_tabReadyCallback) {
                _tabReadyCallback(tab);
            }
        } else if (changeInfo.status == "loading") {
            if (_tabLoadingCallback) {
                _tabLoadingCallback(tab);
            }
        }

    });

    return {
        // Sends message to CS
        sendMessage : function(tab, msg, data) {
            data = data || {};
            data.msg = msg;
            chrome.tabs.sendMessage(tab.id, data);
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
        //     chrome.browserAction.onClicked.addListener(function(tab) {
        //         callback(tab);
        //     });
        // },

        // getVersion : function() {
        //     return chrome.app.getDetails().version;
        // },

        onUpdateAvailable : function(callback) {
            chrome.runtime.onUpdateAvailable.addListener(callback);
        },

        onUpdated : function(callback) {
            chrome.runtime.onInstalled.addListener(function(details) {
                if (details.reason != 'update') return;
                callback();
            })
        },

        onTabReady : function(callback) {
            _tabReadyCallback = callback;
        },

        onTabLoading : function(callback) {
            _tabLoadingCallback = callback;
        },
        
        onTabClosed : function(tab, callback) {
            chrome.tabs.onRemoved.addListener(function(closedTabId) {
                if (closedTabId == tab.id) {
                    ExtensionApi.clearTimeout(ExtensionApi.closed_timeout);
                    ExtensionApi.closed_timeout = ExtensionApi.setTimeout(callback, 100);
                }
            });
        },

        getCurrentTab : function (callback) {
            chrome.tabs.query({"active":true, "currentWindow": true}, function(tabs) {
                callback(tabs[0]);
            });
        },
        openLinkInNewTab : function(url) {
            window.open(url, "_blank");
            window.focus();
        },
        isPageValid : function(url) {
            return url && !(url.indexOf('chrome') == 0 || url.indexOf('https://chrome.google.com/extensions') == 0 || url.indexOf('file') == 0);
        },
        enableIcon : function(tab) {
            chrome.browserAction.enable(tab.id);
        },
        disableIcon : function(tab) {
            chrome.browserAction.disable(tab.id);
        },
        setCaptureIcon: function(idx) {
            chrome.browserAction.setIcon({
                path: {
                    '19': chrome.runtime.getURL('images/capture/capture-19-'+idx+'.png'),
                    '38': chrome.runtime.getURL('images/capture/capture-38-'+idx+'.png')
                }
            });
        },
        setFillIcon: function(idx) {
            chrome.browserAction.setIcon({
                path: {
                    '19': chrome.runtime.getURL('images/fill/fill-19-'+idx+'.png'),
                    '38': chrome.runtime.getURL('images/fill/fill-38-'+idx+'.png')
                }
            });
        },
        
        addBadgeToIcon : function(tab, text, color) {
            chrome.browserAction.setBadgeBackgroundColor({tabId:tab.id, color: color});
            chrome.browserAction.setBadgeText({tabId:tab.id, text: text});
        },

        insertSpritesIntoTab : function(tab) {
            chrome.tabs.insertCSS(tab.id, {code: 
                'div.ocrx-sprite { ' +
                    'background: url(' + chrome.extension.getURL("images/sprite.png") + ') no-repeat top left;' +
                '}' +
                'div.ocrx-sidebar, div#ocrx-sidebar-footer {' +
                    'background: url(' + chrome.extension.getURL("images/sidebar-bg.png") + ');' +
                '}'});
        }
    };
})();

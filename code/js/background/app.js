if (typeof require !== 'undefined') {
    var Logger = require("./logger.js").Logger;
    var ExtensionApi = require("./extension_api/mozilla.js").ExtensionApi;
    var Cache = require("./cache/cache.js").Cache;
    var Stencil = require("./sites/stencil.js").Stencil;
    var Constants = require("./constants.js").Constants;
    var SiteRules = require("./sites/rules.js").SiteRules;
    var _ = require("./lib/underscore");
    var Util = require("./util").Util;
}

var App = (function() {
    var _cachedCreds;
    var _cachedUsername;
    var _domainFilled;
    var _pageLoadHit;

    function _setupListeners() {
        ExtensionApi.onMessage("page-loading", function(request, tab) {
            _pageLoadHit = true;
            tab = tab || {};
            Stencil.fetchSiteRules(request.hostname, function(siteRules) {
                SiteRules.set(siteRules);
                if (SiteRules.isSupported(request.hostname) && ExtensionApi.isPageValid(tab.url)) {
                    Util.getUserId(function(userId) {
                        ExtensionApi.sendMessage(tab, "bg-ready", {
                            site_rules : siteRules,
                            cached_creds : _cachedCreds,
                            cached_username : _cachedUsername,
                            login_domain : _domainFilled,
                            user_id : userId
                        });
                    });
                } else {
                    _markSiteAsUnsupported(tab);
                }
            });
        });

        ExtensionApi.onMessage("page-ready", function(request, tab) {
            ExtensionApi.insertSpritesIntoTab(tab);
            if (request.has_bad_fields === true) {
                _markSiteAsSemiSupported(tab); // missing function
            }

            Stencil.fetchMastersForSite(request.hostname, function() {
                if (Cache.getStencilByFormHash(request.hostname, request.form_hash)) {
                    _markSiteAsSupported(tab); // missing function
                }
            });
        });
        
        ExtensionApi.onMessage("iframe-loading", function(request, tab) {
            if (SiteRules.isSupported(Util.getHostnameFromUrl(tab.url))) {
                ExtensionApi.sendMessage(tab, "iframe-continue", {
                    cached_username : _cachedUsername,
                    site_rules : SiteRules.getAll()
                });
            }
        });

        ExtensionApi.onMessage("iframe-ready", function(request, tab) {
            if (SiteRules.isSupported(Util.getHostnameFromUrl(tab.url))) {
                _markSiteAsSemiSupported(tab);
            }
        });

        ExtensionApi.onMessage("save-new-stencil", function(request, tab) {
            Util.getUserId(function(userId) {
                request.user_hash = userId;
                Stencil.save(request);
            });
        });

        ExtensionApi.onMessage("query-stencil", function(request, tab) {
            var formHash = request.hash;
            if (!formHash) {
                ExtensionApi.sendMessage(tab, "queried-stencil", {stencil: "", hash: formHash});
                return;
            }
            
            var hostname = request.hostname;
            // check cache first.
            var stencil = Cache.getStencilByFormHash(hostname, formHash);
            if (stencil) {
                ExtensionApi.sendMessage(tab, "queried-stencil", {stencil: stencil, hash: formHash});
            } else {
                Util.getUserId(function(userId) {
                    // search server using form hash, userid and domain
                    Stencil.fetchBroad(hostname, formHash, userId, function() {
                        stencil = Cache.getStencilByFormHash(hostname, formHash);
                        ExtensionApi.sendMessage(tab, "queried-stencil", {stencil: stencil, hash: formHash});
                    });
                });
            }
        });

        ExtensionApi.onMessage("open-link", function(request, tab) {
            ExtensionApi.openLinkInNewTab(request.url);
        });

        // PASSWORD MODE STUFF
        ExtensionApi.onMessage("cache-creds", function(request, tab) {
            _cachedCreds = request;
            ExtensionApi.onTabClosed(tab, function() {
                if (_cachedCreds) {
                    ExtensionApi.setTimeout(function() {
                        // Could have been a popup tab where window closes after successful login.
                        _sendMessageToCurrentTab("save-pw", {cached_creds : _cachedCreds});
                    }, 1000);
                }
            });
        });
        
        ExtensionApi.onMessage("clear-cached-creds", function(request, tab) {
            _cachedCreds = null;
        });

        ExtensionApi.onMessage("cache-username", function(request, tab) {
            _cachedUsername = request;
        });

        ExtensionApi.onMessage("clear-cached-username", function(request, tab) {
            _cachedUsername = null;
        });

        ExtensionApi.onMessage("filled-pw-form", function(request, tab) {
            _domainFilled = request.domain;
        });

        ExtensionApi.onMessage("clear-send-success", function(request, tab) {
            _domainFilled = "";
        });

        // most recently used usernames in multiaccount dropdown
        ExtensionApi.onMessage("password-chosen", function(data, tab) {
            Cache.setPasswordChosen(data.domain, data.card_id);
        });

        ExtensionApi.onMessage("password-getOrder", function(data, tab) {
            data.ordered = Cache.getPasswordOrder(data.domain);
            ExtensionApi.sendMessage(tab, "password-getOrder", data);
        });

        ExtensionApi.onMessage("capturing-iframe-closed", function(data, tab) {
            _pageLoadHit = false;
            ExtensionApi.setTimeout(function() {
                if (!_pageLoadHit && _cachedCreds) {
                    ExtensionApi.sendMessage(tab, "save-pw", {cached_creds : _cachedCreds});
                }
            }, 1000);
        });

        // Tab done loading
        ExtensionApi.onTabReady(function(tab) {
            ExtensionApi.enableIcon(tab);
        });
   
        // Firefox popup messaging
        ExtensionApi.onMessage("popup-fill", function() {
            _public.fill()
        });
        ExtensionApi.onMessage("popup-dashboard", function() {
            _public.dashboard()
        });

        // Notification messaging. Using this in case site is using framesets
        ExtensionApi.onMessage("notes-filled", function(data, tab) {
            ExtensionApi.sendMessage(tab, "notes-filled");
        });

        ExtensionApi.onMessage("notes-filled-pw", function(data, tab) {
            ExtensionApi.sendMessage(tab, "notes-filled-pw");
        });
        ExtensionApi.onMessage("notes-filled-uname", function(data, tab) {
            ExtensionApi.sendMessage(tab, "notes-filled-uname");
        });
        ExtensionApi.onMessage("notes-updated", function(data, tab) {
            ExtensionApi.sendMessage(tab, "notes-updated", data);
        });
        ExtensionApi.onMessage("notes-saved", function(data, tab) {
            ExtensionApi.sendMessage(tab, "notes-saved", data);
        });
        ExtensionApi.onMessage("notes-match", function(data, tab) {
            ExtensionApi.sendMessage(tab, "notes-match");
        });
        ExtensionApi.onMessage("notes-prediction", function(data, tab) {
            ExtensionApi.sendMessage(tab, "notes-prediction");
        });

        // Extension updates
        Stencil.onUpdateAvailable();
        ExtensionApi.onMessage("update-file", function(data, tab) {
            _sendMessageToCurrentTab("updateAvailable");
        });

        ExtensionApi.onUpdated(function() {
            _sendMessageToCurrentTab("updated");
        });
    }

    function _firstUse() {
        ExtensionApi.openLinkInNewTab(Constants.STENCIL_SERVER + "/welcome/");
    }

    function _markSiteAsSupported(tab) {
        ExtensionApi.insertSpritesIntoTab(tab);
        if(Cache.getOptionValue('ocrx-remind')) {
            ExtensionApi.sendMessage(tab, "has-master-stencil");
        }
        _addSupportedBadge(tab);
    }

    function _markSiteAsUnsupported(tab) {
        ExtensionApi.disableIcon(tab);
    }

    function _markSiteAsSemiSupported(tab) {
        _addSemiSupportedBadge(tab);
    }
    
    function _addSemiSupportedBadge(tab) {
        ExtensionApi.addBadgeToIcon(tab, Constants.BADGES.SEMI_SUPPORTED.TEXT, Constants.BADGES.SEMI_SUPPORTED.COLOR);
    }

    function _addSupportedBadge(tab) {
        ExtensionApi.addBadgeToIcon(tab, Constants.BADGES.SUPPORTED.TEXT, Constants.BADGES.SUPPORTED.COLOR);
    }

    function _addUnsupportedBadge(tab) {
        ExtensionApi.addBadgeToIcon(tab, Constants.BADGES.UNSUPPORTED.TEXT, Constants.BADGES.UNSUPPORTED.COLOR);
    }

    // TODO this needs to be in some sort of Abstract method for ExtensionAPI
    function _sendMessageToCurrentTab(msg, data) {
        data = data || {};
        ExtensionApi.getCurrentTab(function(tab) {
            ExtensionApi.sendMessage(tab, msg, data);
        });
    }

    function _iconCaptureAnimate() {
        var f = 0;
        var interval = ExtensionApi.setInterval(function() {
            ExtensionApi.setCaptureIcon(f);
            if (f >= 48) {
                ExtensionApi.clearInterval(interval);
            }
            f+=1;
        }, 2000 / 48);
    }

    function _iconFillAnimate() {
        var f = 0;
        var interval = ExtensionApi.setInterval(function() {
            ExtensionApi.setFillIcon(f);
            if (f >= 48) {
                ExtensionApi.clearInterval(interval);
            }
            f+=1;
        }, 2000 / 48);
    }

    var _public = {
        init : function(options) {
            _.extend(this, options);
            Cache.init();
            Util.getUserId(function(userId, isNew) {
                if (isNew) {
                    _firstUse();
                    if (typeof window != "undefined" && window.Sync) {
                        Sync.setUserId(userId);
                    }
                }
            });
            _setupListeners();
        },

        fill : function() {
            ExtensionApi.getCurrentTab(function(tab) {
                if (SiteRules.isSupported(Util.getHostnameFromUrl(tab.url)) && ExtensionApi.isPageValid(tab.url) ) {
                    _iconFillAnimate();
                    ExtensionApi.sendMessage(tab, "fill-form");
                } else {
                    Logger.log("Page not supported");
                }
            });
        },

        pw : function() {
            ExtensionApi.getCurrentTab(function(tab) {
                if (SiteRules.isSupported(Util.getHostnameFromUrl(tab.url)) && ExtensionApi.isPageValid(tab.url) ) {
                    _iconFillAnimate();
                    ExtensionApi.sendMessage(tab, "fill-pw");
                } else {
                    Logger.log("Page not supported");
                }
            });
        },

        dashboard : function() {
            ExtensionApi.openLinkInNewTab(Constants.ACCOUNT_SERVER);
        }
    }

    return _public
})();

if (typeof require !== 'undefined') {
    exports.App = App;
}

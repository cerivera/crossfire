var App = (function() {
    // maps selectors to oneid tiles
    var _fieldMap = {};
    var _bgReady = false;
    var _pgWaiting = false;
    var _pendingCreds = null;
    var _loginDomain = "";
    var _uid = null;
    var $body, $doc, $win, win;
    var _onReadyFired = false;

    function _kill(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        return false;
    }

    function _getSize(obj){
        var size = 0, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    }

    // Reorganizes field map so that fields get filled in a specific order.
    function _prioritizeFieldMap() {
        var highPriority = [];
        var lowPriority = [];
        var tile;
        for (var field in _fieldMap) {
            tile = _fieldMap[field];
            if (Tiles[tile].high_priority) {
                highPriority.push(field);
            } else {
                lowPriority.push(field);
            }
        }

        var newFieldMap = {};
        var field;
        for (var i in highPriority) {
            field = highPriority[i];
            newFieldMap[field] = _fieldMap[field];
        }

        for (var i in lowPriority) {
            field = lowPriority[i];
            newFieldMap[field] = _fieldMap[field];
        }
        return newFieldMap;
    }

    // Messages that come from BG
    function _setupListeners() {
        if (win == win.top) {
            ExtensionApi.onMessage("bg-ready", function(request) {
                App.setBgReady();
                SiteRules.set(request.site_rules);
                
                if (request.cached_creds) {
                    _pendingCreds = request.cached_creds;
                }

                if (request.cached_username) {
                    if (Util.isCurrentDomain(request.cached_username.domain)) {
                        PWM.setCachedUsername(request.cached_username.username);
                    } else {
                        ExtensionApi.sendMessage("clear-cached-username");
                    }
                }

                if (request.login_domain) {
                    _loginDomain = request.login_domain;
                }

                if (request.user_id) {
                    _uid = request.user_id;
                }

                if (App.isPgWaiting()) {
                    _onReady();
                }
            });

            // This is only called in special cases (soundcloud)
            ExtensionApi.onMessage("save-pw", function(request) {
                PWM.savePendingCreds(request.cached_creds);
            });

            ExtensionApi.onMessage("has-master-stencil", function(request) {
                App.supportedSiteMsg();
            });

            // Extension updates
            ExtensionApi.onMessage("updateAvailable", function() {
                notes.extUpdateAvailable().show();
            })

            ExtensionApi.onMessage("updated", function() {
                notes.extUpdated().show();
            })

            ExtensionApi.onMessage("notes-filled", function() {
                notes.filledPassword().show();
            });

            ExtensionApi.onMessage("notes-filled-pw", function() {
                notes.filledPasswordOnly().show();
            });

            ExtensionApi.onMessage("notes-filled-uname", function() {
                notes.filledUsernameOnly().show();
            });

            ExtensionApi.onMessage("notes-updated", function(data) {
                notes.updatedPassword(data.data).show();
            });

            ExtensionApi.onMessage("notes-saved", function(data) {
                notes.savedNewPassword({
                    dontSave: function() {
                        PWM.api(data.data);
                    }
                }).show();
            });

            ExtensionApi.onMessage("notes-match", function() {
                notes.matchFound().show();
            });

            ExtensionApi.onMessage("notes-prediction", function() {
                notes.predictionMade().show();
            });

            ExtensionApi.onMessage("format-update", function(data) {
                var ext_version = $(data).find('key:contains(CFBundleVersion)').next().text();
                ExtensionApi.sendMessage('update-file', ext_version);
            });
        } else {
            ExtensionApi.onMessage("iframe-continue", function(request) {
                App.setBgReady();
                SiteRules.set(request.site_rules);

                if (request.cached_username) {
                    if (Util.isCurrentDomain(request.cached_username.domain)) {
                        PWM.setCachedUsername(request.cached_username.username);
                    }
                }

                if (App.isPgWaiting()) {
                    _onReady();
                }
            });
        }

        ExtensionApi.onMessage("queried-stencil", function(request) {
            ActiveForm.getHash(function(hash) {
                if (request.hash != hash) {
                    return; // This window didn't send the request.
                }

                var stencil = request.stencil;

                App.clearFieldMap();

                // found match in the server
                if (stencil) {
                    App.setFieldMap(stencil.field_map);

                    OneID.quickfill({
                        triggerEvents: SiteRules.needsTrigger(),
                        map: App.getFieldMap(),
                    }, function(data) {
                        if (data) {
                            ExtensionApi.sendMessage("notes-match");
                        }
                    })
                }
                // make a guess at fields
                else {
                    OneID.quickfill({
                        triggerEvents: SiteRules.needsTrigger(),
                        predict: true
                    }, function(data) {
                        if (data) {
                            ExtensionApi.sendMessage("notes-prediction");
                        }
                    })
                }
            });
        });

        ExtensionApi.onMessage("fill-form", function(request) {
            App.fill();
        });

        ExtensionApi.onMessage("fill-pw", function(request) {
            OneID.pw();
        });

        // trigger postMessages from OneID
        OneID.on("quickfill", function(response) {
            if(response && response.success) {
                win.postMessage("oneid-quickfill-success", win.location.href);
            }
        });
    }

    function _cacheGlobals() {
        $doc = $(document);
        $body = $($doc.get(0).body);
        win = window;
        $win = $(win);
    }

    function _onReady() {
        if (_onReadyFired) {
            return;
        } else if (win == win.top) {
            ActiveForm.getHash(_pageOnReady);
        } else {
            _iframeOnReady();
        }
        _onReadyFired = true;
    }

    // Runs once dom is ready and background is ready (bg has fetched siteRules from stencil).        
    function _pageOnReady(hash) {
        App.loading();
        ExtensionApi.sendMessage("page-ready", {
            hostname: win.location.hostname,
            form_hash: hash,
            has_bad_fields: ActiveForm.hasBadFields() 
        });

        if (_pendingCreds) {
            if (Util.isCurrentDomain(_pendingCreds.domain)) {
                // We'll save after we do a scan of the password forms on the page.
                PWM.setPendingCreds(_pendingCreds);
            } else {
                PWM.savePendingCreds(_pendingCreds, true);
            }
        }

        PWM.startDomObserver(); 
        var fieldsFound = PWM.processPage();
        if(!fieldsFound) {
            if (Util.isCurrentDomain(_loginDomain)) {
                Analytics.init({
                    'method' : 'login_success',
                    'metadata' : {
                        'returning_user' : true,
                        'extension_verison' : Constants.VERSION,
                        'distinct_id' : App.getUserId()
                    }
                });
            }
            ExtensionApi.sendMessage("clear-send-success");
        }
    }

    function _iframeOnReady() {
        setTimeout(function() {
            if (ActiveForm.getVisibleFields().length > 2) {
                ExtensionApi.sendMessage("iframe-ready");
            }

            PWM.startDomObserver(); 
            PWM.processPage();
        }, SiteRules.getIframeTimeout()); // TODO this timeout should be specified by siteRules.  Add small delay before looking for fields. 
    }

    return {
        init : function() {
            _cacheGlobals();

            if (win == win.top) {
                ExtensionApi.sendMessage("page-loading", {
                    hostname: win.location.hostname
                });
            } else if ($(window.document).height() >= 100) {
                ExtensionApi.sendMessage("iframe-loading");
            }

            $doc.ready(function() {
                if (_bgReady) {
                    _onReady();
                } else {
                    _pgWaiting = true;
                }
            });

            _setupListeners();
        },

        // Fills the form.
        fill : function() {
            ActiveForm.clearCache();
            if (ActiveForm.getVisibleFields().length < 1) {
                // Don't run if no fields exist.
                return;
            }

            App.close();
            $('.oneid-auto-filled').removeClass('oneid-auto-filled');
            ActiveForm.getHash(function(hash) {
                ExtensionApi.sendMessage("query-stencil", {hash: hash, hostname: win.location.hostname});
            });
        },

        addMapping : function(selector, tile) {
            if (!_fieldMap) {
                _fieldMap = {};
            }

            _fieldMap[selector] = tile;
        },

        clearFieldMap : function() {
            _fieldMap = {};
        },

        getFieldMap : function() {
            return _fieldMap;
        },

        setFieldMap : function(_fm) {
            _fieldMap = typeof _fm == "string" ? JSON.parse(_fm) : _fm;
        },

        clearKeyFromFieldMap : function(key) {
            if (key in _fieldMap) {
                delete _fieldMap[key];
            }
        },

        close : function() {
            $('[data-extension="ocrx"]').remove();
            App.unfreeze();
        },

        loading : function() {
            $body.attr('data-ocrx', true);
        },

        freeze : function(ev) {
            $(':not([class*="ocrx"], [id*="ocrx"])')
                .on('click focus change blur submit', _kill)
                .filter('input, button, a, input, select')
                    .addClass('oneid-disappear');
            $win.on('beforeunload', App.freezeMsg);
            $body.on('click', '.ocrx-finished', App.unfreeze);
        },

        unfreeze : function(ev) {
            $win.off('beforeunload', App.freezeMsg);
            $(':not([class*="ocrx"], [id*="ocrx"])')
                .off('click focus change blur submit', _kill)
                .removeClass('oneid-disappear ocrx-frozen');
        },

        freezeMsg : function(ev) {
            return "Hold on! OneID needs for you to confirm this mapping. Please stay on this page and click \"Looks Good\" to fill.";
        },

        supportedSiteMsg : function() {
            notes.supported({
                fill: function() {
                    App.fill();
                }
            }).show();
        },

        setBgReady : function() {
            _bgReady = true;
            if (!notes) {
                notes = new Notifications();
            }
        },

        isPgWaiting : function() {
            return _pgWaiting;
        },

        getUserId : function() {
            if (_uid) {
                return _uid;
            } else {
                return false;
            }
        }
    };
})();

App.init();

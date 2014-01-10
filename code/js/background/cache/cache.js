// For Firefox
if (typeof require !== 'undefined') {
	var ss = require("./simple_storage.js");
	var Storage = ss.Storage;

    var c = require("../constants.js");
    var Constants = c.Constants;
}

// Object used to interact with local/simple storage of the global/background world. 
// Used to cache data pulled from server, persist user options, and to store user id.
var Cache = {
    /** Options **/
    setOptionValue: function(key, value) {
        var options = Cache.getOptions();
        options[key] = value;
        Cache.setOptions(options);
    },

    getOptionValue: function(key) {
        var options = Cache.getOptions();
        return options[key];
    },

    getOptions: function() {
        var options = Storage.get("ocrx-options");
        if (!options) {
            options = {};    
        } else {
            options = JSON.parse(options);
        }

        return options;
    },

    setOptions: function(options) {
        Storage.set("ocrx-options", JSON.stringify(options));
    },


    /** Domains **/
    getDomains: function() {
        var domains = Storage.get("ocrx-domains");
        if (!domains) {
            domains = {};    
        } else {
            domains = JSON.parse(domains);
        }

        return domains;
    },

    setDomains: function(domains) {
        Storage.set("ocrx-domains", JSON.stringify(domains));
    },

    addDomain: function(domain) {
        var domains = Cache.getDomains();
        domains[domain] = true;
        Cache.setDomains(domains);
    },

    hasDomain: function(domain) {
        return Cache.getDomains()[domain];
    },

    clearDomains: function() {
        Cache.setDomains({});
    },


    /** Form Hashes **/
    getFormHashes: function() {
        var hashes = Storage.get("ocrx-form-hashes");
        if (!hashes) {
            hashes = {};    
        } else {
            hashes = JSON.parse(hashes);
        }

        return hashes;
    },

    setFormHashes: function(hashes) {
        Storage.set("ocrx-form-hashes", JSON.stringify(hashes));
    },

    addFormHash: function(hash) {
        var hashes = Cache.getFormHashes();
        hashes[hash] = true;
        Cache.setFormHashes(hashes);
    },

    hasFormHash: function(hash) {
        return Cache.getFormHashes()[hash];
    },

    clearFormHashes: function() {
        Cache.setFormHashes({});
    },

    /** Password ordering **/
    setPasswordChosen: function(domain, card_id) {
        var data = Storage.get('pworder'),
            card_ids = [];
        data = JSON.parse(data || '{}') || {};
        if (data.hasOwnProperty(domain)) {
            card_ids = data[domain];
            var cur_idx = card_ids.indexOf(card_id)
            if (cur_idx > -1) {
                card_ids.splice(cur_idx, 1)
            }
        }
        card_ids.unshift(card_id);
        data[domain] = card_ids;
        Storage.set('pworder',JSON.stringify(data));
    },

    getPasswordOrder: function(domain) {
        var data = Storage.get('pworder');
        data = JSON.parse(data || '{}') || {};
        return data.hasOwnProperty(domain) ? data[domain] : []
    },

    /** Extension Version **/
    getVersion: function() {
        return Storage.get('version');
    },
    setVersion: function(v) {
        return Storage.set('version', v);
    },


    /** User ID **/
    // Use sync.getUserId if possible
    getUserId: function(callback) {
        callback(Storage.get("ocrx-uid"));
    },

    setUserId: function(userId) {
        Storage.set("ocrx-uid", userId);
    },


    /** Stencils **/
    clearStencils: function() {
        Storage.set("ocrx-stencils", JSON.stringify({}));
    },

    addStencil: function(domain, formHash, fieldMap) {
        Cache.addStencils(domain, [{form_hash: formHash, field_map: fieldMap}]);
    },

    addStencils: function(domain, stencils) {
        if (!stencils.length) {
            return;
        }

        var stencilDict = Cache.getAllStencils();
        if (!stencilDict[domain]) {
            stencilDict[domain] = {};
        }

        for (var index in stencils) {
            var stencil = stencils[index];

            stencilDict[domain][stencil.form_hash] = stencil;
        }

        Storage.set('ocrx-stencils', JSON.stringify(stencilDict));
    },

    // query cached stencils by using form hash/signature.
    getStencilByFormHash: function(domain, formHash) {
        var domainStencils = Cache.getAllStencils()[domain];
        return formHash && domainStencils && domainStencils[formHash] ? domainStencils[formHash] : "";
    },

    getAllStencils: function() {
        var stencils = Storage.get('ocrx-stencils');
        if (!stencils) {
            stencils = {};
        } else {
            stencils = JSON.parse(stencils);
        }
        return stencils;
    },

    getStencilsForDomain: function(domain) {
        var stencilDict = Cache.getAllStencils();
        if (!stencilDict[domain]) {
            stencilDict[domain] = {};
        }
        return stencilDict[domain]
    },

    setDefaults: function() {
        for(key in Constants.SETTINGS_DEFAULTS) {
            if(Cache.getOptionValue(key) == undefined) {
                Cache.setOptionValue(key, Constants.SETTINGS_DEFAULTS[key]);
            }
        }
    },

    init: function() {
        Cache.clearDomains();
        Cache.clearFormHashes();
        Cache.clearStencils();
        Cache.setDefaults();
    }

};

if (typeof require !== 'undefined') {
	exports.Cache = Cache;
}

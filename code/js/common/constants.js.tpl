var Constants = (function() {
    return {
        VERSION : "{{ VERSION }}",
        DEBUG_MODE : {{ DEBUG_MODE }},
        STENCIL_SERVER : "{{ STENCIL_SERVER }}",
        ACCOUNT_SERVER : "{{ ACCOUNT_SERVER }}",
        API_SERVER : "{{ API_SERVER }}",
        BADGES : {
            UNSUPPORTED: {
                COLOR: "#FF0000",
                TEXT: "\u00D7"
            },
            SEMI_SUPPORTED: {
                COLOR: "#fff430",
                TEXT: "*"
            },
            SUPPORTED: {
                COLOR: "#0fad44",
                TEXT: "*"
            }
        },
        TAB_STATUS : {
            SUPPORTED : "supported",
            UNSUPPORTED: "unsupported",
            SEMI_SUPPORTED : "semi_supported"
        },
        SETTINGS_DEFAULTS : {
            'ocrx-remind' : true
        },
        FEEDBACK_ENDPOINT : "{{ STENCIL_SERVER }}/feedback/",
        FEEDBACK_SUBJECT : 'OneID Extension'
    }
})();

if (typeof require !== "undefined") {
    exports.Constants = Constants;
}

var Constants = (function() {
    return {
        VERSION : "{{ VERSION }}"
    }
})();

if (typeof require !== "undefined") {
    exports.Constants = Constants;
}

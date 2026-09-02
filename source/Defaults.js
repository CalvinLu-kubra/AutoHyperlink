/*
 * Shared default settings for AutoHyperlink, loaded as a plain global
 * (var, not const/let) before both popup.js and Hyperlink.js so it attaches
 * to the global object in each separate script context.
 */
var DEFAULTS = {
    prefixes: ["INC", "CS", "CSTASK", "PRB", "CHG", "CTASK", "KB", "REQ", "RITM"],
    linkColor: "#ff0000",
    linkStyles: ["underline", "bold"],
    // Off by default: editable fields (e.g. Gmail's compose box) are protected
    // from hyperlink insertion unless the user opts in via the Behavior tab.
    allowContentEditableLinks: false
};

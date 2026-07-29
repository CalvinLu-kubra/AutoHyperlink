/*
Hyperlink.js will scan the page for text that matches a ServiceNow catalog string.

To scan the page, it will recursively traverse through each of the childNodes in
the document.body in a DFS traversal. Once the algorithm reaches a text node,
it will scan the text inside of the text nodes for any matches to the defined regex
for ServiceNow catalog strings.

If there is a regex match, then a span will be inserted around all of the text in the
text node. The span is utilized to contain the link that will be inserted, and also
to prevent modifying the surrounding structure. A link will then be inserted around
only the text that matched the defined regex.

Prefixes and link appearance are user configurable via the popup and
persisted to chrome.storage.sync (see Defaults.js for the shared default
values).
*/

const serviceNowURL = "https://kubra.service-now.com/text_search_exact_match.do?sysparm_search=";

let prefixes = DEFAULTS.prefixes;
let linkColor = DEFAULTS.linkColor;
let linkStyles = DEFAULTS.linkStyles;
let currentRegex = null;
let settingsLoaded = false;

/**
 * Escapes regex metacharacters in a user-supplied prefix. This is the real
 * safety boundary against a malformed regex (the popup's input validation is
 * UX-only, since chrome.storage can be written to directly, bypassing it).
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Builds a global regex matching any configured prefix followed by 7 digits.
 * Returns null for an empty/missing prefix list or a construction failure,
 * rather than a regex that matches everything (new RegExp("") matches every
 * position in every string).
 */
const buildRegexFromPrefixes = (list) => {
    if (!list || list.length === 0) {
        return null;
    }

    try {
        const alternatives = list.map((prefix) => `\\b${escapeRegex(prefix)}[0-9]{7}\\b`);
        return new RegExp(alternatives.join('|'), 'g');
    } catch (err) {
        console.error('AutoHyperlink: failed to build regex from prefixes', err);
        return null;
    }
};

/**
 * Builds the inline style string applied to every inserted hyperlink from
 * the current appearance settings. linkStyles is an array of zero or more
 * of "underline"/"bold"/"italic" that can be combined freely. Every property
 * is set explicitly (including the "off" case) rather than only adding a
 * rule when a style is enabled, since otherwise the browser's default <a>
 * underline would always show through regardless of what's configured.
 */
const buildLinkStyleString = () => {
    const enabled = new Set(linkStyles || []);

    let style = `color: ${linkColor};`;
    style += ` text-decoration: ${enabled.has("underline") ? "underline" : "none"};`;
    style += ` font-weight: ${enabled.has("bold") ? "bold" : "normal"};`;
    style += ` font-style: ${enabled.has("italic") ? "italic" : "normal"};`;

    return style;
};

const main = () => {
    if (!settingsLoaded || !currentRegex) {
        return;
    }

    document.body.childNodes.forEach(node => traverseAndModify(node, currentRegex));
};

/**
 * Traverses node (and its descendants) looking for text matching re, and
 * wraps every match in a hyperlink. Skips TEXTAREA (ServiceNow uses these
 * for form inputs, and spans can't be inserted into them) and A elements
 * (so a subsequent scan never re-wraps text a previous scan already linked).
 */
const traverseAndModify = (node, re) => {
    if (!re || !node.parentNode) {
        return;
    }

    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue;
        const matches = [...text.matchAll(re)];

        if (matches.length === 0) {
            return;
        }

        const span = document.createElement('span');
        span.className = 'hyperlink-wrapper';

        let lastIndex = 0;
        matches.forEach((match) => {
            span.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));

            const hyperlink = document.createElement('a');
            hyperlink.className = 'hyperlink-text';
            hyperlink.textContent = match[0];
            hyperlink.href = serviceNowURL + encodeURIComponent(match[0]);
            hyperlink.target = "_blank";
            hyperlink.style = buildLinkStyleString();

            span.appendChild(hyperlink);
            lastIndex = match.index + match[0].length;
        });
        span.appendChild(document.createTextNode(text.slice(lastIndex)));

        node.parentNode.replaceChild(span, node);
    } else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== "TEXTAREA" && node.nodeName !== "A") {
        node.childNodes.forEach(childNode => traverseAndModify(childNode, re));
    }
};

chrome.storage.sync.get(DEFAULTS).then((items) => {
    prefixes = items.prefixes;
    linkColor = items.linkColor;
    linkStyles = items.linkStyles;
    currentRegex = buildRegexFromPrefixes(prefixes);
    settingsLoaded = true;

    main();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync') {
        return;
    }

    if (changes.prefixes) {
        prefixes = changes.prefixes.newValue;
        currentRegex = buildRegexFromPrefixes(prefixes);
        main();
    }

    if (changes.linkColor || changes.linkStyles) {
        if (changes.linkColor) {
            linkColor = changes.linkColor.newValue;
        }
        if (changes.linkStyles) {
            linkStyles = changes.linkStyles.newValue;
        }

        document.querySelectorAll('.hyperlink-text').forEach((a) => {
            a.setAttribute('style', buildLinkStyleString());
        });
    }
});

chrome.runtime.onMessage.addListener((details) => {
    if (details.message && details.message.toUpperCase() === 'CHANGE_DETECTED') {
        main();
    }
});

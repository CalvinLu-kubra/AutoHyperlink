/*
Hyperlink.js will scan the page for text that matches a ServiceNow catalog string,
or a DocWeb job ID. 

To scan the page, it will recursively traverse through each of the childNodes in
the document.body in a DFS traversal. Once the algorithm reaches a text node,
it will scan the text inside of the text nodes for any matches to the defined regexes 
for ServiceNow catalog strings and DocWeb job IDs. 

If there is a regex match, then a span will be inserted around all of the text in the
text node. The span is utilized to contain the link that will be inserted, and also
to prevent modifying the surrounding structure. A link will then be inserted around
only the text that matched the defined regexes.
*/

/**
 *  ServiceNow prefixes. These are always followed by a string of 7 numbers.
 * 
 * */
const serviceNowPrefixes = [
    "INC",
    "CS",
    "CSTASK",
    "PRB",
    "CHG",
    "CTASK",
    "KB",
    "REQ",
    "RITM"
];

const serviceNowURL = "https://kubra.service-now.com/text_search_exact_match.do?sysparm_search="

const main = () => {

    const serviceNowRegex = new RegExp(constructServiceNowRegexString());

    console.log(serviceNowRegex);

    document.body.childNodes.forEach(node => traverseAndModify(node, serviceNowRegex));
    
}

/**
 * Returns an array of regex expressions that will match ServiceNow catalog items.
 * Utilizes global collection of ServiceNow catalog item prefixes serviceNowPrefixes
 * 
 * @return [String] compiledRegex
 */
const constructServiceNowRegexString = () => {

    const regexes = [];

    serviceNowPrefixes.forEach((prefix) => {
        regexes.push(prefix + "[0-9]{7}");
    })

    let compiledRegex = "";

    regexes.forEach((regex) => {
        compiledRegex += regex + "|";
    })

    // Remove last pipe '|' character
    compiledRegex = compiledRegex.slice(0, -1);
    return compiledRegex;
}


const traverseAndModify = (node, re) => {
    if (node.nodeType === Node.TEXT_NODE && re.test(node.nodeValue)) {
        const span = document.createElement('span');

        const parts = node.nodeValue.split(re);

        parts.forEach((part, index) => {
            if (index > 0) {
                const hyperlink = document.createElement('a');
                hyperlink.textContent = node.nodeValue.match(re)[0];
                hyperlink.href = serviceNowURL + hyperlink.textContent;
                hyperlink.target = "_blank";
                hyperlink.style = "color: red";

                span.appendChild(hyperlink);
            }
            span.appendChild(document.createTextNode(part));
        });
        node.parentNode.replaceChild(span, node);

    // ServiceNow uses textarea elements in its form inputs (e.g. the input fields for change requests)
    // We cannot insert spans into textarea elements, so we will need to exclude these nodes.
    } else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== "TEXTAREA") {
        node.childNodes.forEach(childNode => traverseAndModify(childNode, re));
    }
};


chrome.runtime.onMessage.addListener((details) => {
    if (details.message && details.message.toUpperCase() === 'CHANGE_DETECTED') {
        main();
    }
});

main();
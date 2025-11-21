/* 
 * Background.js adds listeners that will invoke the hyperlink functionality
 * that is defined in Hyperlink.js on the following events:
 * 
 * URL change (this happens when opening an email in GMail for example)
*/

// Listener for URL change
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url || changeInfo.status) {
        chrome.tabs.sendMessage(tab.id, { message: "CHANGE_DETECTED" });
    } 
});
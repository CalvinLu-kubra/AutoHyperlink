function retrievePrefixes() {
    const fs = require('fs');
    const text = fs.readFileSync('../resources/ServiceNowPrefixes.txt')

    const reader = new FileReader();
    const file = reader.readAsText(File.op)
}

function loadPrefixesList() {
    console.log("loadPrefixesList executing...")
    const prefixesList = document.getElementById('prefixesList');

    serviceNowPrefixes.forEach((prefix) => {
        let listItem = createTextNode(prefix);
        prefixesList.appendChild(listItem);
    })
}

loadPrefixesList();
let currentPrefixes = [];

const tabButtons = document.querySelectorAll('.tab-btn');
const panels = document.querySelectorAll('.settings-panel-tab');

tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
        tabButtons.forEach((b) => b.classList.toggle('active', b === btn));
        panels.forEach((panel) => panel.classList.toggle('active', panel.dataset.panel === btn.dataset.panel));
    });
});

const prefixList = document.getElementById('prefix-list');
const newPrefixInput = document.getElementById('new-prefix');
const addPrefixBtn = document.getElementById('add-prefix-btn');
const prefixError = document.getElementById('prefix-error');

const linkColorInput = document.getElementById('link-color');
const saveColorBtn = document.getElementById('save-color-btn');
const styleCheckboxes = document.querySelectorAll('.style-checkbox');
const previewLinks = document.querySelectorAll('.preview-link');

const updatePreview = () => {
    const enabled = new Set([...styleCheckboxes].filter((cb) => cb.checked).map((cb) => cb.value));

    let style = `color: ${linkColorInput.value};`;
    style += ` text-decoration: ${enabled.has('underline') ? 'underline' : 'none'};`;
    style += ` font-weight: ${enabled.has('bold') ? 'bold' : 'normal'};`;
    style += ` font-style: ${enabled.has('italic') ? 'italic' : 'normal'};`;

    previewLinks.forEach((link) => link.setAttribute('style', style));
};

const renderPrefixList = () => {
    prefixList.innerHTML = '';

    currentPrefixes.forEach((prefix, index) => {
        const item = document.createElement('li');
        item.className = 'prefix-item';

        const label = document.createElement('span');
        label.textContent = prefix;
        item.appendChild(label);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'prefix-remove-btn';
        removeBtn.textContent = '✕';
        removeBtn.setAttribute('aria-label', `Remove ${prefix}`);
        removeBtn.addEventListener('click', () => removePrefix(index));
        item.appendChild(removeBtn);

        prefixList.appendChild(item);
    });
};

const setPrefixError = (message) => {
    prefixError.textContent = message || '';
};

const addPrefix = () => {
    const candidate = newPrefixInput.value.trim().toUpperCase();

    if (!/^[A-Z]{1,10}$/.test(candidate)) {
        setPrefixError('Prefix must be 1-10 letters (A-Z).');
        return;
    }

    if (currentPrefixes.some((prefix) => prefix.toUpperCase() === candidate)) {
        setPrefixError(`"${candidate}" is already in the list.`);
        return;
    }

    currentPrefixes.push(candidate);
    chrome.storage.local.set({ prefixes: currentPrefixes });

    setPrefixError('');
    newPrefixInput.value = '';
    renderPrefixList();
};

const removePrefix = (index) => {
    currentPrefixes.splice(index, 1);
    chrome.storage.local.set({ prefixes: currentPrefixes });
    renderPrefixList();
};

addPrefixBtn.addEventListener('click', addPrefix);
newPrefixInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        addPrefix();
    }
});

linkColorInput.addEventListener('input', updatePreview);

saveColorBtn.addEventListener('click', () => {
    chrome.storage.local.set({ linkColor: linkColorInput.value });
});

styleCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
        const selected = [...styleCheckboxes].filter((cb) => cb.checked).map((cb) => cb.value);
        chrome.storage.local.set({ linkStyles: selected });
        updatePreview();
    });
});

const init = async () => {
    const items = await chrome.storage.local.get(DEFAULTS);

    currentPrefixes = items.prefixes;
    renderPrefixList();

    linkColorInput.value = items.linkColor;
    styleCheckboxes.forEach((checkbox) => {
        checkbox.checked = items.linkStyles.includes(checkbox.value);
    });

    updatePreview();
};

init();

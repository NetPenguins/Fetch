// Constants
const ENDPOINTS_DATA_ID = 'graph-endpoints-data';
const TOKEN_SELECT_ID = 'tokenSelect';
const ENDPOINTS_LIST_ID = 'endpointsList';
const SELECT_ALL_BTN_ID = 'selectAllBtn';
const DESELECT_ALL_BTN_ID = 'deselectAllBtn';
const ENUMERATE_BTN_ID = 'enumerateBtn';
const RESULTS_DIV_ID = 'results';
const TOKEN_SCP_ID = 'tokenScp';
const TOKEN_SCP_CONTENT_ID = 'tokenScpContent';
const CURRENT_TIME_ID = 'currentTime';


// Global state
let GRAPH_ENDPOINTS = null;
let FLATTENED_ENDPOINTS = null;

// DOM Elements
const tokenSelect = document.getElementById(TOKEN_SELECT_ID);
const endpointsList = document.getElementById(ENDPOINTS_LIST_ID);
const selectAllBtn = document.getElementById(SELECT_ALL_BTN_ID);
const deselectAllBtn = document.getElementById(DESELECT_ALL_BTN_ID);
let enumerateBtn = document.getElementById(ENUMERATE_BTN_ID);

// Event Listeners
document.addEventListener('DOMContentLoaded', initializeApp, { once: true });

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function flattenEndpoints(endpoints, prefix = '') {
    return Object.entries(endpoints).reduce((acc, [key, value]) => {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (value.path) {
            // This is an endpoint
            acc[newKey] = value;
        } else {
            // This is a nested object, recurse
            Object.assign(acc, flattenEndpoints(value, newKey));
        }
        return acc;
    }, {});
}

// Main initialization function
async function initializeApp() {
    try {
        GRAPH_ENDPOINTS = await loadEndpointsData();
        FLATTENED_ENDPOINTS = flattenEndpoints(GRAPH_ENDPOINTS);
        createEndpointsList(GRAPH_ENDPOINTS);
        setupEventListeners();
        updateCurrentTime();
        setInterval(updateCurrentTime, 1000);
    } catch (error) {
        console.error('Failed to initialize app:', error);
        // Display error to user
    }
}

// Load endpoints data
async function loadEndpointsData() {
    const dataElement = document.getElementById(ENDPOINTS_DATA_ID);
    return JSON.parse(dataElement.textContent);
}

// Create endpoints list
function createEndpointsList(endpoints) {
    endpointsList.innerHTML = '';

    for (const [category, subcategories] of Object.entries(endpoints)) {
        const categoryWrapper = createCategoryWrapper(category, subcategories);
        endpointsList.appendChild(categoryWrapper);
    }
}

function createCategoryWrapper(category, subcategories) {
    const categoryWrapper = document.createElement('div');
    categoryWrapper.className = 'category-wrapper';

    const categoryHeader = createCategoryHeader(category);
    const categoryContent = createCategoryContent(category, subcategories);

    categoryWrapper.appendChild(categoryHeader);
    categoryWrapper.appendChild(categoryContent);

    return categoryWrapper;
}

function createCategoryHeader(category) {
    const categoryHeader = document.createElement('div');
    categoryHeader.className = 'category-header';
    categoryHeader.innerHTML = `
        <input type="checkbox" class="category-checkbox" id="category-${category}">
        <span class="category-toggle">+</span> ${category}
    `;
    categoryHeader.onclick = toggleCategory;

    const categoryCheckbox = categoryHeader.querySelector('.category-checkbox');
    categoryCheckbox.addEventListener('change', (e) => {
        e.stopPropagation();
        toggleCategoryCheckbox(e.target);
    });

    return categoryHeader;
}

function createCategoryContent(category, subcategories) {
    const categoryContent = document.createElement('div');
    categoryContent.className = 'category-content';
    categoryContent.style.display = 'none';

    let endpointCount = 0;

    for (const [subcategory, data] of Object.entries(subcategories)) {
        const subcategoryDiv = createSubcategoryDiv(category, subcategory, data);
        categoryContent.appendChild(subcategoryDiv);
        endpointCount += getEndpointCount(data);
    }

    addEndpointListeners(categoryContent, category, endpointCount);

    return categoryContent;
}

function toggleCategory(event) {
    if (event.target.type === 'checkbox') return;
    const content = this.nextElementSibling;
    const toggle = this.querySelector('.category-toggle');
    if (content.style.display === 'none') {
        content.style.display = 'block';
        toggle.textContent = '−';
    } else {
        content.style.display = 'none';
        toggle.textContent = '+';
    }
}

function createSubcategoryDiv(category, subcategory, data) {
    const subcategoryDiv = document.createElement('div');
    subcategoryDiv.className = 'subcategory';

    if (typeof data === 'object' && data.path) {
        const endpointItem = createEndpointItem(category, subcategory, data);
        subcategoryDiv.appendChild(endpointItem);
    } else {
        subcategoryDiv.innerHTML = `<strong>${subcategory}</strong>`;
        for (const [endpoint, endpointData] of Object.entries(data)) {
            if (typeof endpointData === 'object' && endpointData.path) {
                const endpointItem = createEndpointItem(category, `${subcategory}.${endpoint}`, endpointData);
                subcategoryDiv.appendChild(endpointItem);
            }
        }
    }

    return subcategoryDiv;
}

function createEndpointItem(category, endpoint, endpointData) {
    const endpointItem = document.createElement('div');
    endpointItem.className = 'endpoint-item form-check';
    endpointItem.innerHTML = `
        <input class="form-check-input" type="checkbox" name="endpoints" value="${category}.${endpoint}" id="${category}-${endpoint.replace('.', '-')}">
        <label class="form-check-label" for="${category}-${endpoint.replace('.', '-')}">
            ${endpoint}
        </label>
    `;
    return endpointItem;
}

function getEndpointCount(data) {
    if (typeof data === 'object' && data.path) {
        return 1;
    }
    return Object.values(data).filter(item => typeof item === 'object' && item.path).length;
}

function addEndpointListeners(categoryContent, category, endpointCount) {
    const endpointCheckboxes = categoryContent.querySelectorAll('input[type="checkbox"]');
    endpointCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            updateCategoryCheckbox(category, endpointCount);
        });
    });
}

function setupEventListeners() {
    if (tokenSelect) {
        tokenSelect.addEventListener('change', () => checkAndHighlightPermissions(tokenSelect.value));
    }

    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', selectAll);
    }

    if (deselectAllBtn) {
        deselectAllBtn.addEventListener('click', deselectAll);
    }

    if (enumerateBtn) {
        // Remove all existing click event listeners
        const oldEnumerateBtn = enumerateBtn.cloneNode(true);
        enumerateBtn.parentNode.replaceChild(oldEnumerateBtn, enumerateBtn);
        enumerateBtn = oldEnumerateBtn;

        // Create a debounced version of enumerateGraph
        const debouncedEnumerate = debounce(() => {
            enumerateGraph().catch(error => {
                console.error('Error during enumeration:', error);
                alert(`An error occurred during enumeration: ${error.message}`);
            });
        }, 300); // 300ms debounce time

        // Add the new listener
        enumerateBtn.addEventListener('click', debouncedEnumerate);
    }
}

async function checkAndHighlightPermissions(tokenId) {
    if (!tokenId) {
        hideTokenScp();
        return;
    }

    try {
        const permissions = await fetchTokenPermissions(tokenId);
        displayTokenPermissions(permissions);
        highlightEndpoints(permissions);
    } catch (error) {
        console.error('Error checking permissions:', error);
        hideTokenScp();
    }
}

async function fetchTokenPermissions(tokenId) {
    const response = await fetch(`/get_token_permissions/${tokenId}`);
    const data = await response.json();
    if (!data.success || !data.permissions) {
        throw new Error('Failed to fetch token permissions');
    }
    return data.permissions;
}

function displayTokenPermissions(permissions) {
    const tokenScpDiv = document.getElementById(TOKEN_SCP_ID);
    const tokenScpContent = document.getElementById(TOKEN_SCP_CONTENT_ID);
    tokenScpContent.innerHTML = permissions.map(perm =>
        `<a href="https://graphpermissions.merill.net/permission/${perm}" target="_blank">${perm}</a>`
    ).join(' ');
    tokenScpDiv.style.display = 'block';
}

function hideTokenScp() {
    document.getElementById(TOKEN_SCP_ID).style.display = 'none';
}

function highlightEndpoints(permissions) {
    const permSet = new Set(permissions.map(p => p.replace('.ReadWrite.', '.Read.')));
    const accessAsUserPermissions = new Set(permissions
        .filter(p => p.includes('.AccessAsUser.'))
        .map(p => p.split('.AccessAsUser.')[0]));

    const endpointStatus = {};

    document.querySelectorAll('.category-wrapper').forEach(category => {
        const endpointCheckboxes = category.querySelectorAll('input[name="endpoints"]');

        endpointCheckboxes.forEach(checkbox => {
            const endpointPath = checkbox.value.split('.');
            let endpointData = GRAPH_ENDPOINTS;
            for (const key of endpointPath) {
                if (endpointData && endpointData[key]) {
                    endpointData = endpointData[key];
                } else {
                    endpointData = null;
                    break;
                }
            }

            if (endpointData && endpointData.path) {
                endpointStatus[checkbox.value] = getEndpointStatus(endpointData, permSet, accessAsUserPermissions);
            }
        });
    });

    organizeEndpoints(endpointStatus);
}

function getEndpointStatus(endpointData, permSet, accessAsUserPermissions) {
    const delegatedPerm = endpointData.delegatedPermission ? endpointData.delegatedPermission.replace('.ReadWrite.', '.Read.') : null;
    const appPerm = endpointData.applicationPermission ? endpointData.applicationPermission.replace('.ReadWrite.', '.Read.') : null;

    if (permSet.has(delegatedPerm) || permSet.has(appPerm)) {
        return 'allowed';
    } else if ((delegatedPerm && accessAsUserPermissions.has(delegatedPerm.split('.')[0])) ||
        (appPerm && accessAsUserPermissions.has(appPerm.split('.')[0]))) {
        return 'potentially-allowed';
    } else {
        return 'not-allowed';
    }
}

function organizeEndpoints(endpointStatus) {
    const categories = {};

    Object.entries(endpointStatus).forEach(([endpoint, status]) => {
        const [category] = endpoint.split('.');
        if (!categories[category]) {
            categories[category] = {allowed: [], potentiallyAllowed: [], notAllowed: [], status: 'not-allowed'};
        }

        const endpointItem = document.querySelector(`input[value="${endpoint}"]`).closest('.endpoint-item');
        updateEndpointItemStatus(endpointItem, status);
        updateCategoryStatus(categories[category], status, endpointItem);
    });

    const sortedCategories = sortCategories(categories);
    renderSortedCategories(sortedCategories);
}

function updateEndpointItemStatus(endpointItem, status) {
    endpointItem.classList.remove('highlighted', 'potentially-allowed');
    if (status === 'allowed') {
        endpointItem.classList.add('highlighted');
    } else if (status === 'potentially-allowed') {
        endpointItem.classList.add('potentially-allowed');
    }
}

function updateCategoryStatus(category, status, endpointItem) {
    if (status === 'allowed') {
        category.allowed.push(endpointItem);
        category.status = 'allowed';
    } else if (status === 'potentially-allowed') {
        category.potentiallyAllowed.push(endpointItem);
        if (category.status !== 'allowed') {
            category.status = 'potentially-allowed';
        }
    } else {
        category.notAllowed.push(endpointItem);
    }
}

function sortCategories(categories) {
    return Object.entries(categories).sort((a, b) => {
        const order = {'allowed': 0, 'potentially-allowed': 1, 'not-allowed': 2};
        return order[a[1].status] - order[b[1].status];
    });
}

function renderSortedCategories(sortedCategories) {
    const scrollPosition = endpointsList.scrollTop;
    endpointsList.innerHTML = '';

    sortedCategories.forEach(([category, endpoints]) => {
        const categoryWrapper = createSortedCategoryWrapper(category, endpoints);
        endpointsList.appendChild(categoryWrapper);
    });

    endpointsList.scrollTop = scrollPosition;
}

function createSortedCategoryWrapper(category, endpoints) {
    const categoryWrapper = document.createElement('div');
    categoryWrapper.className = 'category-wrapper';

    const categoryHeader = createSortedCategoryHeader(category, endpoints);
    const categoryContent = createSortedCategoryContent(category, endpoints);

    categoryWrapper.appendChild(categoryHeader);
    categoryWrapper.appendChild(categoryContent);

    return categoryWrapper;
}

function createSortedCategoryHeader(category, endpoints) {
    const categoryHeader = document.createElement('div');
    categoryHeader.className = 'category-header';
    if (endpoints.status === 'allowed') {
        categoryHeader.classList.add('highlighted');
    } else if (endpoints.status === 'potentially-allowed') {
        categoryHeader.classList.add('potentially-allowed');
    }

    categoryHeader.innerHTML = `
        <input type="checkbox" class="category-checkbox" id="category-${category}">
        <span class="category-toggle">+</span> ${category}
    `;
    categoryHeader.onclick = toggleCategory;

    const categoryCheckbox = categoryHeader.querySelector('.category-checkbox');
    categoryCheckbox.addEventListener('change', (e) => {
        e.stopPropagation();
        toggleCategoryCheckbox(e.target);
    });

    return categoryHeader;
}

function createSortedCategoryContent(category, endpoints) {
    const categoryContent = document.createElement('div');
    categoryContent.className = 'category-content';
    categoryContent.style.display = 'none';

    endpoints.allowed.concat(endpoints.potentiallyAllowed, endpoints.notAllowed)
        .forEach(endpoint => {
            categoryContent.appendChild(endpoint);
            const checkbox = endpoint.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', () => {
                updateCategoryCheckbox(category, endpoints.allowed.length + endpoints.potentiallyAllowed.length + endpoints.notAllowed.length);
            });
        });

    return categoryContent;
}

function toggleCategoryCheckbox(checkbox) {
    const categoryContent = checkbox.closest('.category-header').nextElementSibling;
    const childCheckboxes = categoryContent.querySelectorAll('input[type="checkbox"]');
    childCheckboxes.forEach(childCheckbox => {
        childCheckbox.checked = checkbox.checked;
    });
    if (checkbox.checked) {
        categoryContent.style.display = 'block';
        checkbox.closest('.category-header').querySelector('.category-toggle').textContent = '−';
    }
    const category = checkbox.id.replace('category-', '');
    updateCategoryCheckbox(category, childCheckboxes.length);
}

function updateCategoryCheckbox(category, totalEndpoints) {
    const safeCategory = category.replace(/[^a-zA-Z0-9]/g, '_');
    const categoryCheckbox = document.getElementById(`category-${safeCategory}`);
    if (categoryCheckbox) {
        const checkedEndpoints = document.querySelectorAll(`#category-${safeCategory} ~ .category-content input[type="checkbox"]:checked`).length;
        categoryCheckbox.checked = checkedEndpoints === totalEndpoints;
        categoryCheckbox.indeterminate = checkedEndpoints > 0 && checkedEndpoints < totalEndpoints;
    }
}

function selectAll() {
    document.querySelectorAll('#endpointsList input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = true;
    });
    updateAllCategoryCheckboxes();
}

function deselectAll() {
    document.querySelectorAll('#endpointsList input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    updateAllCategoryCheckboxes();
}

function updateAllCategoryCheckboxes() {
    document.querySelectorAll('.category-wrapper').forEach(category => {
        const categoryName = category.querySelector('.category-header').textContent.trim().replace(/^\+\s*/, '');
        const totalEndpoints = category.querySelectorAll('.category-content input[type="checkbox"]').length;
        updateCategoryCheckbox(categoryName, totalEndpoints);
    });
}

function getSelectedTokenAudience() {
    const tokenSelect = document.getElementById('tokenSelect');
    const selectedOption = tokenSelect.options[tokenSelect.selectedIndex];
    if (!selectedOption) return null;

    // Assuming the format is "id - audience - email"
    const parts = selectedOption.text.split(' - ');
    if (parts.length > 1) {
        // Trim the audience and remove any trailing slashes
        return parts[1].trim().replace(/\/+$/, '');
    }
    return null;
}


async function enumerateGraph() {
    console.log("enumerateGraph called at:", new Date().toISOString());

    if (!FLATTENED_ENDPOINTS) {
        console.error("FLATTENED_ENDPOINTS is not initialized");
        alert("Application is not fully initialized. Please try again in a moment.");
        return;
    }

    const tokenSelect = document.getElementById('tokenSelect');
    const selectedOption = tokenSelect.options[tokenSelect.selectedIndex];

    if (!selectedOption) {
        console.log("No token selected");
        alert("Please select an access token first.");
        return;
    }

    const tokenId = selectedOption.value;
    const tokenAudience = getSelectedTokenAudience();
    console.log(`Selected token ID: ${tokenId}, Audience: ${tokenAudience}`);


    const selectedEndpoints = Array.from(document.querySelectorAll('input[name="endpoints"]:checked')).map(cb => cb.value);
    console.log("Number of selected endpoints:", selectedEndpoints.length);
    console.log("Selected endpoints:", selectedEndpoints);

    if (selectedEndpoints.length === 0) {
        console.log("No endpoints selected");
        alert("Please select at least one endpoint.");
        return;
    }

    const normalizeAudience = (audience) => audience.replace(/\/+$/, '');


    // Filter endpoints based on audience
    const validEndpoints = selectedEndpoints.filter(endpoint => {
        const endpointData = FLATTENED_ENDPOINTS[endpoint];
        if (!endpointData) {
            console.warn(`Endpoint ${endpoint} not found in FLATTENED_ENDPOINTS`);
            return false;
        }
        console.log(`Checking endpoint: ${endpoint}`);
        console.log(`Endpoint audience:`, endpointData.audience);
        console.log(`Token audience: ${tokenAudience}`);

        const normalizedTokenAudience = normalizeAudience(tokenAudience);
        const isValid = Array.isArray(endpointData.audience)
            ? endpointData.audience.some(aud => normalizeAudience(aud) === normalizedTokenAudience)
            : normalizeAudience(endpointData.audience) === normalizedTokenAudience;

        console.log(`Is valid: ${isValid}`);
        return isValid;
    });

    console.log("Number of valid endpoints:", validEndpoints.length);
    console.log("Valid endpoints:", validEndpoints);

    if (validEndpoints.length === 0) {
        console.log("No valid endpoints found");
        alert("No selected endpoints match the token's audience. Please check your selection and try again.");
        return;
    }


    const resultsDiv = document.getElementById(RESULTS_DIV_ID);
    resultsDiv.innerHTML = createResultsHeader();

    const results = new Map();

    // Process endpoints asynchronously
    const promises = validEndpoints.map(endpoint => processEndpoint(endpoint, tokenId));
    const processedResults = await Promise.all(promises);

    processedResults.forEach(({ endpoint, result, status }) => {
        results.set(endpoint, { result, status });
    });

    // Sort results
    const sortedResults = Array.from(results.entries()).sort((a, b) => {
        const order = { 'success': 0, 'empty': 1, 'warning': 2, 'error': 3 };
        return order[a[1].status] - order[b[1].status] || a[0].localeCompare(b[0]);
    });

    // Render sorted results
    sortedResults.forEach(([endpoint, { result, status }], index) => {
        const sectionDiv = createResultSection(endpoint, result, index, status);
        resultsDiv.appendChild(sectionDiv);
    });

    console.log("All endpoints processed");
    console.log("Number of unique results:", results.size);
}

function processEndpoint(endpoint, tokenId) {
    return new Promise(async (resolve, reject) => {
        try {
            const formData = new FormData();
            formData.append('token_id', tokenId);
            formData.append('endpoints', endpoint);

            const response = await fetch('/enumerate_graph', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log(`Received data for ${endpoint}:`, data);

            if (Object.keys(data).length === 0) {
                throw new Error("No data returned from the server");
            }

            const status = getResultStatus(data[endpoint]);
            resolve({ endpoint, result: data[endpoint], status });
        } catch (error) {
            console.error(`Error processing ${endpoint}:`, error);
            resolve({ endpoint, result: { error: error.message }, status: 'error' });
        }
    });
}

function createResultsHeader() {
    return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h2>Enumeration Results</h2>
            <div class="legend" style="font-size: 0.9em;">
                <span style="margin-right: 15px;"><span style="color: green;">&#9989;</span> Data available</span>
                <span style="margin-right: 15px;"><span style="color: gray;">&#9711;</span> No data</span>
                <span style="margin-right: 15px;"><span style="color: orange;">&#9888;</span> Warning</span>
                <span><span style="color: red;">&#9940;</span> Error</span>
            </div>
        </div>
    `;
}

function createResultHeaderBar(endpoint, index, status) {
    const headerBar = document.createElement('div');
    headerBar.className = 'result-header d-flex align-items-center p-2 bg-light border rounded';

    const toggleIcon = document.createElement('span');
    toggleIcon.className = 'toggle-icon me-2';
    toggleIcon.innerHTML = getStatusIcon(status);

    const headerText = document.createElement('h3');
    headerText.className = 'm-0 flex-grow-1 text-truncate';
    headerText.textContent = endpoint;

    headerBar.appendChild(toggleIcon);
    headerBar.appendChild(headerText);

    if (status === 'success') {
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'btn-group ms-2';

        const csvButton = createButton('CSV', () => downloadCSV(endpoint, `dataTable${index}`), 'btn-primary');
        const jsonButton = createButton('JSON', () => downloadJSON(endpoint, `dataTable${index}`), 'btn-success');
        const copyButton = createButton('Copy', () => copyToClipboard(`dataTable${index}`), 'btn-outline-secondary');

        buttonGroup.appendChild(csvButton);
        buttonGroup.appendChild(jsonButton);
        buttonGroup.appendChild(copyButton);

        headerBar.appendChild(buttonGroup);
    }

    headerBar.onclick = (event) => {
        // Prevent toggling when clicking on buttons
        if (!event.target.closest('.btn-group')) {
            toggleDataTable(`dataTable${index}`);
        }
    };

    return headerBar;
}


function getStatusIcon(status) {
    switch (status) {
        case 'success': return '<span style="color: green;">&#9989;</span>';
        case 'empty': return '<span style="color: gray;">&#9711;</span>';
        case 'warning': return '<span style="color: orange;">&#9888;</span>';
        case 'error': return '<span style="color: red;">&#9940;</span>';
        default: return '<span style="color: green;">&#9989;</span>';
    }
}

function getResultStatus(result) {
    if (result.error) return 'error';
    if (result.warning) return 'warning';
    if (result['@odata.context'] && Array.isArray(result.value)) {
        return result.value.length > 0 ? 'success' : 'empty';
    }
    return 'empty';
}

function createResultSection(endpoint, result, index, status) {
    console.log(`Creating section for ${endpoint} with status ${status}`);
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'result-section mb-3';

    const headerBar = createResultHeaderBar(endpoint, index, status);
    sectionDiv.appendChild(headerBar);

    const contentContainer = document.createElement('div');
    contentContainer.id = `dataTable${index}Container`;
    contentContainer.className = 'mt-2';
    contentContainer.style.display = 'none';  // Ensure it's initially hidden

    switch (status) {
        case 'success':
            contentContainer.innerHTML = '<table id="dataTable' + index + '" class="display"></table>';
            sectionDiv.appendChild(contentContainer);
            setTimeout(() => initializeDataTable(result.value, index, headerBar), 0);
            break;
        case 'empty':
            contentContainer.innerHTML = '<p>No data available for this endpoint.</p>';
            sectionDiv.appendChild(contentContainer);
            break;
        case 'warning':
            contentContainer.innerHTML = `<p>Warning: ${result.warning}</p>`;
            sectionDiv.appendChild(contentContainer);
            break;
        case 'error':
            contentContainer.innerHTML = `<p>Error: ${result.error}</p>`;
            sectionDiv.appendChild(contentContainer);
            break;
    }

    return sectionDiv;
}

function initializeDataTable(data, index, headerBar) {
    console.log("Initializing DataTable with data:", data);
    const tableId = `dataTable${index}`;
    const $table = jQuery(`#${tableId}`);

    if ($table.length === 0) {
        console.error(`Table with id ${tableId} not found`);
        return;
    }

    try {
        const columns = Object.keys(data[0]).map(key => ({
            title: key,
            data: key
        }));

        const dataTable = $table.DataTable({
            data: data,
            columns: columns,
            pageLength: 10,
            lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]],
            scrollX: true,
            autoWidth: false
        });

        addShowMoreEventListener($table, dataTable);

    } catch (error) {
        console.error(`Error processing data for table ${tableId}:`, error);
        const errorMessage = `Error processing data for this endpoint: ${error.message}`;
        document.getElementById(`${tableId}Container`).innerHTML = `<p>${errorMessage}</p>`;
        setErrorState(headerBar, errorMessage);
    }
}

function setErrorState(headerBar, errorMessage) {
    headerBar.classList.add('error');
    const toggleIcon = headerBar.querySelector('.toggle-icon');
    if (toggleIcon) {
        toggleIcon.innerHTML = '⚠️';
    }
    headerBar.title = errorMessage;
}

function addShowMoreEventListener($table, dataTable) {
    $table.on('click', 'a.show-more', function(e) {
        e.preventDefault();
        const tr = $(this).closest('tr');
        const row = dataTable.row(tr);
        if (row.child.isShown()) {
            row.child.hide();
            tr.removeClass('shown');
        } else {
            const rowData = row.data();
            const fullContent = `<pre>${JSON.stringify(rowData, null, 2)}</pre>`;
            row.child(fullContent).show();
            tr.addClass('shown');
        }
    });
}

function createButton(text, onClick, colorClass) {
    const button = document.createElement('button');
    button.className = `btn btn-sm ${colorClass} me-2`;
    button.textContent = text;
    button.onclick = (e) => {
        e.stopPropagation();
        onClick();
    };
    return button;
}

function downloadJSON(endpoint, tableId) {
    const table = jQuery(`#${tableId}`).DataTable();
    const jsonData = { value: table.data().toArray() };
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    downloadBlob(blob, `${endpoint.replace(/\//g, '_')}_output.json`);
}

function downloadCSV(endpoint, tableId) {
    const table = jQuery(`#${tableId}`).DataTable();
    const headers = table.columns().header().toArray().map(header => header.textContent);
    let csvContent = headers.join(",") + "\r\n";

    table.data().toArray().forEach(function(row) {
        let rowContent = headers.map(header => {
            let cellContent = row[header] || '';
            if (typeof cellContent === 'object') {
                cellContent = JSON.stringify(cellContent);
            }
            cellContent = cellContent.toString().replace(/"/g, '""');
            return `"${cellContent}"`;
        });
        csvContent += rowContent.join(",") + "\r\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${endpoint.replace(/\//g, '_')}.csv`);
}

function downloadBlob(blob, filename) {
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function copyToClipboard(tableId) {
    const table = jQuery(`#${tableId}`).DataTable();
    const visibleColumns = table.columns().indexes().filter(function(value, index) {
        return table.column(value).visible();
    });

    const csvContent = visibleColumns.map(function(colIndex) {
        return table.column(colIndex).header().textContent;
    }).join(',') + '\n' +
    table.data().toArray().map(function(row) {
        return visibleColumns.map(function(colIndex) {
            let cellData = row[table.column(colIndex).dataSrc()];
            if (typeof cellData === 'string') {
                cellData = cellData.replace(/"/g, '""');
                return `"${cellData}"`;
            }
            return cellData;
        }).join(',');
    }).join('\n');

    navigator.clipboard.writeText(csvContent).then(() => {
        const copyBtn = jQuery(`#${tableId}`).closest('.result-section').find('button:contains("Copy")');
        const originalText = copyBtn.text();
        copyBtn.text('Copied!');
        setTimeout(() => {
            copyBtn.text(originalText);
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

function toggleDataTable(tableId) {
    const tableContainer = document.getElementById(`${tableId}Container`);
    if (tableContainer) {
        tableContainer.style.display = tableContainer.style.display === 'none' ? 'block' : 'none';
    }
}

function updateCurrentTime() {
    const currentTimeElement = document.getElementById(CURRENT_TIME_ID);
    if (currentTimeElement) {
        const now = new Date();
        currentTimeElement.textContent = now.toUTCString();
    }
}

// Initialize the application
initializeApp();
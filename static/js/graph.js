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

// DOM Elements
const tokenSelect = document.getElementById(TOKEN_SELECT_ID);
const endpointsList = document.getElementById(ENDPOINTS_LIST_ID);
const selectAllBtn = document.getElementById(SELECT_ALL_BTN_ID);
const deselectAllBtn = document.getElementById(DESELECT_ALL_BTN_ID);
const enumerateBtn = document.getElementById(ENUMERATE_BTN_ID);

// Event Listeners
document.addEventListener('DOMContentLoaded', initializeApp);

// Main initialization function
async function initializeApp() {
    try {
        GRAPH_ENDPOINTS = await loadEndpointsData();
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

function createEndpointItem(category, endpoint) {
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

// Setup event listeners
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
        enumerateBtn.addEventListener('click', enumerateGraph);
    }
}

// Check and highlight permissions
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

// Fetch token permissions
async function fetchTokenPermissions(tokenId) {
    const response = await fetch(`/get_token_permissions/${tokenId}`);
    const data = await response.json();
    if (!data.success || !data.permissions) {
        throw new Error('Failed to fetch token permissions');
    }
    return data.permissions;
}

// Display token permissions
function displayTokenPermissions(permissions) {
    const tokenScpDiv = document.getElementById(TOKEN_SCP_ID);
    const tokenScpContent = document.getElementById(TOKEN_SCP_CONTENT_ID);
    tokenScpContent.innerHTML = permissions.map(perm =>
        `<a href="https://graphpermissions.merill.net/permission/${perm}" target="_blank">${perm}</a>`
    ).join(' ');
    tokenScpDiv.style.display = 'block';
}

// Hide token SCP
function hideTokenScp() {
    document.getElementById(TOKEN_SCP_ID).style.display = 'none';
}

// Highlight endpoints based on permissions
function highlightEndpoints(permissions) {
    const permSet = new Set(permissions.map(p => p.replace('.ReadWrite.', '.Read.')));
    const accessAsUserPermissions = new Set(permissions
        .filter(p => p.includes('.AccessAsUser.'))
        .map(p => p.split('.AccessAsUser.')[0]));

    const endpointStatus = {};

    document.querySelectorAll('.category-wrapper').forEach(category => {
        const categoryName = category.querySelector('.category-header').textContent.trim().replace(/^[−-]\s*/, '');
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

// Organize endpoints based on status
function organizeEndpoints(endpointStatus) {
    const categories = {};

    Object.entries(endpointStatus).forEach(([endpoint, status]) => {
        const [category, ...rest] = endpoint.split('.');
        if (!categories[category]) {
            categories[category] = { allowed: [], potentiallyAllowed: [], notAllowed: [], status: 'not-allowed' };
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
        const order = { 'allowed': 0, 'potentially-allowed': 1, 'not-allowed': 2 };
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

// Toggle category visibility
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

// Toggle category checkbox
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

// Update category checkbox state
// Update category checkbox state
function updateCategoryCheckbox(category, totalEndpoints) {
    const safeCategory = category.replace(/[^a-zA-Z0-9]/g, '_');
    const categoryCheckbox = document.getElementById(`category-${safeCategory}`);
    if (categoryCheckbox) {
        const checkedEndpoints = document.querySelectorAll(`#category-${safeCategory} ~ .category-content input[type="checkbox"]:checked`).length;
        categoryCheckbox.checked = checkedEndpoints === totalEndpoints;
        categoryCheckbox.indeterminate = checkedEndpoints > 0 && checkedEndpoints < totalEndpoints;
    }
}

// Select all endpoints
function selectAll() {
    document.querySelectorAll('#endpointsList input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = true;
    });
    updateAllCategoryCheckboxes();
}

// Deselect all endpoints
function deselectAll() {
    document.querySelectorAll('#endpointsList input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    updateAllCategoryCheckboxes();
}

// Update all category checkboxes
function updateAllCategoryCheckboxes() {
    document.querySelectorAll('.category-wrapper').forEach(category => {
        const categoryName = category.querySelector('.category-header').textContent.trim().replace(/^\+\s*/, '');
        const totalEndpoints = category.querySelectorAll('.category-content input[type="checkbox"]').length;
        updateCategoryCheckbox(categoryName, totalEndpoints);
    });
}

async function enumerateGraph() {
    const tokenId = tokenSelect.value;
    if (!tokenId) {
        alert("Please select an access token first.");
        return;
    }

    const endpoints = Array.from(document.querySelectorAll('input[name="endpoints"]:checked')).map(cb => cb.value);
    if (endpoints.length === 0) {
        alert("Please select at least one endpoint.");
        return;
    }

    const formData = new FormData();
    formData.append('token_id', tokenId);
    endpoints.forEach(endpoint => formData.append('endpoints', endpoint));

    try {
        const response = await fetch('/enumerate_graph', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (Object.keys(data).length === 0) {
            throw new Error("No data returned from the server");
        }

        const resultsDiv = document.getElementById(RESULTS_DIV_ID);
        resultsDiv.innerHTML = createResultsHeader();

        // Sort the results
        const sortedResults = Object.entries(data).sort((a, b) => {
            const statusOrder = { success: 0, empty: 1, error: 2 };
            const statusA = getResultStatus(a[1]);
            const statusB = getResultStatus(b[1]);
            return statusOrder[statusA] - statusOrder[statusB];
        });

        sortedResults.forEach(([endpoint, result], index) => {
            const status = getResultStatus(result);
            const sectionDiv = createResultSection(endpoint, result, index, status);
            resultsDiv.appendChild(sectionDiv);
        });
    } catch (error) {
        console.error('Error:', error);
        document.getElementById(RESULTS_DIV_ID).innerHTML = `<p class="text-danger">Error: ${error.message}</p>`;
    }
}

// Create results header with legend
function createResultsHeader() {
    return `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>Enumeration Results</h2>
            <div class="legend">
                <span class="me-3"><span class="legend-icon">▶</span> Data available</span>
                <span class="me-3"><span class="legend-icon">📭</span> No data</span>
                <span class="me-3"><span class="legend-icon">⚠️</span> Warning</span>
                <span><span class="legend-icon">🛑</span> Error</span>
            </div>
        </div>
    `;
}



// Create error section
function createErrorSection(endpoint, errorMessage, index) {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'result-section mb-3';

    const headerBar = createResultHeaderBar(endpoint, index, 'error');
    setErrorState(headerBar, errorMessage);

    const errorContainer = document.createElement('div');
    errorContainer.id = `dataTable${index}Container`;
    errorContainer.className = 'mt-2';
    errorContainer.style.display = 'none';
    errorContainer.innerHTML = `<p>${errorMessage}</p>`;

    sectionDiv.appendChild(headerBar);
    sectionDiv.appendChild(errorContainer);

    return sectionDiv;
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

// Get status icon based on the status
function getStatusIcon(status) {
    switch (status) {
        case 'success':
            return '▶';
        case 'empty':
            return '📭'; // Empty mailbox emoji
        case 'warning':
            return '⚠️'; // Warning sign
        case 'error':
            return '🛑'; // Stop sign
        default:
            return '▶';
    }
}



// Display enumeration results
function displayEnumerationResults(data) {
    const resultsDiv = document.getElementById(RESULTS_DIV_ID);
    resultsDiv.innerHTML = '<h2>Enumeration Results</h2>';

    Object.entries(data).forEach(([endpoint, result], index) => {
        const sectionDiv = createResultSection(endpoint, result, index);
        resultsDiv.appendChild(sectionDiv);
    });
}

// Create result section
function getResultStatus(result) {
    console.log("Result:", result); // Debugging log
    if (result.error) return 'error';
    if (result.warning) return 'warning';

    if (result['@odata.context'] && Array.isArray(result.value)) {
        return result.value.length > 0 ? 'success' : 'empty';
    }

    return 'empty';
}

// Create result section
function createResultSection(endpoint, result, index, status) {
    console.log(`Creating section for ${endpoint} with status ${status}`); // Debugging log
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'result-section mb-3';

    const headerBar = createResultHeaderBar(endpoint, index, status);
    sectionDiv.appendChild(headerBar);

    const contentContainer = document.createElement('div');
    contentContainer.id = `dataTable${index}Container`;
    contentContainer.className = 'mt-2';
    contentContainer.style.display = 'none';

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





// Initialize DataTable
function initializeDataTable(data, index, headerBar) {
    console.log("Initializing DataTable with data:", data); // Debugging log
    const tableId = `dataTable${index}`;
    const $table = jQuery(`#${tableId}`);

    if ($table.length === 0) {
        console.error(`Table with id ${tableId} not found`);
        setErrorState(headerBar, `Table with id ${tableId} not found`);
        return;
    }

    try {
        const [columns, dataSet] = prepareDataForTable(data);

        if (columns.length === 0 || dataSet.length === 0) {
            throw new Error("No valid data structure found");
        }

        const dataTable = $table.DataTable({
            data: dataSet,
            columns: columns,
            pageLength: 10,
            lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]],
            scrollX: true,
            autoWidth: false,
            initComplete: function(settings, json) {
                $table.css('font-size', '14px');
                addUniqueIdsToFormFields($table, index);
            }
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
        toggleIcon.innerHTML = '⚠️';  // Warning icon
    }
    headerBar.title = errorMessage;  // Add error message as tooltip
}

// Prepare data for table
function prepareDataForTable(data) {
    console.log("Preparing data for table:", data); // Debugging log
    let dataSet = [];

    if (Array.isArray(data)) {
        dataSet = data.map(item => flattenObject(item));
    } else if (typeof data === 'object' && data !== null) {
        dataSet = [flattenObject(data)];
    } else {
        dataSet = [{ value: data }];
    }

    const columns = dataSet.length > 0 ? Object.keys(dataSet[0])
        .filter(key => !key.startsWith('@odata') && !key.startsWith('__'))
        .map(key => ({
            title: abbreviateFieldName(key),
            data: key,
            render: renderTableCell
        })) : [];

    return [columns, dataSet];
}


// Create result table container
function createResultTableContainer(index) {
    const tableContainer = document.createElement('div');
    tableContainer.id = `dataTable${index}Container`;
    tableContainer.className = 'mt-2';
    tableContainer.style.display = 'none';

    const table = document.createElement('table');
    table.id = `dataTable${index}`;
    table.className = 'display';
    tableContainer.appendChild(table);

    return tableContainer;
}

// Flatten object
function flattenObject(obj, prefix = '') {
    return Object.keys(obj).reduce((acc, k) => {
        const pre = prefix.length ? prefix + '.' : '';
        if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
            Object.assign(acc, flattenObject(obj[k], pre + k));
        } else {
            acc[pre + k] = obj[k];
        }
        return acc;
    }, {});
}

// Abbreviate field name
function abbreviateFieldName(name, maxLength = 15) {
    if (name.length <= maxLength) return name;
    const parts = name.split(/(?=[A-Z])/);
    let result = parts[0];
    for (let i = 1; i < parts.length && result.length < maxLength - 3; i++) {
        result += parts[i][0];
    }
    return result + '...';
}

// Render table cell
function renderTableCell(data, type) {
    if (type === 'display') {
        const stringValue = data != null ? String(data) : '';
        if (stringValue.length > 50) {
            return stringValue.substring(0, 47) + '... <a href="#" class="show-more">Show more</a>';
        }
        return stringValue;
    }
    return data;
}

// Add unique IDs to form fields
function addUniqueIdsToFormFields($table, index) {
    $table.find('input, select, textarea').each(function(i, el) {
        el.id = `${el.id || 'formField'}_${index}_${i}`;
        el.name = `${el.name || 'formField'}_${index}_${i}`;
    });
}

// Add "Show more" event listener
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

// Create button
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

// Download JSON
function downloadJSON(endpoint, tableId) {
    const table = jQuery(`#${tableId}`).DataTable();
    const jsonData = { value: table.data().toArray() };
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    downloadBlob(blob, `${endpoint.replace(/\//g, '_')}_output.json`);
}

// Download CSV
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

// Download blob
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

// Copy to clipboard
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

// Toggle data table visibility
// Toggle data table visibility
function toggleDataTable(tableId) {
    const tableContainer = document.getElementById(`${tableId}Container`);
    if (tableContainer) {
        tableContainer.style.display = tableContainer.style.display === 'none' ? 'block' : 'none';
    }
}

// Update current time
function updateCurrentTime() {
    const currentTimeElement = document.getElementById(CURRENT_TIME_ID);
    if (currentTimeElement) {
        const now = new Date();
        currentTimeElement.textContent = now.toUTCString();
    }
}

// Initialize the application
initializeApp();
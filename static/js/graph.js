// graph.js

document.addEventListener('DOMContentLoaded', () => {
    const endpointsData = JSON.parse(document.getElementById('graph-endpoints-data').textContent);
    createEndpointsList(endpointsData);

    const tokenSelect = document.getElementById('tokenSelect');
    if (tokenSelect) {
        tokenSelect.addEventListener('change', function() {
            checkAndHighlightPermissions(this.value);
        });
    }

    const selectAllBtn = document.getElementById('selectAllBtn');
    const deselectAllBtn = document.getElementById('deselectAllBtn');
    const enumerateBtn = document.getElementById('enumerateBtn');

    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', selectAll);
    }

    if (deselectAllBtn) {
        deselectAllBtn.addEventListener('click', deselectAll);
    }

    if (enumerateBtn) {
        enumerateBtn.addEventListener('click', enumerateGraph);
    }

    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
});

function createEndpointsList(endpoints) {
    const endpointsList = document.getElementById('endpointsList');
    endpointsList.innerHTML = '';

    for (const [category, subcategories] of Object.entries(endpoints)) {
        const categoryWrapper = document.createElement('div');
        categoryWrapper.className = 'category-wrapper';

        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header';
        categoryHeader.innerHTML = `
            <input type="checkbox" class="category-checkbox" id="category-${category}">
            <span class="category-toggle">+</span> ${category}
        `;
        categoryHeader.onclick = toggleCategory;

        const categoryContent = document.createElement('div');
        categoryContent.className = 'category-content';
        categoryContent.style.display = 'none';

        let endpointCount = 0;

    for (const [subcategory, data] of Object.entries(subcategories)) {
        const subcategoryDiv = document.createElement('div');
        subcategoryDiv.className = 'subcategory';

        if (typeof data === 'object' && data.path) {
            const endpointItem = createEndpointItem(category, subcategory, data);
            subcategoryDiv.appendChild(endpointItem);
            endpointCount++;
        } else {
            subcategoryDiv.innerHTML = `<strong>${subcategory}</strong>`;
            for (const [endpoint, endpointData] of Object.entries(data)) {
                if (typeof endpointData === 'object' && endpointData.path) {
                    const endpointItem = createEndpointItem(category, `${subcategory}.${endpoint}`, endpointData);
                    subcategoryDiv.appendChild(endpointItem);
                    endpointCount++;
                }
            }
        }

        categoryContent.appendChild(subcategoryDiv);
    }


        const categoryCheckbox = categoryHeader.querySelector('.category-checkbox');
        categoryCheckbox.addEventListener('change', (e) => {
            e.stopPropagation();
            toggleCategoryCheckbox(e.target);
        });

        const oldCategoryCheckbox = document.getElementById(`category-${category}`);
        if (oldCategoryCheckbox) {
            categoryCheckbox.checked = oldCategoryCheckbox.checked;
            categoryCheckbox.indeterminate = oldCategoryCheckbox.indeterminate;
        }

        categoryWrapper.appendChild(categoryHeader);
        categoryWrapper.appendChild(categoryContent);
        endpointsList.appendChild(categoryWrapper);

        // Add event listeners to update category checkbox
        const endpointCheckboxes = categoryContent.querySelectorAll('input[type="checkbox"]');
        endpointCheckboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                updateCategoryCheckbox(category, endpointCount);
            });
        });



        // Initial update of category checkbox
        updateCategoryCheckbox(category, endpointCount);
    }
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

function toggleCategory(event) {
    if (event.target.type === 'checkbox') {
        return; // Don't toggle content if checkbox was clicked
    }
    const content = this.nextElementSibling;
    const toggle = this.querySelector('.category-toggle');
    if (content.style.display === 'none') {
        content.style.display = 'block';
        toggle.textContent = '−'; // Using minus sign
    } else {
        content.style.display = 'none';
        toggle.textContent = '+';
    }
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
    const categoryCheckbox = document.getElementById(`category-${category}`);
    if (categoryCheckbox) {
        const checkedEndpoints = document.querySelectorAll(`#category-${category} ~ .category-content input[type="checkbox"]:checked`).length;
        categoryCheckbox.checked = checkedEndpoints === totalEndpoints;
        categoryCheckbox.indeterminate = checkedEndpoints > 0 && checkedEndpoints < totalEndpoints;
    } else {
        console.warn(`Checkbox for category ${category} not found`);
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

function checkAndHighlightPermissions(tokenId) {
    if (!tokenId) {
        document.getElementById('tokenScp').style.display = 'none';
        return;
    }

    fetch(`/get_token_permissions/${tokenId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.permissions) {
                // Display SCP as clickable links
                const tokenScpDiv = document.getElementById('tokenScp');
                const tokenScpContent = document.getElementById('tokenScpContent');
                tokenScpContent.innerHTML = data.permissions.map(perm =>
                    `<a href="https://graphpermissions.merill.net/permission/${perm}" target="_blank">${perm}</a>`
                ).join(' ');
                tokenScpDiv.style.display = 'block';

                const permissions = new Set(data.permissions.map(p => p.replace('.ReadWrite.', '.Read.')));
                const accessAsUserPermissions = new Set(data.permissions
                    .filter(p => p.includes('.AccessAsUser.'))
                    .map(p => p.split('.AccessAsUser.')[0]));

                const endpointStatus = {};

                document.querySelectorAll('.category-wrapper').forEach(category => {
                    const categoryHeader = category.querySelector('.category-header');
                    const categoryName = categoryHeader.textContent.trim().replace(/^\+\s*/, '');
                    const endpointCheckboxes = category.querySelectorAll('input[name="endpoints"]');

                    endpointCheckboxes.forEach(checkbox => {
                        const endpointPath = checkbox.value.split('.');
                        let endpointData = window.GRAPH_ENDPOINTS;
                        for (const key of endpointPath) {
                            if (endpointData && endpointData[key]) {
                                endpointData = endpointData[key];
                            } else {
                                endpointData = null;
                                break;
                            }
                        }

                        if (endpointData && endpointData.path) {
                            const delegatedPerm = endpointData.delegatedPermission ? endpointData.delegatedPermission.replace('.ReadWrite.', '.Read.') : null;
                            const appPerm = endpointData.applicationPermission ? endpointData.applicationPermission.replace('.ReadWrite.', '.Read.') : null;

                            if (permissions.has(delegatedPerm) || permissions.has(appPerm)) {
                                endpointStatus[checkbox.value] = 'allowed';
                            } else if ((delegatedPerm && accessAsUserPermissions.has(delegatedPerm.split('.')[0])) ||
                                       (appPerm && accessAsUserPermissions.has(appPerm.split('.')[0]))) {
                                endpointStatus[checkbox.value] = 'potentially-allowed';
                            } else {
                                endpointStatus[checkbox.value] = 'not-allowed';
                            }
                        }
                    });
                });

                organizeEndpoints(endpointStatus);
            } else {
                document.getElementById('tokenScp').style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error checking permissions:', error);
            document.getElementById('tokenScp').style.display = 'none';
        });
}


function organizeEndpoints(endpointStatus) {
    const endpointsList = document.getElementById('endpointsList');
    const categories = {};

    // Group endpoints by category and sort them
    Object.entries(endpointStatus).forEach(([endpoint, status]) => {
        const [category, ...rest] = endpoint.split('.');
        if (!categories[category]) {
            categories[category] = { allowed: [], potentiallyAllowed: [], notAllowed: [], status: 'not-allowed' };
        }

        const endpointItem = document.querySelector(`input[value="${endpoint}"]`).closest('.endpoint-item');
        endpointItem.classList.remove('highlighted', 'potentially-allowed');

        if (status === 'allowed') {
            endpointItem.classList.add('highlighted');
            categories[category].allowed.push(endpointItem);
            categories[category].status = 'allowed';
        } else if (status === 'potentially-allowed') {
            endpointItem.classList.add('potentially-allowed');
            categories[category].potentiallyAllowed.push(endpointItem);
            if (categories[category].status !== 'allowed') {
                categories[category].status = 'potentially-allowed';
            }
        } else {
            categories[category].notAllowed.push(endpointItem);
        }
    });

    // Sort categories by status
    const sortedCategories = Object.entries(categories).sort((a, b) => {
        const order = { 'allowed': 0, 'potentially-allowed': 1, 'not-allowed': 2 };
        return order[a[1].status] - order[b[1].status];
    });

    // Store current scroll position
    const scrollPosition = endpointsList.scrollTop;

    // Clear existing content
    endpointsList.innerHTML = '';

    // Create and append sorted category wrappers
    sortedCategories.forEach(([category, endpoints]) => {
        const categoryWrapper = document.createElement('div');
        categoryWrapper.className = 'category-wrapper';

        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header';

        // Set category highlight status
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

        const categoryContent = document.createElement('div');
        categoryContent.className = 'category-content';
        categoryContent.style.display = 'none';

        const categoryCheckbox = categoryHeader.querySelector('.category-checkbox');
        categoryCheckbox.addEventListener('change', (e) => {
            e.stopPropagation();
            toggleCategoryCheckbox(e.target);
        });

        // Preserve checked state of category
        const oldCategoryCheckbox = document.getElementById(`category-${category}`);
        if (oldCategoryCheckbox) {
            categoryCheckbox.checked = oldCategoryCheckbox.checked;
            categoryCheckbox.indeterminate = oldCategoryCheckbox.indeterminate;
        }

        // Append endpoints in order: allowed, potentially allowed, not allowed
        endpoints.allowed.concat(endpoints.potentiallyAllowed, endpoints.notAllowed)
            .forEach(endpoint => {
                categoryContent.appendChild(endpoint);

                // Preserve checked state of endpoint
                const checkbox = endpoint.querySelector('input[type="checkbox"]');
                const oldCheckbox = document.getElementById(checkbox.id);
                if (oldCheckbox) {
                    checkbox.checked = oldCheckbox.checked;
                }

                // Add event listener to update category checkbox when endpoint is checked/unchecked
                checkbox.addEventListener('change', () => {
                    updateCategoryCheckbox(category, endpoints.allowed.length + endpoints.potentiallyAllowed.length + endpoints.notAllowed.length);
                });
            });

        categoryWrapper.appendChild(categoryHeader);
        categoryWrapper.appendChild(categoryContent);
        endpointsList.appendChild(categoryWrapper);

        // Update category checkbox state based on its endpoints
        updateCategoryCheckbox(category, endpoints.allowed.length + endpoints.potentiallyAllowed.length + endpoints.notAllowed.length);
    });

    // Restore scroll position
    endpointsList.scrollTop = scrollPosition;
}
function enumerateGraph() {
    const tokenId = document.getElementById('tokenSelect').value;
    if (!tokenId) {
        alert("Please select an access token first.");
        return;
    }

    const endpoints = Array.from(document.querySelectorAll('input[name="endpoints"]:checked')).map(cb => cb.value);
    const formData = new FormData();
    formData.append('token_id', tokenId);
    endpoints.forEach(endpoint => formData.append('endpoints', endpoint));

    fetch('/enumerate_graph', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = '<h2>Enumeration Results</h2>';
        displayResults(data, resultsDiv);
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('results').innerHTML = `<p class="text-danger">Error: ${error.message}</p>`;
    });
}

function displayResults(data, container) {
    console.log("Starting displayResults with data:", data);

    function flattenObject(obj, prefix = '') {
        return Object.keys(obj).reduce((acc, k) => {
            const pre = prefix.length ? prefix + '.' : '';
            if (typeof obj[k] === 'object' && obj[k] !== null) {
                if (Array.isArray(obj[k])) {
                    acc[pre + k] = JSON.stringify(obj[k]);
                } else {
                    Object.assign(acc, flattenObject(obj[k], pre + k));
                }
            } else {
                acc[pre + k] = obj[k];
            }
            return acc;
        }, {});
    }

    function abbreviateFieldName(name, maxLength = 15) {
        if (name.length <= maxLength) return name;
        const parts = name.split(/(?=[A-Z])/);
        let result = parts[0];
        for (let i = 1; i < parts.length && result.length < maxLength - 3; i++) {
            result += parts[i][0];
        }
        return result + '...';
    }

    Object.entries(data).forEach(([endpoint, result], index) => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'result-section mb-3';

        const headerBar = document.createElement('div');
        headerBar.className = 'result-header d-flex align-items-center p-2 bg-light border rounded';

        const toggleIcon = document.createElement('span');
        toggleIcon.className = 'toggle-icon me-2';
        toggleIcon.innerHTML = '▶';

        const headerText = document.createElement('h3');
        headerText.className = 'm-0 flex-grow-1 text-truncate';
        headerText.textContent = endpoint;

        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'btn-group ms-2';

        const csvButton = createButton('CSV', () => downloadCSV(endpoint, result), 'btn-primary');
        const jsonButton = createButton('JSON', () => downloadJSON(endpoint, result), 'btn-success');
        const copyButton = createButton('Copy', () => setTimeout(() => copyToClipboard(`dataTable${index}`), 100), 'btn-outline-secondary');

        buttonGroup.appendChild(csvButton);
        buttonGroup.appendChild(jsonButton);
        buttonGroup.appendChild(copyButton);

        headerBar.appendChild(toggleIcon);
        headerBar.appendChild(headerText);
        headerBar.appendChild(buttonGroup);

        const tableContainer = document.createElement('div');
        tableContainer.id = `dataTable${index}Container`;
        tableContainer.className = 'mt-2';
        tableContainer.style.display = 'none'; // Ensure table is initially closed

        const table = document.createElement('table');
        table.id = `dataTable${index}`;
        table.className = 'display';
        tableContainer.appendChild(table);

        sectionDiv.appendChild(headerBar);
        sectionDiv.appendChild(tableContainer);
        container.appendChild(sectionDiv);

        headerBar.onclick = () => toggleDataTable(`dataTable${index}`);

        let columns = [];
        let dataSet = [];

        const isDataProperty = (key) => !key.startsWith('@odata') && !key.startsWith('__');

        try {
            if (result && typeof result === 'object' && 'value' in result) {
                if (Array.isArray(result.value)) {
                    dataSet = result.value.map(item => flattenObject(item));
                } else if (typeof result.value === 'string') {
                    try {
                        dataSet = JSON.parse(result.value).map(item => flattenObject(item));
                    } catch (e) {
                        console.error("Failed to parse value as JSON", e);
                        dataSet = [{ value: result.value }];
                    }
                } else if (typeof result.value === 'object') {
                    dataSet = [flattenObject(result.value)];
                }
            } else if (Array.isArray(result)) {
                dataSet = result.map(item => flattenObject(item));
            } else if (typeof result === 'object' && result !== null) {
                dataSet = [flattenObject(result)];
            } else {
                dataSet = [{ value: result }];
            }

            if (dataSet.length > 0) {
                columns = Object.keys(dataSet[0])
                    .filter(isDataProperty)
                    .map(key => ({
                        title: abbreviateFieldName(key),
                        data: key,
                        render: function(data, type) {
                            if (type === 'display') {
                                const stringValue = data != null ? String(data) : '';
                                if (stringValue.length > 50) {
                                    return stringValue.substring(0, 47) + '... <a href="#" class="show-more">Show more</a>';
                                }
                                return stringValue;
                            }
                            return data;
                        }
                    }));
            }

            console.log("Columns:", columns);
            console.log("DataSet:", dataSet);

            if (columns.length === 0 || dataSet.length === 0) {
                throw new Error("No valid data structure found");
            }

            const $table = jQuery(`#dataTable${index}`);


            // Initialize DataTable
            const dataTable = $table.DataTable({
                data: dataSet,
                columns: columns,
                pageLength: 10,
                lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]],
                scrollX: true,
                autoWidth: false,
                initComplete: function(settings, json) {
                    $table.css('font-size', '14px');

                    // Add unique id and name attributes to form fields
                    $table.find('input, select, textarea').each(function(i, el) {
                        el.id = `${el.id || 'formField'}_${index}_${i}`;
                        el.name = `${el.name || 'formField'}_${index}_${i}`;
                    });
                },
                error: function(settings, helpPage, message) {
                    console.error(`DataTables error: ${message}`);
                }
            });


            // Add event listener for "Show more" links
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


            console.log(`DataTable initialized for ${endpoint}`);
        } catch (error) {
            console.error(`Error processing endpoint ${endpoint}:`, error);
            tableContainer.innerHTML = `<p>Error processing data for this endpoint: ${error.message}</p>`;
            tableContainer.style.display = 'block';
        }
    });
}


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


function createButton(text, onClick, colorClass) {
    const button = document.createElement('button');
    button.className = `btn btn-sm ${colorClass} me-2`; // Added me-2 for margin
    button.textContent = text;
    button.onclick = (e) => {
        e.stopPropagation(); // Prevent event from bubbling up
        onClick();
    };
    return button;
}

function downloadJSON(endpoint, data) {
    const jsonData = data.value ? { value: data.value } : data;
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${endpoint.replace(/\//g, '_')}_output.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function downloadCSV(endpoint, data) {
    let csvContent = '';
    let flattenedData = [];

    if (Array.isArray(data.value)) {
        flattenedData = data.value.map(item => flattenObject(item));
    } else if (typeof data === 'object') {
        flattenedData = [flattenObject(data)];
    } else {
        console.error('Unexpected data structure');
        return;
    }

    const headers = Object.keys(flattenedData[0]).filter(key => !key.startsWith('@odata'));

    csvContent += headers.join(",") + "\r\n";
    flattenedData.forEach(function(row) {
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
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${endpoint.replace(/\//g, '_')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}


function copyToClipboard(tableId) {
    const table = $(`#${tableId}`).DataTable();

    // Get visible columns
    const visibleColumns = table.columns().indexes().filter(function(value, index) {
        return table.column(value).visible();
    });

    // Create CSV content
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
        const copyBtn = $(`#${tableId}`).closest('.result-section').find('button:contains("Copy")');
        const originalText = copyBtn.text();
        copyBtn.text('Copied!');
        setTimeout(() => {
            copyBtn.text(originalText);
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

function updateCurrentTime() {
    const currentTimeElement = document.getElementById('currentTime');
    if (currentTimeElement) {
        const now = new Date();
        currentTimeElement.textContent = now.toUTCString();
    }
}

function toggleDataTable(tableId) {
    const tableContainer = document.getElementById(`${tableId}Container`);
    const headerBar = tableContainer.previousElementSibling;
    const toggleIcon = headerBar.querySelector('.toggle-icon');

    if (tableContainer.style.display === 'none') {
        tableContainer.style.display = 'block';
        toggleIcon.innerHTML = '▼';
    } else {
        tableContainer.style.display = 'none';
        toggleIcon.innerHTML = '▶';
    }
}

// Utility function to capitalize the first letter of a string
String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

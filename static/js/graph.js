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

function createEndpointItem(category, endpoint, data) {
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
    const checkedEndpoints = document.querySelectorAll(`#category-${category} ~ .category-content input[type="checkbox"]:checked`).length;
    categoryCheckbox.checked = checkedEndpoints === totalEndpoints;
    categoryCheckbox.indeterminate = checkedEndpoints > 0 && checkedEndpoints < totalEndpoints;
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
    Object.entries(data).forEach(([endpoint, result], index) => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'result-section mb-3';

        const headerBar = document.createElement('div');
        headerBar.className = 'result-header d-flex align-items-center p-2 bg-light border rounded';

        const toggleIcon = document.createElement('span');
        toggleIcon.className = 'toggle-icon me-2';
        toggleIcon.innerHTML = '▶'; // Right-pointing triangle

        const headerText = document.createElement('h3');
        headerText.className = 'm-0 flex-grow-1 text-truncate';
        headerText.textContent = endpoint;

        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'btn-group ms-2';

        const downloadCsvButton = document.createElement('button');
        downloadCsvButton.className = 'btn btn-sm btn-success download-btn';
        downloadCsvButton.textContent = 'CSV';
        downloadCsvButton.onclick = (e) => {
            e.stopPropagation();
            downloadCSV(endpoint, result);
            showDownloadStarted(downloadCsvButton, 'CSV');
        };

        const downloadJsonButton = document.createElement('button');
        downloadJsonButton.className = 'btn btn-sm btn-warning download-btn ms-2';
        downloadJsonButton.textContent = 'JSON';
        downloadJsonButton.onclick = (e) => {
            e.stopPropagation();
            downloadJSON(endpoint, result);
            showDownloadStarted(downloadJsonButton, 'JSON');
        };

        const copyButton = document.createElement('button');
        copyButton.className = 'btn btn-sm btn-primary copy-btn ms-2';
        copyButton.textContent = 'Copy';
        copyButton.onclick = (e) => {
            e.stopPropagation();
            copyToClipboard(`codeBlock${index}`);
        };

        buttonGroup.appendChild(downloadCsvButton);
        buttonGroup.appendChild(downloadJsonButton);
        buttonGroup.appendChild(copyButton);

        headerBar.appendChild(toggleIcon);
        headerBar.appendChild(headerText);
        headerBar.appendChild(buttonGroup);

        headerBar.onclick = () => toggleCodeBlock(`codeBlock${index}`);

        const codeBlock = document.createElement('pre');
        codeBlock.id = `codeBlock${index}`;
        codeBlock.className = 'code-block mt-2';
        codeBlock.style.display = 'none';

        let displayData = result.value || result;
        const jsonString = JSON.stringify(displayData, null, 2);
        codeBlock.textContent = jsonString;

        sectionDiv.appendChild(headerBar);
        sectionDiv.appendChild(codeBlock);
        container.appendChild(sectionDiv);
    });
}


function downloadJSON(endpoint, data) {
    const jsonString = JSON.stringify(data, null, 2);
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
    let csv = 'Key,Value\n';

    function processObject(obj, prefix = '') {
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object' && value !== null) {
                processObject(value, prefix + key + '.');
            } else {
                csv += `"${prefix}${key}","${value}"\n`;
            }
        }
    }

    processObject(data);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${endpoint.replace(/\//g, '_')}_output.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}


function showDownloadStarted(button) {
    const originalText = button.textContent;
    button.textContent = 'Downloading...';
    button.disabled = true;
    setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
    }, 2000);
}

function toggleCodeBlock(id) {
    const codeBlock = document.getElementById(id);
    const headerBar = codeBlock.previousElementSibling;
    const toggleIcon = headerBar.querySelector('.toggle-icon');

    if (codeBlock.style.display === 'none') {
        codeBlock.style.display = 'block';
        toggleIcon.innerHTML = '▼'; // Down-pointing triangle
        headerBar.classList.add('active');
} else {
        codeBlock.style.display = 'none';
        toggleIcon.innerHTML = '▶'; // Right-pointing triangle
        headerBar.classList.remove('active');
    }
}

function copyToClipboard(elementId) {
    const el = document.getElementById(elementId);
    let range = document.createRange();
    range.selectNodeContents(el);
    let sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand('copy');
    sel.removeAllRanges();

    // Change button text to indicate copy was successful
    const copyBtn = el.previousElementSibling.querySelector('.copy-btn');
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
        copyBtn.textContent = originalText;
    }, 2000);
}

function updateCurrentTime() {
    const currentTimeElement = document.getElementById('currentTime');
    if (currentTimeElement) {
        const now = new Date();
        currentTimeElement.textContent = now.toUTCString();
    }
}

// Utility function to capitalize the first letter of a string
String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};
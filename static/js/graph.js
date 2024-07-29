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
                // This is an endpoint
                const endpointItem = createEndpointItem(category, subcategory, data);
                subcategoryDiv.appendChild(endpointItem);
                endpointCount++;
            } else {
                // This is a subcategory with nested endpoints
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
            const checkboxes = categoryContent.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
        });

        categoryWrapper.appendChild(categoryHeader);
        categoryWrapper.appendChild(categoryContent);
        endpointsList.appendChild(categoryWrapper);

        // Add event listeners to update category checkbox
        const endpointCheckboxes = categoryContent.querySelectorAll('input[type="checkbox"]');
        endpointCheckboxes.forEach(cb => {
            cb.addEventListener('change', () => updateCategoryCheckbox(category, endpointCount));
        });
    }
}

function updateCategoryCheckbox(category, totalEndpoints) {
    const categoryCheckbox = document.getElementById(`category-${category}`);
    const checkedEndpoints = document.querySelectorAll(`#category-${category} ~ .category-content input[type="checkbox"]:checked`).length;
    categoryCheckbox.checked = checkedEndpoints === totalEndpoints;
    categoryCheckbox.indeterminate = checkedEndpoints > 0 && checkedEndpoints < totalEndpoints;
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
        return; // Don't toggle if checkbox was clicked
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
    const checks = categoryContent.querySelectorAll('input[type="checkbox"]');
    checks.forEach(check => check.checked = checkbox.checked);
}

function selectAll() {
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.checked = true);
}

function deselectAll() {
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.checked = false);
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
                        const endpointPath = checkbox.value.split('.').slice(1).join('.');
                        const endpointData = window.GRAPH_ENDPOINTS[categoryName][endpointPath];

                        if (endpointData) {
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

        // Append endpoints in order: allowed, potentially allowed, not allowed
        endpoints.allowed.concat(endpoints.potentiallyAllowed, endpoints.notAllowed)
            .forEach(endpoint => categoryContent.appendChild(endpoint));

        categoryWrapper.appendChild(categoryHeader);
        categoryWrapper.appendChild(categoryContent);
        endpointsList.appendChild(categoryWrapper);
    });
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
    const codeBlock = document.createElement('pre');
    codeBlock.className = 'code-block';
    codeBlock.style.backgroundColor = '#f4f4f4';
    codeBlock.style.border = '1px solid #ddd';
    codeBlock.style.borderRadius = '4px';
    codeBlock.style.padding = '10px';
    codeBlock.style.whiteSpace = 'pre-wrap';
    codeBlock.style.wordWrap = 'break-word';

    const jsonString = JSON.stringify(data, null, 2);
    codeBlock.textContent = jsonString;

    container.appendChild(codeBlock);
}

function updateCurrentTime() {
    const currentTimeElement = document.getElementById('currentTime');
    const now = new Date();
    currentTimeElement.textContent = now.toUTCString();
}
// graph.js

const GRAPH_ENDPOINTS = JSON.parse(document.getElementById('graph-endpoints-data').textContent);

document.addEventListener('DOMContentLoaded', function() {
    const tokenSelect = document.getElementById('tokenSelect');
    if (tokenSelect) {
        tokenSelect.addEventListener('change', function() {
            checkAndHighlightPermissions(this.value);
        });
    }
    createEndpointsList();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
});

function createEndpointsList() {
    const endpointsList = document.getElementById('endpointsList');
    for (const [category, endpoints] of Object.entries(GRAPH_ENDPOINTS)) {
        const categoryWrapper = document.createElement('div');
        categoryWrapper.className = 'category-wrapper';
        categoryWrapper.dataset.category = category;
        categoryWrapper.innerHTML = `
            <div class="category-header" onclick="toggleCategory(this)">
                <span class="category-toggle">+</span>
                <input class="form-check-input" type="checkbox" onclick="event.stopPropagation(); toggleCategoryCheckbox(this)">
                <span>${category}</span>
            </div>
            <div class="category-content" style="display: none;">
                ${createEndpointCheckboxes(endpoints, category)}
            </div>
        `;
        endpointsList.appendChild(categoryWrapper);
    }
}

function createEndpointCheckboxes(endpoints, category) {
    return Object.entries(endpoints).map(([endpoint, details]) => {
        if (typeof details === 'object' && !details.delegatedPermission) {
            // This is a subcategory
            return `
                <div class="subcategory">
                    <div class="category-header" onclick="toggleCategory(this)">
                        <span class="category-toggle">+</span>
                        <input class="form-check-input" type="checkbox" onclick="event.stopPropagation(); toggleCategoryCheckbox(this)">
                        <span>${endpoint}</span>
                    </div>
                    <div class="category-content" style="display: none;">
                        ${createEndpointCheckboxes(details, `${category}.${endpoint}`)}
                    </div>
                </div>
            `;
        } else {
            // This is an endpoint
            return `
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" name="endpoints" value="${category}.${endpoint}" id="${category}.${endpoint}">
                    <label class="form-check-label" for="${category}.${endpoint}">
                        ${endpoint}
                    </label>
                </div>
            `;
        }
    }).join('');
}



function toggleCategory(header) {
    header.classList.toggle('open');
    const toggle = header.querySelector('.category-toggle');
    const content = header.nextElementSibling;
    if (content.style.display === 'none') {
        content.style.display = 'block';
        toggle.textContent = '-';
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

                document.querySelectorAll('.category-wrapper').forEach(category => {
                    const categoryHeader = category.querySelector('.category-header');
                    const endpointCheckboxes = category.querySelectorAll('input[name="endpoints"]');
                    let categoryHasPermission = false;
                    let categoryPotentiallyAllowed = false;

                    endpointCheckboxes.forEach(checkbox => {
                        const [categoryName, ...endpointParts] = checkbox.value.split('.');
                        let endpointData = GRAPH_ENDPOINTS[categoryName];
                        for (const part of endpointParts) {
                            endpointData = endpointData[part];
                        }
                        if (endpointData) {
                            const delegatedPerm = endpointData.delegatedPermission ? endpointData.delegatedPermission.replace('.ReadWrite.', '.Read.') : null;
                            const appPerm = endpointData.applicationPermission ? endpointData.applicationPermission.replace('.ReadWrite.', '.Read.') : null;

                            if (permissions.has(delegatedPerm) || permissions.has(appPerm)) {
                                categoryHasPermission = true;
                                checkbox.parentElement.style.backgroundColor = 'lightgreen';
                            } else if (delegatedPerm && accessAsUserPermissions.has(delegatedPerm.split('.')[0])) {
                                categoryPotentiallyAllowed = true;
                                checkbox.parentElement.style.backgroundColor = 'yellow';
                            } else if (appPerm && accessAsUserPermissions.has(appPerm.split('.')[0])) {
                                categoryPotentiallyAllowed = true;
                                checkbox.parentElement.style.backgroundColor = 'yellow';
                            } else {
                                checkbox.parentElement.style.backgroundColor = '';
                            }
                        }
                    });

                    if (categoryHasPermission) {
                        categoryHeader.style.backgroundColor = 'lightgreen';
                    } else if (categoryPotentiallyAllowed) {
                        categoryHeader.style.backgroundColor = 'yellow';
                    } else {
                        categoryHeader.style.backgroundColor = '';
                    }
                });
            } else {
                document.getElementById('tokenScp').style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error checking permissions:', error);
            document.getElementById('tokenScp').style.display = 'none';
        });
}


function enumerateGraph() {
    const tokenId = document.getElementById('tokenSelect').value;
    if (!tokenId) {
        alert("Please select an access token first.");
        return;
    }

    checkAndHighlightPermissions(tokenId);

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
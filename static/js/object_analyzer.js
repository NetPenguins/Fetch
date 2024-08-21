document.addEventListener('DOMContentLoaded', function() {
    elements = {
        accessTokenSelect: document.getElementById('accessTokenSelect'),
        tokenScpContent: document.getElementById('tokenScpContent'),
        actionButtons: document.getElementById('actionButtons'),
        results: document.getElementById('results'),
        analyzingObjectInfo: document.getElementById('analyzingObjectInfo'),
        objectDropdown: document.getElementById('objectDropdown')
    };

    // Check for missing elements and log warnings
    Object.entries(elements).forEach(([key, value]) => {
        if (!value) {
            console.warn(`Element with ID "${key}" not found in the DOM`);
        }
    });


    let currentState = {
        objectType: null,
        objectId: null,
        objectName: null,
        permissions: [],
        isAppToken: false
    };

    const cache = {
        objects: {},
        userNames: {}
    };

    if (elements.objectDropdown) elements.objectDropdown.style.display = 'none';

    const objectResults = {
        users: {},
        groups: {},
        servicePrincipals: {},
        applications: {}
    };

    // Load OBJECT_ENDPOINTS from the server
    let OBJECT_ENDPOINTS;
    fetch('/get_object_endpoints')
        .then(response => response.json())
        .then(data => {
            OBJECT_ENDPOINTS = data;
            initializeObjectTypeButtons();
        })
        .catch(error => console.error('Error loading OBJECT_ENDPOINTS:', error));

    function initializeObjectTypeButtons() {
        console.log('Initializing object type buttons');
        const objectTypeButtons = document.querySelectorAll('.object-type-btn');

        if (objectTypeButtons.length === 0) {
            console.warn('No object type buttons found in the DOM');
            return;
        }

        objectTypeButtons.forEach(button => {
            const objectType = button.dataset.objectType;
            if (OBJECT_ENDPOINTS[objectType.charAt(0).toUpperCase() + objectType.slice(1)]) {
                button.addEventListener('click', handleObjectTypeButtonClick);
            } else {
                console.warn(`No endpoint configuration found for object type: ${objectType}`);
                button.disabled = true;
            }
        });

        console.log('Object type buttons initialized');
    }

    function handleObjectTypeButtonClick(e) {
        e.target.classList.toggle('active');

        const objectType = e.target.dataset.objectType;
        console.log('Object type clicked:', objectType);
        const tokenId = elements.accessTokenSelect ? elements.accessTokenSelect.value : null;
        if (tokenId) {
            currentState.objectType = objectType;
            fetchObjects(tokenId, objectType);
        } else {
            alert('Please select an access token first.');
        }
    }

    function fetchObjects(tokenId, objectType) {
        console.log('Fetching objects for type:', objectType);
        showLoading(objectType);
        let url = `/api/${objectType}?token_id=${tokenId}`;

        fetchJson(url)
            .then(data => {
                let objects = data.objects || [];
                currentState.permissions = data.permissions || [];
                currentState.isAppToken = data.is_app_token;

                if (objects.length > 0) {
                    cache.objects = objects.reduce((acc, obj) => {
                        acc[obj.id] = obj;
                        cache.userNames[obj.id] = obj.displayName || obj.userPrincipalName || obj.appId || 'Unknown';
                        return acc;
                    }, {});
                    initializeObjectDropdown(objects, objectType);
                    displayActionButtons(objectType, tokenId);
                    highlightAccessiblePaths(objectType, currentState.permissions, currentState.isAppToken);
                    if (elements.objectDropdown) elements.objectDropdown.style.display = 'block';
                } else {
                    console.warn('No objects returned for type:', objectType);
                    showNotification(`No ${objectType} found`, 'warning');
                }
            })
            .catch(error => handleFetchError(error, objectType))
            .finally(() => removeLoading(objectType));
    }

    function handleAccessTokenChange() {
        const tokenId = this.value;
        if (tokenId) {
            checkTokenExpiration(tokenId);
        } else {
            if (elements.tokenScpContent) {
                elements.tokenScpContent.textContent = '';
            }
        }
        clearResults(true);
    }

    function checkTokenExpiration(tokenId) {
        fetchJson(`/token_details/${tokenId}`)
            .then(data => {
                const expTime = data.highlighted_claims && data.highlighted_claims.exp;
                const currentTime = Math.floor(Date.now() / 1000);
                if (expTime && expTime < currentTime) {
                    showNotification('The selected token has expired. Please choose a valid token.', 'warning');
                    if (elements.tokenScpContent) {
                        elements.tokenScpContent.textContent = 'Token expired';
                    }
                } else {
                    fetchTokenScp(tokenId);
                }
            })
            .catch(error => handleError('Error checking token expiration', error));
    }

    function fetchTokenScp(tokenId) {
        fetchJson(`/get_token_permissions/${tokenId}`)
            .then(data => {
                if (elements.tokenScpContent && data.permissions) {
                    displayTokenPermissions(data.permissions);
                }
            })
            .catch(error => handleError('Error fetching token SCP', error));
    }

    function displayTokenPermissions(permissions) {
        if (elements.tokenScpContent) {
            elements.tokenScpContent.innerHTML = permissions.map(perm =>
                `<a href="https://graphpermissions.merill.net/permission/${encodeURIComponent(perm)}" target="_blank">${perm}</a>`
            ).join(' ');
        }
    }

    function highlightAccessiblePaths(objectType, permissions, isAppToken) {
        console.log('Highlighting paths for:', objectType, 'Permissions:', permissions, 'Is App Token:', isAppToken);

        const normalizedObjectType = objectType.charAt(0).toUpperCase() + objectType.slice(1);
        const endpointConfig = OBJECT_ENDPOINTS[normalizedObjectType] && OBJECT_ENDPOINTS[normalizedObjectType][objectType.toLowerCase()];

        if (!endpointConfig || !endpointConfig.actions) {
            console.error(`No endpoint configuration found for ${objectType}`);
            return;
        }

        const actionButtons = document.querySelectorAll(`.action-btn[data-object-type="${objectType}"]`);

        actionButtons.forEach(button => {
            const action = button.dataset.action;
            const actionConfig = endpointConfig.actions[action];

            if (!actionConfig) {
                console.error(`No configuration found for action: ${action}`);
                return;
            }

            const requiredPermission = isAppToken ? actionConfig.applicationPermission : actionConfig.delegatedPermission;

            console.log('Action:', action, 'Required Permission:', requiredPermission);

            if (requiredPermission) {
                const status = getPermissionStatus(requiredPermission, permissions, isAppToken);
                updateButtonStatus(button, status);
            } else {
                console.warn(`No required permission found for action: ${action}`);
                updateButtonStatus(button, 'not-allowed');
            }
        });
    }

    function getPermissionStatus(requiredPermission, permissions, isAppToken) {
        if (!requiredPermission) {
            console.warn('Required permission is undefined');
            return 'not-allowed';
        }

        if (!Array.isArray(permissions)) {
            console.warn('Permissions is not an array');
            return 'not-allowed';
        }

        const permSet = new Set(permissions.map(p => p.toLowerCase()));
        const permissionParts = requiredPermission.toLowerCase().split('.');

        if (permSet.has(requiredPermission.toLowerCase())) {
            return 'allowed';
        }

        for (let i = 1; i < permissionParts.length; i++) {
            const partialPerm = permissionParts.slice(0, i).join('.');
            if (permSet.has(partialPerm)) {
                return 'potentially-allowed';
            }
        }

        return 'not-allowed';
    }



    function updateButtonStatus(button, status) {
        button.classList.remove('btn-success', 'btn-warning', 'btn-secondary');
        button.classList.add(getButtonClass(status));
    }


    function initializeObjectDropdown(objects, objectType) {
        if (!elements.objectDropdown) {
            console.error('Object dropdown element not found');
            return;
        }

        elements.objectDropdown.innerHTML = `<option value="">Select a ${objectType}</option>`;

        objects.forEach(obj => {
            const option = document.createElement('option');
            option.value = obj.id;
            option.textContent = `${obj.displayName || obj.userPrincipalName || obj.appId} / ${obj.id}`;
            elements.objectDropdown.appendChild(option);
        });

        try {
            $(elements.objectDropdown).select2({
                placeholder: `Select a ${objectType}`,
                allowClear: true,
                width: '100%'
            });

            $(elements.objectDropdown).on('change', function() {
                const selectedObjectId = this.value;
                const selectedObject = objects.find(obj => obj.id === selectedObjectId);
                if (selectedObject) {
                    handleObjectSelection(selectedObject.id, selectedObject.displayName || selectedObject.userPrincipalName || selectedObject.appId, objectType);
                }
            });
        } catch (error) {
            console.error('Error initializing Select2:', error);
        }
    }

    function handleObjectSelection(objectId, objectName, objectType) {
        currentState.objectId = objectId;
        currentState.objectName = objectName;
        currentState.objectType = objectType;
        if (elements.analyzingObjectInfo) {
            elements.analyzingObjectInfo.textContent = `Analyzing: ${objectType} | ID: ${objectId} | Name: ${objectName}`;
            elements.analyzingObjectInfo.style.display = 'block';
        }
    }

function displayActionButtons(objectType, tokenId) {
    if (!elements.actionButtons) {
        console.error('Action buttons container not found');
        return;
    }
    elements.actionButtons.innerHTML = '';

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'row row-cols-2 g-2';

    const endpointConfig = OBJECT_ENDPOINTS[objectType.charAt(0).toUpperCase() + objectType.slice(1)][objectType.toLowerCase()];
    if (endpointConfig && endpointConfig.actions) {
        const actions = Object.entries(endpointConfig.actions);

        // Sort actions based on their permission status
        actions.sort((a, b) => {
            const statusA = getPermissionStatus(a[1].delegatedPermission || a[1].applicationPermission, currentState.permissions, currentState.isAppToken);
            const statusB = getPermissionStatus(b[1].delegatedPermission || b[1].applicationPermission, currentState.permissions, currentState.isAppToken);
            return getSortOrder(statusB) - getSortOrder(statusA); // 'allowed' comes first
        });

        actions.forEach(([action, actionConfig]) => {
            const buttonCol = document.createElement('div');
            buttonCol.className = 'col';
            const requiredPermission = currentState.isAppToken ? actionConfig.applicationPermission : actionConfig.delegatedPermission;
            const status = getPermissionStatus(requiredPermission, currentState.permissions, currentState.isAppToken);
            const buttonClass = getButtonClass(status);

            buttonCol.innerHTML = `
                <button class="btn ${buttonClass} w-100 action-btn" data-action="${action}" data-object-type="${objectType}">
                    ${action}
                </button>
            `;
            buttonCol.querySelector('.action-btn').addEventListener('click', () => {
                const selectedObjectId = elements.objectDropdown.value;
                if (selectedObjectId) {
                    fetchObjectAction(tokenId, objectType, action, selectedObjectId);
                } else {
                    alert('Please select an object first.');
                }
            });
            buttonContainer.appendChild(buttonCol);
        });
    }

        const executeAllCol = document.createElement('div');
        executeAllCol.className = 'col-12 mt-2';
        executeAllCol.innerHTML = `
            <button class="btn btn-success w-100 execute-all-btn">Execute All</button>
        `;
        executeAllCol.querySelector('.execute-all-btn').addEventListener('click', () => {
            const selectedObjectId = elements.objectDropdown.value;
            if (selectedObjectId) {
                executeAllActions(tokenId, objectType, selectedObjectId);
            } else {
                alert('Please select an object first.');
            }
        });
        buttonContainer.appendChild(executeAllCol);

        elements.actionButtons.appendChild(buttonContainer);
    }


    function getSortOrder(status) {
    switch (status) {
        case 'allowed':
            return 0;
        case 'potentially-allowed':
            return 1;
        case 'not-allowed':
        default:
            return 2;
    }
}

    function getButtonClass(status) {
        switch (status) {
            case 'allowed':
                return 'btn-success';
            case 'potentially-allowed':
                return 'btn-warning';
            case 'not-allowed':
            default:
                return 'btn-secondary';
        }
    }


    function fetchObjectAction(tokenId, objectType, action, objectId) {
        showLoading(objectType, action);

        let url = `/api/${objectType}/${action}?token_id=${tokenId}&user_id=${objectId}`;

        console.log(`Requesting URL: ${url}`);  // Keep this for debugging

        fetchJson(url)
            .then(data => {
                if (!objectResults[objectType][objectId]) {
                    objectResults[objectType][objectId] = {};
                }
                objectResults[objectType][objectId][action] = {
                    actionResult: data,
                    isExternalOwnership: data.isExternalOwnership
                };
                displayActionResult(objectType, objectId, action);
            })
            .catch(error => {
                console.error(`Error fetching ${action} for ${objectType}:`, error);
                if (!objectResults[objectType][objectId]) {
                    objectResults[objectType][objectId] = {};
                }
                objectResults[objectType][objectId][action] = {
                    error: error.message,
                    status: error.status || 'Unknown'
                };
                displayActionResult(objectType, objectId, action);
                showNotification(`Failed to fetch ${action} for ${objectType}`, 'error');
            })
            .finally(() => {
                removeLoading(objectType);
            });
    }


function createResultsHeader() {
    return `
        <div class="enumeration-results-header d-flex justify-content-between align-items-center mb-3">
            <div class="legend me-3">
                <span class="me-2"><i class="bi bi-check-circle-fill text-success"></i> Accessible</span>
                <span class="me-2"><i class="bi bi-exclamation-triangle-fill text-warning"></i> Potentially accessible</span>
                <span class="me-2"><i class="bi bi-square text-secondary"></i> Empty</span>
                <span class="me-2"><i class="bi bi-dash-circle-fill text-secondary"></i> Not accessible</span>
                <span><i class="bi bi-x-circle-fill text-danger"></i> Error</span>
            </div>
            <h2>Enumeration Results</h2>
        </div>
    `;
}


function displayActionResult(objectType, objectId, action) {
    debugLog(`Entering displayActionResult for ${objectType}, ${objectId}, ${action}`);
    const result = objectResults[objectType][objectId][action];
    const resultSection = createResultSection(action, result, objectId, cache.userNames[objectId] || 'Unknown');

    if (!elements.results) {
        console.error('Results element is null');
        return;
    }

    // Check if the header already exists, if not, add it
    if (!elements.results.querySelector('.enumeration-results-header')) {
        elements.results.insertAdjacentHTML('afterbegin', createResultsHeader());
    }

    let typeResultsDiv = elements.results.querySelector(`.type-results[data-object-type="${objectType}"]`);
    if (!typeResultsDiv) {
        typeResultsDiv = document.createElement('div');
        typeResultsDiv.className = 'type-results mb-4';
        typeResultsDiv.setAttribute('data-object-type', objectType);
        typeResultsDiv.innerHTML = `
            <h3 class="category-header">
                ${objectType} Results
                <button class="collapse-category-btn" data-object-type="${objectType}">Collapse</button>
            </h3>
            <div class="category-results" data-object-type="${objectType}"></div>
        `;
        elements.results.appendChild(typeResultsDiv);

        // Add event listener to the collapse category button
        const collapseCategoryBtn = typeResultsDiv.querySelector('.collapse-category-btn');
        if (collapseCategoryBtn) {
            collapseCategoryBtn.addEventListener('click', function() {
                const categoryResults = typeResultsDiv.querySelector(`.category-results[data-object-type="${objectType}"]`);
                if (categoryResults) {
                    categoryResults.style.display = categoryResults.style.display === 'none' ? 'block' : 'none';
                    this.textContent = categoryResults.style.display === 'none' ? 'Expand' : 'Collapse';
                }
            });
        }
    }

    const categoryResultsDiv = typeResultsDiv.querySelector(`.category-results[data-object-type="${objectType}"]`);
    if (!categoryResultsDiv) {
        console.error('Category results div not found');
        return;
    }

    let userResultsDiv = categoryResultsDiv.querySelector(`.user-results[data-object-id="${objectId}"]`);
    if (!userResultsDiv) {
        userResultsDiv = document.createElement('div');
        userResultsDiv.className = 'user-results mb-3';
        userResultsDiv.setAttribute('data-object-id', objectId);
        userResultsDiv.innerHTML = `
            <h4 class="object-header">
                ${cache.userNames[objectId] || 'Unknown'} (${objectId})
                <button class="collapse-btn" data-object-id="${objectId}">Collapse</button>
            </h4>
            <div class="object-results" data-object-id="${objectId}"></div>
        `;
        categoryResultsDiv.appendChild(userResultsDiv);

        // Add event listener to the collapse button
        const collapseBtn = userResultsDiv.querySelector('.collapse-btn');
        if (collapseBtn) {
            collapseBtn.addEventListener('click', function() {
                const objectResults = userResultsDiv.querySelector(`.object-results[data-object-id="${objectId}"]`);
                if (objectResults) {
                    objectResults.style.display = objectResults.style.display === 'none' ? 'block' : 'none';
                    this.textContent = objectResults.style.display === 'none' ? 'Expand' : 'Collapse';
                }
            });
        }
    }

    const objectResultsDiv = userResultsDiv.querySelector(`.object-results[data-object-id="${objectId}"]`);
    if (objectResultsDiv) {
        const existingResultSection = objectResultsDiv.querySelector(`#result-${objectId}-${action}`);
        if (existingResultSection) {
            existingResultSection.replaceWith(resultSection);
        } else {
            objectResultsDiv.appendChild(resultSection);
        }
    } else {
        console.error('Object results div not found');
    }

    sortResults();
    debugLog(`Exiting displayActionResult for ${objectType}, ${objectId}, ${action}`);
}


function createResultSection(action, data, objectId, displayName) {
    const resultSection = document.createElement('div');
    resultSection.id = `result-${objectId}-${action}`;
    resultSection.className = 'mb-3 result-section';

    let icon, statusClass, status, content;
    if (data.error) {
        icon = 'bi-x-octagon';
        statusClass = 'text-danger';
        status = 'error';
        content = `Error: ${data.error} (Status: ${data.status})`;
    } else if (isEmptyResult(data.actionResult)) {
        icon = 'bi-square';  // Using a square icon for empty results
        statusClass = 'text-secondary';
        status = 'empty';
        content = 'No data available';
    } else if (data.isExternalOwnership) {
        icon = 'bi-exclamation-triangle';
        statusClass = 'text-warning';
        status = 'potentially-accessible';
        content = JSON.stringify(data.actionResult, null, 2);
    } else {
        icon = 'bi-check-circle';
        statusClass = 'text-success';
        status = 'accessible';
        content = JSON.stringify(data.actionResult, null, 2);
    }

    resultSection.innerHTML = `
        <div class="card" data-status="${status}">
            <div class="card-header" id="heading-${objectId}-${action}">
                <h5 class="mb-0">
                    <button class="btn btn-link collapsed ${statusClass}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${objectId}-${action}">
                        <i class="bi ${icon} me-2"></i>${action}
                    </button>
                </h5>
            </div>
            <div id="collapse-${objectId}-${action}" class="collapse" aria-labelledby="heading-${objectId}-${action}">
                <div class="card-body">
                    <pre class="results-container"><code>${content}</code></pre>
                    <button class="btn btn-sm btn-outline-secondary copy-btn">Copy</button>
                </div>
            </div>
        </div>
    `;

    resultSection.querySelector('.copy-btn').addEventListener('click', () => copyToClipboard(content));
    resultSection.querySelector('.btn-link').addEventListener('click', function() {
        this.querySelector('i').classList.toggle('bi-chevron-down');
        this.querySelector('i').classList.toggle('bi-chevron-up');
    });

    return resultSection;
}



// Add this debug function at the beginning of your script
function debugLog(message) {
    console.log(`DEBUG: ${message}`);
}

function isEmptyResult(result) {
    if (result === undefined || result === null) return true;
    if (Array.isArray(result) && result.length === 0) return true;
    if (typeof result === 'object' && Object.keys(result).length === 0) return true;
    if (result === '') return true;
    if (typeof result === 'object' && result.value && Array.isArray(result.value) && result.value.length === 0) return true;
    return false;
}




// Update the sortResults function with error checking
function sortResults() {
    const sortOrder = ['accessible', 'potentially-accessible', 'empty', 'not-accessible', 'error'];

    if (!elements.results) {
        console.error('Results element is null');
        return;
    }

    const typeResultsDivs = Array.from(elements.results.querySelectorAll('.type-results'));
    debugLog(`Found ${typeResultsDivs.length} type results divs`);

    typeResultsDivs.forEach(typeResultsDiv => {
        const categoryResultsDiv = typeResultsDiv.querySelector('.category-results');
        if (!categoryResultsDiv) {
            console.error('Category results div not found');
            return;
        }

        const userResultsDivs = Array.from(categoryResultsDiv.querySelectorAll('.user-results'));
        debugLog(`Found ${userResultsDivs.length} user results divs`);

        userResultsDivs.forEach(userResultsDiv => {
            const resultElements = Array.from(userResultsDiv.querySelectorAll('.result-section'));
            debugLog(`Found ${resultElements.length} result elements`);

            if (resultElements.length === 0) return;

            resultElements.sort((a, b) => {
                const statusA = a.querySelector('.card')?.dataset.status || '';
                const statusB = b.querySelector('.card')?.dataset.status || '';
                return sortOrder.indexOf(statusA) - sortOrder.indexOf(statusB);
            });

            const objectResultsDiv = userResultsDiv.querySelector('.object-results');
            if (objectResultsDiv) {
                resultElements.forEach(element => objectResultsDiv.appendChild(element));
            } else {
                console.error('Object results div not found');
            }
        });
    });
    debugLog('Exiting sortResults function');
}



    function executeAllActions(tokenId, objectType, objectId) {
        let normalizedObjectType = objectType.charAt(0).toUpperCase() + objectType.slice(1);
        if (normalizedObjectType === 'Serviceprincipals') {
            normalizedObjectType = 'ServicePrincipals';
        }
        const endpointConfig = OBJECT_ENDPOINTS[normalizedObjectType][objectType.toLowerCase()];
        if (endpointConfig && endpointConfig.actions) {
            Object.keys(endpointConfig.actions).forEach(action => {
                fetchObjectAction(tokenId, objectType, action, objectId);
            });
        } else {
            console.error(`No actions found for object type: ${objectType}`);
            showNotification(`No actions available for ${objectType}`, 'error');
        }
    }

    function showLoading(objectType, action) {
        console.log('Showing loading for type:', objectType, 'action:', action);
        if (!OBJECT_ENDPOINTS[objectType.charAt(0).toUpperCase() + objectType.slice(1)]) {
            console.error(`Invalid object type: ${objectType}`);
            return;
        }

        let typeResultsDiv = Array.from(elements.results.querySelectorAll('.type-results')).find(div =>
            div.querySelector('h3').textContent === `${objectType} Results`
        );

        if (!typeResultsDiv) {
            typeResultsDiv = document.createElement('div');
            typeResultsDiv.className = 'type-results mb-4';
            typeResultsDiv.innerHTML = `<h3>${objectType} Results</h3>`;
            elements.results.appendChild(typeResultsDiv);
        }

        let loadingIndicator = typeResultsDiv.querySelector('.loading-indicator');
        if (!loadingIndicator) {
            loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'loading-indicator';
            typeResultsDiv.appendChild(loadingIndicator);
        }

        loadingIndicator.textContent = action ? `Loading ${action}...` : 'Loading...';
    }

    function removeLoading(objectType) {
        const typeResultsDiv = Array.from(elements.results.querySelectorAll('.type-results')).find(div =>
            div.querySelector('h3').textContent === `${objectType} Results`
        );
        if (typeResultsDiv) {
            const loadingIndicator = typeResultsDiv.querySelector('.loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
        }
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text)
            .then(() => showNotification('Copied to clipboard', 'success'))
            .catch(err => {
                console.error('Failed to copy: ', err);
                showNotification('Failed to copy to clipboard', 'error');
            });
    }

    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
        notification.style.zIndex = '1050';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    }

    function handleFetchError(error, objectType) {
        console.error(`Error fetching ${objectType}:`, error);
        let errorMessage = `Error fetching ${objectType}: ${error.message}`;
        if (error.response) {
            errorMessage += ` (Status: ${error.response.status})`;
        }
        showError(objectType, errorMessage);
        if (elements.objectDropdown) {
            elements.objectDropdown.innerHTML = `<option value="">Failed to load ${objectType}</option>`;
            try {
                $(elements.objectDropdown).select2({
                    placeholder: `Failed to load ${objectType}`,
                    disabled: true
                });
            } catch (error) {
                console.error('Error reinitializing Select2:', error);
            }
        }
        removeLoading(objectType);
        showNotification(errorMessage, 'error');
    }

    function showError(action, message) {
        let resultSection = document.getElementById(`result-${action}`);
        if (!resultSection) {
            resultSection = document.createElement('div');
            resultSection.id = `result-${action}`;
            resultSection.className = 'mb-3';
            elements.results.appendChild(resultSection);
        }
        resultSection.innerHTML = `<div class="alert alert-danger">${message}</div>`;
    }

    function clearResults(clearAll = false) {
        if (clearAll) {
            if (elements.results) elements.results.innerHTML = '';
            Object.keys(objectResults).forEach(key => objectResults[key] = {});
            cache.userNames = {};
            if (elements.objectDropdown) elements.objectDropdown.style.display = 'none';
        }
        if (elements.analyzingObjectInfo) elements.analyzingObjectInfo.style.display = 'none';
    }

    function handleError(message, error) {
        console.error(message, error);
        showNotification(message, 'error');
    }

    function initializeEventListeners() {
        if (elements.accessTokenSelect) {
            elements.accessTokenSelect.addEventListener('change', handleAccessTokenChange);
        } else {
            console.warn('Access token select element not found');
        }
    }

    function fetchJson(url, options = {}) {
        return fetch(url, options).then(handleResponse);
    }

    function handleResponse(response) {
        if (!response.ok) {
            return response.text().then(text => {
                try {
                    const json = JSON.parse(text);
                    throw new Error(json.error || `HTTP error! status: ${response.status}`);
                } catch (e) {
                    throw new Error(`HTTP error! status: ${response.status}, message: ${text}`);
                }
            });
        }
        return response.json();
    }

    initializeEventListeners();
});
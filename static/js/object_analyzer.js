document.addEventListener('DOMContentLoaded', function() {
    const accessTokenSelect = document.getElementById('accessTokenSelect');
    const tokenScpContent = document.getElementById('tokenScpContent');
    const actionButtons = document.getElementById('actionButtons');
    const results = document.getElementById('results');
    const analyzingObjectInfo = document.getElementById('analyzingObjectInfo');
    const objectDropdown = document.getElementById('objectDropdown');

    let currentObjectType = null;
    let currentObjectId = null;
    let currentObjectName = null;
    let objectsCache = {};
    let userNames = {};

    if (objectDropdown) objectDropdown.style.display = 'none';


    let objectResults = {
        users: {},
        groups: {},
        servicePrincipals: {}
    };

const objectTypes = {
    users: {
        title: 'Users',
        icon: 'bi-people-fill',
        actions: {
            appRoleAssignments: 'App Role Assignments',
            calendars: 'Calendars',
            oauth2PermissionGrants: 'OAuth2 Permission Grants',
            ownedDevices: 'Owned Devices',
            ownedObjects: 'Owned Objects',
            registeredDevices: 'Registered Devices',
            notebooks: 'OneNote Notebooks',
            directReports: 'Direct Reports',
            people: 'People',
            contacts: 'Contacts',
            plannerTasks: 'Planner Tasks',
            sponsors: 'Sponsors',
            memberOf: 'Member Of',
            getMemberGroups: 'Get Member Groups'
        }
    },
    groups: {
        title: 'Groups',
        icon: 'bi-diagram-3-fill',
        actions: {}
    },
    servicePrincipals: {
        title: 'Service Principals',
        icon: 'bi-gear-fill',
        actions: {
            details: 'Details',
            appRoleAssignments: 'App Role Assignments',
            appRoleAssignedTo: 'App Role Assigned To',
            oauth2PermissionGrants: 'OAuth2 Permission Grants',
            delegatedPermissionClassifications: 'Delegated Permission Classifications',
            owners: 'Owners',
            claimsMappingPolicies: 'Claims Mapping Policies',
            homeRealmDiscoveryPolicies: 'Home Realm Discovery Policies',
            tokenIssuancePolicies: 'Token Issuance Policies',
            tokenLifetimePolicies: 'Token Lifetime Policies',
            memberOf: 'Member Of',
            getMemberGroups: 'Get Member Groups',
            getMemberObjects: 'Get Member Objects',
            ownedObjects: 'Owned Objects'
        }
    }
};


    function handleAccessTokenChange() {
        const tokenId = this.value;
        if (tokenId) {
            checkTokenExpiration(tokenId);
        } else {
            tokenScpContent.textContent = '';
        }
        clearResults(true);
    }

    function checkTokenExpiration(tokenId) {
        fetch(`/token_details/${tokenId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const expTime = data.highlighted_claims.exp;
                    const currentTime = Math.floor(Date.now() / 1000);
                    if (expTime < currentTime) {
                        showNotification('The selected token has expired. Please choose a valid token.', 'warning');
                        tokenScpContent.textContent = 'Token expired';
                    } else {
                        fetchTokenScp(tokenId);
                    }
                } else {
                    throw new Error(data.error || 'Failed to fetch token details');
                }
            })
            .catch(error => {
                console.error('Error checking token expiration:', error);
                showNotification('Error checking token expiration', 'error');
            });
    }


    function handleObjectTypeButtonClick(e) {
        const objectType = e.target.closest('.object-type-btn').dataset.objectType;
        console.log('Object type clicked:', objectType);
        const tokenId = accessTokenSelect.value;
        if (tokenId) {
            currentObjectType = objectType;
            fetchObjects(tokenId, objectType);
            // Do not clear results here
        } else {
            alert('Please select an access token first.');
        }
    }



    function fetchTokenScp(tokenId) {
        fetch(`/get_token_permissions/${tokenId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    tokenScpContent.textContent = data.permissions.join('\n');
                } else {
                    throw new Error(data.error || 'Failed to fetch token permissions');
                }
            })
            .catch(error => {
                console.error('Error fetching token SCP:', error);
                tokenScpContent.textContent = 'Error fetching token permissions';
            });
    }


    function fetchObjects(tokenId, objectType) {
        console.log('Fetching objects for type:', objectType);
        showLoading(objectType);
        let url = `/api/${objectType}?token_id=${tokenId}`;
        if (objectType === 'servicePrincipals') {
            url += '&$select=id,displayName,appId,appOwnerOrganizationId';
        }
        fetch(url)
            .then(handleResponse)
            .then(data => {
                objectsCache = data.reduce((acc, obj) => {
                    acc[obj.id] = obj;
                    userNames[obj.id] = obj.displayName || obj.userPrincipalName || obj.appId || 'Unknown';
                    return acc;
                }, {});
                initializeObjectDropdown(data, objectType);
                removeLoading(objectType);
                if (objectDropdown) objectDropdown.style.display = 'block';
            })
            .catch(error => handleFetchError(error, objectType));
    }





    function handleResponse(response) {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || `HTTP error! status: ${response.status}`);
            });
        }
        return response.json();
    }

    function handleFetchError(error, objectType) {
        console.error(`Error fetching ${objectType}:`, error);
        showError(objectType, `Error fetching ${objectType}: ${error.message}`);
        if (objectDropdown) {
            objectDropdown.innerHTML = `<option value="">Failed to load ${objectType}</option>`;
            try {
                $(objectDropdown).select2({
                    placeholder: `Failed to load ${objectType}`,
                    disabled: true
                });
            } catch (error) {
                console.error('Error reinitializing Select2:', error);
            }
        }
        removeLoading(objectType);
    }

    const INTERNAL_ORG_IDS = [
        "f8cdef31-a31e-4b4a-93e4-5f571e91255a",
        "cdc5aeea-15c5-4db6-b079-fcadd2505dc2"
    ];

    function initializeObjectDropdown(objects, objectType) {
        if (!objectDropdown) {
            console.error('Object dropdown element not found');
            return;
        }

        objectDropdown.innerHTML = `<option value="">Select a ${objectType}</option>`;

        // Sort objects, placing external service principals first
        objects.sort((a, b) => {
            const aIsExternal = !INTERNAL_ORG_IDS.includes(a.appOwnerOrganizationId);
            const bIsExternal = !INTERNAL_ORG_IDS.includes(b.appOwnerOrganizationId);
            if (aIsExternal && !bIsExternal) return -1;
            if (!aIsExternal && bIsExternal) return 1;
            return 0;
        });

        objects.forEach(obj => {
            const option = document.createElement('option');
            option.value = obj.id;
            const isExternal = !INTERNAL_ORG_IDS.includes(obj.appOwnerOrganizationId);
            option.textContent = `${obj.displayName || obj.userPrincipalName || obj.appId} / ${obj.id}`;

            if (isExternal) {
                option.classList.add('external-ownership');
                option.textContent += ' (External Ownership)';
            }

            objectDropdown.appendChild(option);
        });

        try {
            $(objectDropdown).select2({
                placeholder: `Select a ${objectType}`,
                allowClear: true,
                width: '100%',
                templateResult: formatObjectOption
            });

            $(objectDropdown).on('change', function() {
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


    function formatObjectOption(object) {
        if (!object.id) {
            return object.text;
        }
        const isExternal = $(object.element).hasClass('external-ownership');
        const $object = $(
            `<span>${object.text}</span>`
        );
        if (isExternal) {
            $object.append('<span class="external-ownership-note"> (Not Internal)</span>');
        }
        return $object;
    }



    function handleObjectSelection(objectId, objectName, objectType) {
        currentObjectId = objectId;
        currentObjectName = objectName;
        currentObjectType = objectType;
        const tokenId = accessTokenSelect.value;
        displayActionButtons(objectType, tokenId, objectId);
    }

    function displayActionButtons(objectType, tokenId, objectId = null) {
        actionButtons.innerHTML = '';

        if (objectId) {
            analyzingObjectInfo.textContent = `Analyzing: ${objectTypes[objectType].title} | ID: ${objectId} | Name: ${currentObjectName}`;
            analyzingObjectInfo.style.display = 'block';
        } else {
            analyzingObjectInfo.style.display = 'none';
        }

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'row row-cols-2 g-2';

        Object.entries(objectTypes[objectType].actions).forEach(([action, title]) => {
            const buttonCol = document.createElement('div');
            buttonCol.className = 'col';
            buttonCol.innerHTML = `
                <button class="btn btn-warning w-100 action-btn" data-action="${action}">
                    ${title}
                </button>
            `;
            buttonCol.querySelector('.action-btn').addEventListener('click', () => fetchObjectAction(tokenId, objectType, action, objectId));
            buttonContainer.appendChild(buttonCol);
        });

        const executeAllCol = document.createElement('div');
        executeAllCol.className = 'col-12 mt-2';
        executeAllCol.innerHTML = `
            <button class="btn btn-success w-100 execute-all-btn">Execute All</button>
        `;
        executeAllCol.querySelector('.execute-all-btn').addEventListener('click', () => executeAllActions(tokenId, objectType, objectId));
        buttonContainer.appendChild(executeAllCol);

        actionButtons.appendChild(buttonContainer);
    }

function fetchObjectAction(tokenId, objectType, action, objectId) {
    showLoading(objectType, action);

    let url = `/api/${objectType}/${action}?token_id=${tokenId}`;
    if (objectId) {
        url += `&user_id=${objectId}`;
    }

    let method = 'GET';
    let body = null;

    // Special handling for specific actions
    switch (action) {
        case 'getMemberGroups':
        case 'getMemberObjects':
            method = 'POST';
            body = JSON.stringify({
                securityEnabledOnly: false
            });
            break;
        // Add more cases here for other actions that require special handling
    }

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: body
    })
    .then(handleResponse)
    .then(data => {
        if (!objectResults[objectType][objectId]) {
            objectResults[objectType][objectId] = {};
        }
        // Only store the actionResult for this specific action
        objectResults[objectType][objectId][action] = {
            actionResult: data.actionResult,
            isExternalOwnership: data.isExternalOwnership
        };
        displayActionResult(objectType, objectId, action);
        removeLoading(objectType);
    })
    .catch(error => {
        console.error(`Error fetching ${action}:`, error);
        if (!objectResults[objectType][objectId]) {
            objectResults[objectType][objectId] = {};
        }
        objectResults[objectType][objectId][action] = { error: error.message };
        displayActionResult(objectType, objectId, action);
        removeLoading(objectType);
    });
}


function displayActionResult(objectType, objectId, action) {
    const result = objectResults[objectType][objectId][action];
    const resultSection = createResultSection(action, result, objectId, userNames[objectId] || 'Unknown');

    // Find or create the type results div
    let typeResultsDiv = document.querySelector(`.type-results[data-object-type="${objectType}"]`);
    if (!typeResultsDiv) {
        typeResultsDiv = document.createElement('div');
        typeResultsDiv.className = 'type-results mb-4';
        typeResultsDiv.setAttribute('data-object-type', objectType);
        typeResultsDiv.innerHTML = `<h3>${objectTypes[objectType].title} Results</h3>`;
        results.appendChild(typeResultsDiv);
    }

    // Find or create the user results div
    let userResultsDiv = typeResultsDiv.querySelector(`.user-results[data-object-id="${objectId}"]`);
    if (!userResultsDiv) {
        userResultsDiv = document.createElement('div');
        userResultsDiv.className = 'user-results mb-3';
        userResultsDiv.setAttribute('data-object-id', objectId);
        userResultsDiv.innerHTML = `<h4>${userNames[objectId] || 'Unknown'} (${objectId})</h4>`;
        typeResultsDiv.appendChild(userResultsDiv);
    }

    // Replace or append the result section
    const existingResultSection = userResultsDiv.querySelector(`#result-${objectId}-${action}`);
    if (existingResultSection) {
        existingResultSection.replaceWith(resultSection);
    } else {
        userResultsDiv.appendChild(resultSection);
    }

    sortResults();
}



    function displayAllResults() {
        results.innerHTML = '';
        Object.entries(objectResults).forEach(([type, typeResults]) => {
            if (Object.keys(typeResults).length > 0) {
                const typeResultsDiv = document.createElement('div');
                typeResultsDiv.className = 'type-results mb-4';
                typeResultsDiv.innerHTML = `<h3>${objectTypes[type].title} Results</h3>`;

                Object.entries(typeResults).forEach(([objectId, objectActions]) => {
                    const userResultsDiv = document.createElement('div');
                    userResultsDiv.className = 'user-results mb-3';

                    const displayName = userNames[objectId] || 'Unknown';

                    userResultsDiv.innerHTML = `<h4>${displayName} (${objectId})</h4>`;

                    Object.entries(objectActions).forEach(([action, data]) => {
                        const resultSection = createResultSection(action, data, objectId, displayName);
                        userResultsDiv.appendChild(resultSection);
                    });

                    typeResultsDiv.appendChild(userResultsDiv);
                });

                results.appendChild(typeResultsDiv);
            }
        });
        sortResults();
    }

    function createResultSection(action, data, objectId, displayName) {
        const resultSection = document.createElement('div');
        resultSection.id = `result-${objectId}-${action}`;
        resultSection.className = 'mb-3';

        let icon, statusClass, status;
        if (data.error) {
            icon = 'bi-x-octagon';
            statusClass = 'text-danger';
            status = 'error';
        } else if (Array.isArray(data) && data.length === 0) {
            icon = 'bi-envelope';
            statusClass = 'text-warning';
            status = 'empty';
        } else {
            icon = 'bi-chevron-down';
            statusClass = 'text-success';
            status = 'success';
        }

        resultSection.innerHTML = `
            <div class="card" data-status="${status}">
                <div class="card-header" id="heading-${objectId}-${action}">
                    <h5 class="mb-0">
                        <button class="btn btn-link collapsed ${statusClass}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${objectId}-${action}">
                            ${displayName} - ${action} <i class="bi ${icon}"></i>
                        </button>
                    </h5>
                </div>
                <div id="collapse-${objectId}-${action}" class="collapse" aria-labelledby="heading-${objectId}-${action}">
                    <div class="card-body">
                        <pre class="results-container"><code>${JSON.stringify(data, null, 2)}</code></pre>
                        <button class="btn btn-sm btn-outline-secondary copy-btn">Copy</button>
                    </div>
                </div>
            </div>
        `;

        resultSection.querySelector('.copy-btn').addEventListener('click', () => copyToClipboard(JSON.stringify(data, null, 2)));
        resultSection.querySelector('.btn-link').addEventListener('click', function() {
            this.querySelector('i').classList.toggle('bi-chevron-down');
            this.querySelector('i').classList.toggle('bi-chevron-up');
        });

        return resultSection;
    }

    function sortResults() {
        const sortOrder = ['success', 'empty', 'error'];
        const typeResultsDivs = Array.from(results.querySelectorAll('.type-results'));

        typeResultsDivs.forEach(typeResultsDiv => {
            const userResultsDivs = Array.from(typeResultsDiv.querySelectorAll('.user-results'));
            userResultsDivs.forEach(userResultsDiv => {
                const resultElements = Array.from(userResultsDiv.querySelectorAll('.mb-3'));

                if (resultElements.length === 0) return;

                resultElements.sort((a, b) => {
                    const statusA = a.querySelector('.card')?.dataset.status || '';
                    const statusB = b.querySelector('.card')?.dataset.status || '';
                    return sortOrder.indexOf(statusA) - sortOrder.indexOf(statusB);
                });

                resultElements.forEach(element => userResultsDiv.appendChild(element));
            });
        });
    }

    function executeAllActions(tokenId, objectType, objectId) {
        const actions = Object.keys(objectTypes[objectType].actions);
        actions.forEach(action => {
            fetchObjectAction(tokenId, objectType, action, objectId);
        });
    }


    function showLoading(objectType, action) {
        console.log('Showing loading for type:', objectType, 'action:', action);
        if (!objectTypes[objectType]) {
            console.error(`Invalid object type: ${objectType}`);
            return;
        }

        let typeResultsDiv = Array.from(results.querySelectorAll('.type-results')).find(div =>
            div.querySelector('h3').textContent === `${objectTypes[objectType].title} Results`
        );

        if (!typeResultsDiv) {
            typeResultsDiv = document.createElement('div');
            typeResultsDiv.className = 'type-results mb-4';
            typeResultsDiv.innerHTML = `<h3>${objectTypes[objectType].title} Results</h3>`;
            results.appendChild(typeResultsDiv);
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
        const typeResultsDiv = Array.from(results.querySelectorAll('.type-results')).find(div =>
            div.querySelector('h3').textContent === `${objectTypes[objectType].title} Results`
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


    function showError(action, message) {
        let resultSection = document.getElementById(`result-${action}`);
        if (!resultSection) {
            resultSection = document.createElement('div');
            resultSection.id = `result-${action}`;
            resultSection.className = 'mb-3';
            results.appendChild(resultSection);
        }
        resultSection.innerHTML = `<div class="alert alert-danger">${message}</div>`;
    }

    function clearResults(clearAll = false) {
        if (clearAll) {
            results.innerHTML = '';
            objectResults = {
                users: {},
                groups: {},
                servicePrincipals: {}
            };
            userNames = {};
            // Hide the dropdown when clearing all results
            if (objectDropdown) objectDropdown.style.display = 'none';
        }
        analyzingObjectInfo.style.display = 'none';
    }


    function initializeEventListeners() {
        if (accessTokenSelect) {
            accessTokenSelect.addEventListener('change', handleAccessTokenChange);
        }

        document.querySelectorAll('.object-type-btn').forEach(btn => {
            btn.addEventListener('click', handleObjectTypeButtonClick);
        });
    }

    initializeEventListeners();
});
document.addEventListener('DOMContentLoaded', function() {
    const elements = {
        accessTokenSelect: document.getElementById('accessTokenSelect'),
        tokenScpContent: document.getElementById('tokenScpContent'),
        actionButtons: document.getElementById('actionButtons'),
        results: document.getElementById('results'),
        analyzingObjectInfo: document.getElementById('analyzingObjectInfo'),
        objectDropdown: document.getElementById('objectDropdown')
    };

    let currentState = {
        objectType: null,
        objectId: null,
        objectName: null
    };

    const cache = {
        objects: {},
        userNames: {}
    };

    if (elements.objectDropdown) elements.objectDropdown.style.display = 'none';

    const objectResults = {
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

    const INTERNAL_ORG_IDS = [
        "f8cdef31-a31e-4b4a-93e4-5f571e91255a",
        "cdc5aeea-15c5-4db6-b079-fcadd2505dc2"
    ];

    function handleAccessTokenChange() {
        const tokenId = this.value;
        if (tokenId) {
            checkTokenExpiration(tokenId);
        } else {
            elements.tokenScpContent.textContent = '';
        }
        clearResults(true);
    }

    function checkTokenExpiration(tokenId) {
        fetchJson(`/token_details/${tokenId}`)
            .then(data => {
                const expTime = data.highlighted_claims.exp;
                const currentTime = Math.floor(Date.now() / 1000);
                if (expTime < currentTime) {
                    showNotification('The selected token has expired. Please choose a valid token.', 'warning');
                    elements.tokenScpContent.textContent = 'Token expired';
                } else {
                    fetchTokenScp(tokenId);
                }
            })
            .catch(error => handleError('Error checking token expiration', error));
    }

    function handleObjectTypeButtonClick(e) {
        const objectType = e.target.closest('.object-type-btn').dataset.objectType;
        console.log('Object type clicked:', objectType);
        const tokenId = elements.accessTokenSelect.value;
        if (tokenId) {
            currentState.objectType = objectType;
            fetchObjects(tokenId, objectType);
        } else {
            alert('Please select an access token first.');
        }
    }

    function fetchTokenScp(tokenId) {
        fetchJson(`/get_token_permissions/${tokenId}`)
            .then(data => {
                elements.tokenScpContent.textContent = data.permissions.join('\n');
            })
            .catch(error => handleError('Error fetching token SCP', error));
    }

    function fetchObjects(tokenId, objectType) {
        console.log('Fetching objects for type:', objectType);
        showLoading(objectType);
        let url = `/api/${objectType}?token_id=${tokenId}`;
        if (objectType === 'servicePrincipals') {
            url += '&$select=id,displayName,appId,appOwnerOrganizationId';
        }
        fetchJson(url)
            .then(data => {
                cache.objects = data.reduce((acc, obj) => {
                    acc[obj.id] = obj;
                    cache.userNames[obj.id] = obj.displayName || obj.userPrincipalName || obj.appId || 'Unknown';
                    return acc;
                }, {});
                initializeObjectDropdown(data, objectType);
                removeLoading(objectType);
                if (elements.objectDropdown) elements.objectDropdown.style.display = 'block';
            })
            .catch(error => handleFetchError(error, objectType));
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

    function handleFetchError(error, objectType) {
        console.error(`Error fetching ${objectType}:`, error);
        showError(objectType, `Error fetching ${objectType}: ${error.message}`);
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
    }

function initializeObjectDropdown(objects, objectType) {
    if (!elements.objectDropdown) {
        console.error('Object dropdown element not found');
        return;
    }

    elements.objectDropdown.innerHTML = `<option value="">Select a ${objectType}</option>`;

    if (objectType === 'servicePrincipals') {
        objects.sort((a, b) => {
            const aIsExternal = !INTERNAL_ORG_IDS.includes(a.appOwnerOrganizationId);
            const bIsExternal = !INTERNAL_ORG_IDS.includes(b.appOwnerOrganizationId);
            if (aIsExternal !== bIsExternal) return aIsExternal ? -1 : 1;
            return 0;
        });
    }

    objects.forEach(obj => {
        const option = document.createElement('option');
        option.value = obj.id;
        option.textContent = `${obj.displayName || obj.userPrincipalName || obj.appId} / ${obj.id}`;
        if (objectType === 'servicePrincipals' && !INTERNAL_ORG_IDS.includes(obj.appOwnerOrganizationId)) {
            option.classList.add('external-ownership');
            option.textContent += ' (Non-Microsoft)';
        }
        elements.objectDropdown.appendChild(option);
    });

    try {
        $(elements.objectDropdown).select2({
            placeholder: `Select a ${objectType}`,
            allowClear: true,
            width: '100%',
            templateResult: formatObjectOption
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

    function formatObjectOption(object) {
        if (!object.id) {
            return object.text;
        }
        const isExternal = $(object.element).hasClass('external-ownership');
        const $object = $(
            `<span>${object.text}</span>`
        );
        if (isExternal) {
            $object.append('<span class="external-ownership-note"> (Not Microsoft)</span>');
        }
        return $object;
    }


    function handleObjectSelection(objectId, objectName, objectType) {
        currentState.objectId = objectId;
        currentState.objectName = objectName;
        currentState.objectType = objectType;
        const tokenId = elements.accessTokenSelect.value;
        displayActionButtons(objectType, tokenId, objectId);
    }

    function displayActionButtons(objectType, tokenId, objectId = null) {
        elements.actionButtons.innerHTML = '';

        if (objectId) {
            elements.analyzingObjectInfo.textContent = `Analyzing: ${objectTypes[objectType].title} | ID: ${objectId} | Name: ${currentState.objectName}`;
            elements.analyzingObjectInfo.style.display = 'block';
        } else {
            elements.analyzingObjectInfo.style.display = 'none';
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

        elements.actionButtons.appendChild(buttonContainer);
    }

    function fetchObjectAction(tokenId, objectType, action, objectId) {
        showLoading(objectType, action);

        let url = `/api/${objectType}/${action}?token_id=${tokenId}`;
        if (objectId) {
            url += `&user_id=${objectId}`;
        }

        let method = 'GET';
        let body = null;

        switch (action) {
            case 'getMemberGroups':
            case 'getMemberObjects':
                method = 'POST';
                body = JSON.stringify({
                    securityEnabledOnly: false
                });
                break;
        }

        fetchJson(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: body
            })
            .then(data => {
                if (!objectResults[objectType][objectId]) {
                    objectResults[objectType][objectId] = {};
                }
                objectResults[objectType][objectId][action] = {
                    actionResult: data.actionResult || data,
                    isExternalOwnership: data.isExternalOwnership
                };
                displayActionResult(objectType, objectId, action);
            })
            .catch(error => {
                console.error(`Error fetching ${action}:`, error);
                if (!objectResults[objectType][objectId]) {
                    objectResults[objectType][objectId] = {};
                }
                objectResults[objectType][objectId][action] = {
                    error: error.message,
                    status: error.status || 'Unknown'
                };
                displayActionResult(objectType, objectId, action);
            })
            .finally(() => {
                removeLoading(objectType);
            });
    }

    function displayActionResult(objectType, objectId, action) {
        const result = objectResults[objectType][objectId][action];
        const resultSection = createResultSection(action, result, objectId, cache.userNames[objectId] || 'Unknown');

        let typeResultsDiv = document.querySelector(`.type-results[data-object-type="${objectType}"]`);
        if (!typeResultsDiv) {
            typeResultsDiv = document.createElement('div');
            typeResultsDiv.className = 'type-results mb-4';
            typeResultsDiv.setAttribute('data-object-type', objectType);
            typeResultsDiv.innerHTML = `<h3>${objectTypes[objectType].title} Results</h3>`;
            elements.results.appendChild(typeResultsDiv);
        }

        let userResultsDiv = typeResultsDiv.querySelector(`.user-results[data-object-id="${objectId}"]`);
        if (!userResultsDiv) {
            userResultsDiv = document.createElement('div');
            userResultsDiv.className = 'user-results mb-3';
            userResultsDiv.setAttribute('data-object-id', objectId);
            userResultsDiv.innerHTML = `<h4>${cache.userNames[objectId] || 'Unknown'} (${objectId})</h4>`;
            typeResultsDiv.appendChild(userResultsDiv);
        }

        const existingResultSection = userResultsDiv.querySelector(`#result-${objectId}-${action}`);
        if (existingResultSection) {
            existingResultSection.replaceWith(resultSection);
        } else {
            userResultsDiv.appendChild(resultSection);
        }

        sortResults();
    }

    function displayAllResults() {
        elements.results.innerHTML = '';

        Object.entries(objectResults).forEach(([type, typeResults]) => {
            if (Object.keys(typeResults).length > 0) {
                const typeResultsDiv = document.createElement('div');
                typeResultsDiv.className = 'type-results mb-4';
                typeResultsDiv.innerHTML = `<h3>${objectTypes[type].title} Results</h3>`;

                Object.entries(typeResults).forEach(([objectId, objectActions]) => {
                    const userResultsDiv = document.createElement('div');
                    userResultsDiv.className = 'user-results mb-3';

                    const displayName = cache.userNames[objectId] || 'Unknown';

                    userResultsDiv.innerHTML = `<h4>${displayName} (${objectId})</h4>`;

                    Object.entries(objectActions).forEach(([action, data]) => {
                        const resultSection = createResultSection(action, data, objectId, displayName);
                        userResultsDiv.appendChild(resultSection);
                    });

                    typeResultsDiv.appendChild(userResultsDiv);
                });

                elements.results.appendChild(typeResultsDiv);
            }
        });
        sortResults();
    }

    function createResultSection(action, data, objectId, displayName) {
        const resultSection = document.createElement('div');
        resultSection.id = `result-${objectId}-${action}`;
        resultSection.className = 'mb-3';

        let icon, statusClass, status, content;
        if (data.error) {
            icon = 'bi-x-octagon';
            statusClass = 'text-danger';
            status = 'error';
            content = `Error: ${data.error} (Status: ${data.status})`;
        } else if (data.actionResult === undefined || (Array.isArray(data.actionResult) && data.actionResult.length === 0)) {
            icon = 'bi-envelope';
            statusClass = 'text-warning';
            status = 'empty';
            content = 'No data available';
        } else {
            icon = 'bi-chevron-down';
            statusClass = 'text-success';
            status = 'success';
            content = JSON.stringify(data.actionResult, null, 2);
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

    function sortResults() {
        const sortOrder = ['success', 'empty', 'error'];
        const typeResultsDivs = Array.from(elements.results.querySelectorAll('.type-results'));

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

        let typeResultsDiv = Array.from(elements.results.querySelectorAll('.type-results')).find(div =>
            div.querySelector('h3').textContent === `${objectTypes[objectType].title} Results`
        );

        if (!typeResultsDiv) {
            typeResultsDiv = document.createElement('div');
            typeResultsDiv.className = 'type-results mb-4';
            typeResultsDiv.innerHTML = `<h3>${objectTypes[objectType].title} Results</h3>`;
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
            elements.results.appendChild(resultSection);
        }
        resultSection.innerHTML = `<div class="alert alert-danger">${message}</div>`;
    }

    function clearResults(clearAll = false) {
        if (clearAll) {
            elements.results.innerHTML = '';
            Object.keys(objectResults).forEach(key => objectResults[key] = {});
            cache.userNames = {};
            if (elements.objectDropdown) elements.objectDropdown.style.display = 'none';
        }
        elements.analyzingObjectInfo.style.display = 'none';
    }

    function handleError(message, error) {
        console.error(message, error);
        showNotification(message, 'error');
    }

    function initializeEventListeners() {
        if (elements.accessTokenSelect) {
            elements.accessTokenSelect.addEventListener('change', handleAccessTokenChange);
        }

        document.querySelectorAll('.object-type-btn').forEach(btn => {
            btn.addEventListener('click', handleObjectTypeButtonClick);
        });
    }

    initializeEventListeners();
});
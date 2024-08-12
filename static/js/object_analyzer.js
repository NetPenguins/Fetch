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
    let userResults = {};

    function initializeObjectDropdown(objects, objectType) {
        if (!objectDropdown) {
            console.error('Object dropdown element not found');
            return;
        }

        objectDropdown.innerHTML = `<option value="">Select a ${objectType}</option>`;
        objects.forEach(obj => {
            const option = document.createElement('option');
            option.value = obj.id;
            option.textContent = `${obj.displayName || obj.userPrincipalName || obj.appId} / ${obj.id}`;
            objectDropdown.appendChild(option);
        });

        try {
            $(objectDropdown).select2({
                placeholder: `Select a ${objectType}`,
                allowClear: true,
                width: '100%'
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
                memberOf: 'Member Of',
                getMemberGroups: 'Get Member Groups'
            }
        }
    };

    if (accessTokenSelect) {
        accessTokenSelect.addEventListener('change', function() {
            const tokenId = this.value;
            if (tokenId) {
                fetchTokenScp(tokenId);
            } else {
                tokenScpContent.textContent = '';
            }
            clearResults(true);
        });
    }


    document.querySelectorAll('.object-type-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const objectType = e.target.closest('.object-type-btn').dataset.objectType;
            const tokenId = accessTokenSelect.value;
            if (tokenId) {
                currentObjectType = objectType;
                clearResults();
                fetchObjects(tokenId, objectType);
            } else {
                alert('Please select an access token first.');
            }
        });
    });

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
        showLoading(objectType);

        fetch(`/api/${objectType}?token_id=${tokenId}`)
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(err.error || `HTTP error! status: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                initializeObjectDropdown(data, objectType);
            })
            .catch(error => {
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
            });
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
        showLoading(action);

        let url = `/api/${objectType}/${action}?token_id=${tokenId}`;
        if (objectId) {
            url += `&user_id=${objectId}`;
        }

        let method = 'GET';
        let body = null;

        if (action === 'getMemberGroups') {
            method = 'POST';
            body = JSON.stringify({
                securityEnabledOnly: false
            });
        }

        fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: body
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(JSON.stringify(err));
                    });
                }
                return response.json();
            })
            .then(data => {
                if (!userResults[currentObjectId]) {
                    userResults[currentObjectId] = {};
                }
                userResults[currentObjectId][action] = data;
                displayAllResults();
            })
            .catch(error => {
                console.error(`Error fetching ${action}:`, error);
                if (!userResults[currentObjectId]) {
                    userResults[currentObjectId] = {};
                }
                userResults[currentObjectId][action] = { error: error.message };
                displayAllResults();
            });
    }


    function displayAllResults() {
        results.innerHTML = '';
        Object.entries(userResults).forEach(([userId, userActions]) => {
            const userResultsDiv = document.createElement('div');
            userResultsDiv.className = 'user-results mb-4';
            userResultsDiv.innerHTML = `<h4>Results for User: ${userId}</h4>`;

            Object.entries(userActions).forEach(([action, data]) => {
                const resultSection = createResultSection(action, data, userId);
                userResultsDiv.appendChild(resultSection);
            });

            results.appendChild(userResultsDiv);
        });
        sortResults();
    }


    function createResultSection(action, data, userId) {
        const resultSection = document.createElement('div');
        resultSection.id = `result-${userId}-${action}`;
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
                <div class="card-header" id="heading-${userId}-${action}">
                    <h5 class="mb-0">
                        <button class="btn btn-link collapsed ${statusClass}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${userId}-${action}">
                            ${userId} - ${action} <i class="bi ${icon}"></i>
                        </button>
                    </h5>
                </div>
                <div id="collapse-${userId}-${action}" class="collapse" aria-labelledby="heading-${userId}-${action}">
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
        const userResultsDivs = Array.from(results.querySelectorAll('.user-results'));

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
    }


    function executeAllActions(tokenId, objectType, objectId) {
        const actions = Object.keys(objectTypes[objectType].actions);
        actions.forEach(action => {
            fetchObjectAction(tokenId, objectType, action, objectId);
        });
    }

    function showLoading(action) {
        let resultSection = document.getElementById(`result-${action}`);
        if (!resultSection) {
            resultSection = document.createElement('div');
            resultSection.id = `result-${action}`;
            resultSection.className = 'mb-3';
            results.appendChild(resultSection);
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
            userResults = {};
        }
        analyzingObjectInfo.style.display = 'none';
    }

});
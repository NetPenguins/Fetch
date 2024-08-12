document.addEventListener('DOMContentLoaded', function() {
    const accessTokenSelect = document.getElementById('accessTokenSelect');
    const tokenScpContent = document.getElementById('tokenScpContent');
    const actionButtons = document.getElementById('actionButtons');
    const results = document.getElementById('results');
    const analyzingObjectInfo = document.getElementById('analyzingObjectInfo');
    const userDropdown = document.getElementById('userDropdown');


    let currentObjectType = null;
    let currentUserId = null;
    let currentUserName = null;

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
            clearResults();
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

    function displayUsers(users, tokenId) {
        clearResults();
        const userList = document.createElement('ul');
        userList.className = 'list-group';

        users.forEach(user => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                <span>${user.displayName || user.userPrincipalName}</span>
                <button class="btn btn-primary user-actions-btn">Actions</button>
            `;
            li.querySelector('.user-actions-btn').addEventListener('click', () => handleUserSelection(user.id, user.displayName || user.userPrincipalName));
            userList.appendChild(li);
        });

        results.appendChild(userList);
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
        buttonContainer.className = 'row row-cols-2 row-cols-md-3 g-3';

        Object.entries(objectTypes[objectType].actions).forEach(([action, title]) => {
            const buttonCol = document.createElement('div');
            buttonCol.className = 'col';
            buttonCol.innerHTML = `
                <button class="btn btn-warning action-btn" data-action="${action}">
                    ${title}
                </button>
            `;
            buttonCol.querySelector('.action-btn').addEventListener('click', () => fetchObjectAction(tokenId, objectType, action, objectId));
            buttonContainer.appendChild(buttonCol);
        });

        const executeAllCol = document.createElement('div');
        executeAllCol.className = 'col';
        executeAllCol.innerHTML = `
            <button class="btn btn-success w-100 execute-all-btn">Execute All</button>
        `;
        executeAllCol.querySelector('.execute-all-btn').addEventListener('click', () => executeAllActions(tokenId, objectType, objectId));
        buttonContainer.appendChild(executeAllCol);

        actionButtons.appendChild(buttonContainer);
    }



    function fetchObjectAction(tokenId, objectType, action, userId) {
        showLoading(action);

        let url = `/api/${objectType}/${action}?token_id=${tokenId}`;
        if (userId) {
            url += `&user_id=${userId}`;
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
                displayActionResults(action, data);
            })
            .catch(error => {
                console.error(`Error fetching ${action}:`, error);
                displayErrorResult(action, error);
            });
    }


    function displayActionResults(action, data) {
        let resultSection = document.getElementById(`result-${action}`);
        if (!resultSection) {
            resultSection = document.createElement('div');
            resultSection.id = `result-${action}`;
            resultSection.className = 'mb-3';
            results.appendChild(resultSection);
        }

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
                <div class="card-header" id="heading-${action}">
                    <h5 class="mb-0">
                        <button class="btn btn-link collapsed ${statusClass}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${action}">
                            ${currentUserName} / ${currentUserId} - ${action} <i class="bi ${icon}"></i>
                        </button>
                    </h5>
                </div>
                <div id="collapse-${action}" class="collapse" aria-labelledby="heading-${action}">
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
    }


    function displayErrorResult(action, error) {
        let resultSection = document.getElementById(`result-${action}`);
        if (!resultSection) {
            resultSection = document.createElement('div');
            resultSection.id = `result-${action}`;
            resultSection.className = 'mb-3';
            results.appendChild(resultSection);
        }

        resultSection.innerHTML = `
            <div class="card" data-status="error">
                <div class="card-header" id="heading-${action}">
                    <h5 class="mb-0">
                        <button class="btn btn-link collapsed text-danger" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${action}">
                            ${action} <i class="bi bi-x-octagon"></i>
                        </button>
                    </h5>
                </div>
                <div id="collapse-${action}" class="collapse" aria-labelledby="heading-${action}">
                    <div class="card-body">
                        <div class="alert alert-danger">Error: ${error.message}</div>
                    </div>
                </div>
            </div>
        `;

        sortResults();
    }

    function sortResults() {
        const sortOrder = ['success', 'empty', 'error'];
        const resultElements = Array.from(results.children);

        if (resultElements.length === 0) return;

        resultElements.sort((a, b) => {
            const statusA = a.querySelector('.card')?.dataset.status || '';
            const statusB = b.querySelector('.card')?.dataset.status || '';
            return sortOrder.indexOf(statusA) - sortOrder.indexOf(statusB);
        });

        results.innerHTML = '';
        resultElements.forEach(element => results.appendChild(element));
    }

    function handleUserSelection(userId, userName) {
        currentUserId = userId;
        currentUserName = userName;
        const tokenId = accessTokenSelect.value;
        displayActionButtons('users', tokenId, userId);
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

    // Function to go back to user list
    function backToUserList() {
        if (currentObjectType === 'users' && accessTokenSelect.value) {
            fetchUsers(accessTokenSelect.value);
        }
    }

    // Add a "Back to User List" button
    function addBackButton() {
        const backButton = document.createElement('button');
        backButton.className = 'btn btn-secondary mb-3';
        backButton.textContent = 'Back to User List';
        backButton.addEventListener('click', backToUserList);
        actionButtons.insertBefore(backButton, actionButtons.firstChild);
    }


    // Modify executeAllActions to not clear the action buttons
    function executeAllActions(tokenId, objectType, userId) {
        const actions = Object.keys(objectTypes[objectType].actions);
        actions.forEach(action => {
            fetchObjectAction(tokenId, objectType, action, userId);
        });
    }


    function fetchUsers(tokenId) {
        showLoading('users');

        fetch(`/api/users?token_id=${tokenId}`)
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(err.error || `HTTP error! status: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                initializeUserDropdown(data);
            })
            .catch(error => {
                console.error('Error fetching users:', error);
                showError('users', `Error fetching users: ${error.message}`);
                userDropdown.innerHTML = '<option value="">Failed to load users</option>';
                $(userDropdown).select2({
                    placeholder: 'Failed to load users',
                    disabled: true
                });
            });
    }



    // Add this helper function as well
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

    // Modify clearResults to not clear action buttons
    function clearResults() {
        // Only clear the results if there's no current user selected
        if (!currentUserId) {
            results.innerHTML = '';
        }
        analyzingObjectInfo.style.display = 'none';
    }

});
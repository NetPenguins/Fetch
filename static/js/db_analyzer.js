document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded event fired');
    setupActionButtons();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);

    const tokenSelect = document.getElementById('tokenSelect');
    if (tokenSelect) {
        tokenSelect.addEventListener('change', function() {
            checkAndHighlightPermissions(this.value);
        });
    }

    document.getElementById('selectAllActions').addEventListener('click', selectAllActions);
    document.getElementById('deselectAllActions').addEventListener('click', deselectAllActions);
    document.getElementById('executeSelected').addEventListener('click', executeSelectedActions);
});


function setupActionButtons() {
    const actionButtons = [
        {
            name: 'Get Users with Privileged Roles',
            permissions: ['RoleManagement.Read.Directory', 'RoleManagement.ReadWrite.Directory', 'Directory.Read.All', 'Directory.ReadWrite.All'],
            action: 'get_privileged_roles'
        },
        {
            name: 'Get Role Eligibility Schedules',
            permissions: ['RoleEligibilitySchedule.Read.Directory', 'RoleManagement.Read.Directory', 'Directory.Read.All'],
            action: 'get_role_eligibility_schedules'
        },
        {
            name: 'Get User Consent Requests',
            permissions: ['ConsentRequest.Read.All', 'ConsentRequest.ReadWrite.All'],
            action: 'get_user_consent_requests'
        },
        {
            name: 'Check for Mismatched Service Principals',
            permissions: ['Application.Read.All', 'Application.ReadWrite.All', 'Directory.Read.All', 'Directory.ReadWrite.All'],
            action: 'get_mismatched_service_principals'
        },
        {
            name: 'Check Expiring Application Passwords',
            permissions: ['Application.Read.All', 'Application.ReadWrite.All', 'Directory.Read.All', 'Directory.ReadWrite.All'],
            action: 'check_expiring_app_passwords'
        },
        {
            name: 'Get Custom Roles',
            permissions: ['RoleManagement.Read.Directory', 'RoleManagement.ReadWrite.Directory', 'Directory.Read.All', 'Directory.ReadWrite.All'],
            action: 'get_custom_roles'
        },
        {
            name: 'Get Synced Objects',
            permissions: ['User.Read.All', 'Group.Read.All', 'Directory.Read.All'],
            action: 'get_synced_objects'
        },
        {
            name: 'Get Owned Devices',
            permissions: ['User.Read', 'Directory.Read.All', 'Directory.ReadWrite.All', 'User.Read.All', 'User.ReadWrite.All'],
            action: 'get_owned_devices'
        },
        {
            name: 'Get Owned Objects',
            permissions: ['User.Read', 'Directory.Read.All', 'Directory.ReadWrite.All', 'User.Read.All', 'User.ReadWrite.All'],
            action: 'get_owned_objects'
        },
        {
            name: 'Get Created Objects',
            permissions: ['User.Read', 'Directory.Read.All', 'Directory.ReadWrite.All', 'User.Read.All', 'User.ReadWrite', 'User.ReadWrite.All'],
            action: 'get_created_objects'
        },
        {
            name: 'Get Microsoft 365 Groups',
            permissions: ['GroupMember.Read.All', 'Group.ReadWrite.All', 'Directory.Read.All', 'Directory.ReadWrite.All', 'Group.Read.All'],
            action: 'get_m365_groups'
        },
        {
            name: 'Get Security Groups',
            permissions: ['GroupMember.Read.All', 'Group.ReadWrite.All', 'Directory.Read.All', 'Directory.ReadWrite.All', 'Group.Read.All'],
            action: 'get_security_groups'
        },
        {
            name: 'Get Mail-Enabled Security Groups',
            permissions: ['GroupMember.Read.All', 'Group.ReadWrite.All', 'Directory.Read.All', 'Directory.ReadWrite.All', 'Group.Read.All'],
            action: 'get_mail_enabled_security_groups'
        },
        {
            name: 'Get Distribution Groups',
            permissions: ['GroupMember.Read.All', 'Group.ReadWrite.All', 'Directory.Read.All', 'Directory.ReadWrite.All', 'Group.Read.All'],
            action: 'get_distribution_groups'
        },
        {
            name: 'Get Guest Users',
            permissions: ['User.Read.All', 'Directory.Read.All'],
            action: 'get_guest_users'
        },
        {
            name: 'Get App Role Assignments',
            permissions: ['Directory.Read.All'],
            action: 'get_app_role_assignments'
        },
    ];

    const buttonContainer = document.getElementById('actionButtons');
    if (buttonContainer) {
        buttonContainer.innerHTML = ''; // Clear existing buttons
        actionButtons.forEach(button => {
            const wrapper = document.createElement('div');
            wrapper.className = 'col'; // Add Bootstrap column class
            wrapper.innerHTML = `
                <div class="category-wrapper">
                    <label class="category-header">
                        <input type="checkbox" class="category-checkbox" value="${button.action}">
                        <span>${button.name}</span>
                    </label>
                </div>
            `;
            // Ensure permissions are properly stringified
            wrapper.dataset.permissions = JSON.stringify(button.permissions || []);
            wrapper.querySelector('input[type="checkbox"]').addEventListener('change', function() {
                wrapper.querySelector('.category-wrapper').classList.toggle('checked', this.checked);
            });
            buttonContainer.appendChild(wrapper);
        });
    } else {
        console.error('Button container not found');
    }
}










function selectAllActions() {
    document.querySelectorAll('#actionButtons input[type="checkbox"]').forEach(cb => cb.checked = true);
}

function deselectAllActions() {
    document.querySelectorAll('#actionButtons input[type="checkbox"]').forEach(cb => cb.checked = false);
}

function executeSelectedActions() {
    const selectedActions = Array.from(document.querySelectorAll('#actionButtons input[type="checkbox"]:checked'))
        .map(cb => cb.value);

    if (selectedActions.length === 0) {
        alert("Please select at least one action to execute.");
        return;
    }

    const tokenId = document.getElementById('tokenSelect').value;
    if (!tokenId) {
        alert("Please select an access token first.");
        return;
    }

    // Clear previous results and add the header
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = createResultsHeader();

    // Execute each selected action
    selectedActions.forEach(action => performGraphAction(action));
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
                displayTokenPermissions(data.permissions);
                highlightActionButtons(data.permissions);
            } else {
                document.getElementById('tokenScp').style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error checking permissions:', error);
            document.getElementById('tokenScp').style.display = 'none';
        });
}



function displayTokenPermissions(permissions) {
    const tokenScpDiv = document.getElementById('tokenScp');
    const tokenScpContent = document.getElementById('tokenScpContent');
    tokenScpContent.innerHTML = permissions.map(perm =>
        `<a href="https://graphpermissions.merill.net/permission/${perm}" target="_blank">${perm}</a>`
    ).join(' ');
    tokenScpDiv.style.display = 'block';
}

function highlightActionButtons(permissions) {
    const permSet = new Set(permissions.map(p => p.replace('.ReadWrite.', '.Read.')));
    const accessAsUserPermissions = new Set(permissions
        .filter(p => p.includes('.AccessAsUser.'))
        .map(p => p.split('.')[0]));

    document.querySelectorAll('#actionButtons .category-wrapper').forEach(wrapper => {
        const requiredPermissions = JSON.parse(wrapper.closest('.col').dataset.permissions || '[]');
        let hasPermission = false;
        let potentialAccess = false;

        for (const perm of requiredPermissions) {
            if (permSet.has(perm) || permSet.has(perm.replace('.ReadWrite.', '.Read.'))) {
                hasPermission = true;
                break;
            } else if (accessAsUserPermissions.has(perm.split('.')[0])) {
                potentialAccess = true;
            }
        }

        const header = wrapper.querySelector('.category-header');
        header.classList.remove('highlighted', 'potentially-allowed');
        if (hasPermission) {
            header.classList.add('highlighted');
        } else if (potentialAccess) {
            header.classList.add('potentially-allowed');
        }

        const checkbox = wrapper.querySelector('input[type="checkbox"]');
        checkbox.disabled = !hasPermission && !potentialAccess;
    });
}







function performGraphAction(action) {
    const tokenId = document.getElementById('tokenSelect').value;
    if (!tokenId) {
        alert("Please select an access token first.");
        return;
    }

    fetch(`/graph_action/${action}/${tokenId}`)
        .then(response => response.json())
        .then(data => {
            const resultsDiv = document.getElementById('results');
            if (resultsDiv) {
                const resultSection = createResultSection(action, data, tokenId, action);
                resultsDiv.appendChild(resultSection);
                sortResults();
            } else {
                console.error('Results div not found');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            const resultsDiv = document.getElementById('results');
            if (resultsDiv) {
                const errorSection = createResultSection(action, { error: error.message, status: 'Error' }, tokenId, action);
                resultsDiv.appendChild(errorSection);
                sortResults();
            } else {
                console.error('Results div not found');
            }
        });
}


function createResultSection(action, data, objectId, displayName) {
    const resultSection = document.createElement('div');
    resultSection.id = `result-${objectId}-${action}`;
    resultSection.className = 'mb-3';

    let icon, statusClass, status, content;
    if (data.error) {
        icon = 'bi-x-octagon-fill';
        statusClass = 'text-danger';
        status = 'error';
        content = `Error: ${data.error} (Status: ${data.status})`;
    } else if (data.value && Array.isArray(data.value) && data.value.length === 0) {
        icon = 'bi-circle';
        statusClass = 'text-secondary';
        status = 'empty';
        content = 'No data available';
    } else if (data === undefined || (Array.isArray(data) && data.length === 0)) {
        icon = 'bi-circle';
        statusClass = 'text-secondary';
        status = 'empty';
        content = 'No data available';
    } else {
        icon = 'bi-check-circle-fill';
        statusClass = 'text-success';
        status = 'success';
        content = JSON.stringify(data, null, 2);
    }

    resultSection.innerHTML = `
        <div class="card" data-status="${status}">
            <div class="card-header" id="heading-${objectId}-${action}">
                <h5 class="mb-0 d-flex align-items-center">
                    <i class="bi ${icon} ${statusClass} me-2"></i>
                    <button class="btn btn-link ${statusClass}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${objectId}-${action}" aria-expanded="true" aria-controls="collapse-${objectId}-${action}">
                        ${displayName}
                    </button>
                </h5>
            </div>
            <div id="collapse-${objectId}-${action}" class="collapse" aria-labelledby="heading-${objectId}-${action}">
                <div class="card-body">
                    <pre class="results-container"><code>${content}</code></pre>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline-primary json-btn">JSON</button>
                        <button class="btn btn-sm btn-outline-secondary copy-btn">Copy</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    resultSection.querySelector('.copy-btn').addEventListener('click', () => copyToClipboard(content));
    resultSection.querySelector('.json-btn').addEventListener('click', () => downloadJSON(data, `${action}_data.json`));

    return resultSection;
}


function downloadJSON(data, filename) {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', filename);
    linkElement.click();
}




function createResultsHeader() {
    return `
        <div class="enumeration-results-header">
            <h2>Enumeration Results</h2>
            <div class="result-legend">
                <span><i class="bi bi-check-circle-fill text-success"></i> Data available</span>
                <span><i class="bi bi-circle text-secondary"></i> No data</span>
                <span><i class="bi bi-exclamation-triangle-fill text-warning"></i> Warning</span>
                <span><i class="bi bi-x-octagon-fill text-danger"></i> Error</span>
            </div>
        </div>
    `;
}




function sortResults() {
    const sortOrder = ['success', 'empty', 'error'];
    const resultsDivs = Array.from(document.getElementById('results').children);

    resultsDivs.sort((a, b) => {
        const statusA = a.querySelector('.card')?.dataset.status || '';
        const statusB = b.querySelector('.card')?.dataset.status || '';
        return sortOrder.indexOf(statusA) - sortOrder.indexOf(statusB);
    });

    const resultsContainer = document.getElementById('results');
    resultsDivs.forEach(element => resultsContainer.appendChild(element));
}



function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Show a temporary "Copied!" message
        const copyBtn = event.target;
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}



function updateCurrentTime() {
    const currentTimeElement = document.getElementById('currentTime');
    if (currentTimeElement) {
        const now = new Date();
        currentTimeElement.textContent = now.toUTCString();
    }
}
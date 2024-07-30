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
});

function updateCurrentTime() {
    const currentTimeElement = document.getElementById('currentTime');
    if (currentTimeElement) {
        const now = new Date();
        currentTimeElement.textContent = now.toUTCString();
    }
}

function setupActionButtons() {
    const actionButtons = [
        {
            name: 'Get Privileged Roles',
            permissions: ['RoleManagement.Read.Directory', 'RoleManagement.ReadWrite.Directory', 'Directory.Read.All', 'Directory.ReadWrite.All'],
            action: getPrivilegedRoles
        },
        {
            name: 'Get Custom Roles',
            permissions: ['RoleManagement.Read.Directory', 'RoleManagement.ReadWrite.Directory', 'Directory.Read.All', 'Directory.ReadWrite.All'],
            action: getCustomRoles
        },
        {
            name: 'Get Synced Objects',
            permissions: ['User.Read.All', 'Group.Read.All', 'Directory.Read.All'],
            action: getSyncedObjects
        },
                {
            name: 'Get Owned Devices',
            permissions: ['User.Read', 'Directory.Read.All', 'Directory.ReadWrite.All', 'User.Read.All', 'User.ReadWrite.All'],
            action: getOwnedDevices
        },
        {
            name: 'Get Owned Objects',
            permissions: ['User.Read', 'Directory.Read.All', 'Directory.ReadWrite.All', 'User.Read.All', 'User.ReadWrite.All'],
            action: getOwnedObjects
        },
        {
            name: 'Get Created Objects',
            permissions: ['User.Read', 'Directory.Read.All', 'Directory.ReadWrite.All', 'User.Read.All', 'User.ReadWrite', 'User.ReadWrite.All'],
            action: getCreatedObjects
        },
        {
            name: 'Get Microsoft 365 Groups',
            permissions: ['GroupMember.Read.All', 'Group.ReadWrite.All', 'Directory.Read.All', 'Directory.ReadWrite.All', 'Group.Read.All'],
            action: getM365Groups
        },
        {
            name: 'Get Security Groups',
            permissions: ['GroupMember.Read.All', 'Group.ReadWrite.All', 'Directory.Read.All', 'Directory.ReadWrite.All', 'Group.Read.All'],
            action: getSecurityGroups
        },
        {
            name: 'Get Mail-Enabled Security Groups',
            permissions: ['GroupMember.Read.All', 'Group.ReadWrite.All', 'Directory.Read.All', 'Directory.ReadWrite.All', 'Group.Read.All'],
            action: getMailEnabledSecurityGroups
        },
        {
            name: 'Get Distribution Groups',
            permissions: ['GroupMember.Read.All', 'Group.ReadWrite.All', 'Directory.Read.All', 'Directory.ReadWrite.All', 'Group.Read.All'],
            action: getDistributionGroups
        },
        {
            name: 'Get Guest Users',
            permissions: ['User.Read.All', 'Directory.Read.All'],
            action: getGuestUsers
        },
        {
            name: 'Get App Role Assignments',
            permissions: ['Directory.Read.All'],
            action: getAppRoleAssignments
        },
    ];

    const buttonContainer = document.getElementById('actionButtons');
    if (buttonContainer) {
        buttonContainer.innerHTML = ''; // Clear existing buttons
        actionButtons.forEach(button => {
            const btn = document.createElement('button');
            btn.textContent = button.name;
            btn.className = 'btn btn-secondary me-2 mb-2';
            btn.onclick = button.action;
            btn.dataset.permissions = JSON.stringify(button.permissions);
            buttonContainer.appendChild(btn);
        });
    } else {
        console.error('Button container not found');
    }
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

                // Define high-level permissions
                const highLevelPermissions = new Set([
                    'Directory.Read.All',
                    'Directory.ReadWrite.All'
                ]);

                document.querySelectorAll('#actionButtons button').forEach(button => {
                    const requiredPermissions = JSON.parse(button.dataset.permissions);
                    let hasPermission = false;
                    let potentiallyAllowed = false;

                    // Check if the token has any high-level permissions
                    const hasHighLevelPermission = [...highLevelPermissions].some(p => permissions.has(p));

                    if (hasHighLevelPermission) {
                        hasPermission = true;
                    } else {
                        for (const perm of requiredPermissions) {
                            const readPerm = perm.replace('.ReadWrite.', '.Read.');
                            if (permissions.has(perm) || permissions.has(readPerm)) {
                                hasPermission = true;
                                break;
                            } else if (accessAsUserPermissions.has(perm.split('.')[0])) {
                                potentiallyAllowed = true;
                            }
                        }
                    }

                    if (hasPermission) {
                        button.classList.remove('btn-secondary', 'btn-warning');
                        button.classList.add('btn-primary');
                    } else if (potentiallyAllowed) {
                        button.classList.remove('btn-secondary', 'btn-primary');
                        button.classList.add('btn-warning');
                    } else {
                        button.classList.remove('btn-primary', 'btn-warning');
                        button.classList.add('btn-secondary');
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


function getPrivilegedRoles() {
    performGraphAction('get_privileged_roles');
}

function getSyncedObjects() {
    performGraphAction('get_synced_objects');
}

function getOwnedDevices() {
    performGraphAction('get_owned_devices');
}

function getOwnedObjects() {
    performGraphAction('get_owned_objects');
}

function getCreatedObjects() {
    performGraphAction('get_created_objects');
}

function getM365Groups() {
    performGraphAction('get_m365_groups');
}

function getSecurityGroups() {
    performGraphAction('get_security_groups');
}

function getMailEnabledSecurityGroups() {
    performGraphAction('get_mail_enabled_security_groups');
}

function getDistributionGroups() {
    performGraphAction('get_distribution_groups');
}

function getGuestUsers() {
    performGraphAction('get_guest_users');
}

function getAppRoleAssignments() {
    performGraphAction('get_app_role_assignments');
}




function getCustomRoles() {
    performGraphAction('get_custom_roles');
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
                resultsDiv.innerHTML = `
                    <h2>${action.replace(/_/g, ' ').capitalize()}</h2>
                    <div class="code-block-container">
                        <button class="btn btn-sm btn-secondary copy-btn" onclick="copyToClipboard('resultCodeBlock')">Copy</button>
                        <pre><code id="resultCodeBlock" class="json">${JSON.stringify(data, null, 2)}</code></pre>
                    </div>
                `;
            } else {
                console.error('Results div not found');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            const resultsDiv = document.getElementById('results');
            if (resultsDiv) {
                resultsDiv.innerHTML = `<p class="text-danger">Error: ${error.message}</p>`;
            } else {
                console.error('Results div not found');
            }
        });
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
    const copyBtn = el.parentElement.querySelector('.copy-btn');
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
        copyBtn.textContent = originalText;
    }, 2000);
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}
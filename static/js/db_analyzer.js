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
            name: 'Get Global Admins',
            permissions: ['RoleManagement.Read.Directory', 'RoleManagement.ReadWrite.Directory', 'Directory.Read.All', 'Directory.ReadWrite.All'],
            action: getGlobalAdmins
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

                document.querySelectorAll('#actionButtons button').forEach(button => {
                    const requiredPermissions = JSON.parse(button.dataset.permissions);
                    let hasPermission = false;
                    let potentiallyAllowed = false;

                    for (const perm of requiredPermissions) {
                        const readPerm = perm.replace('.ReadWrite.', '.Read.');
                        if (permissions.has(perm) || permissions.has(readPerm)) {
                            hasPermission = true;
                            break;
                        } else if (accessAsUserPermissions.has(perm.split('.')[0])) {
                            potentiallyAllowed = true;
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


function highlightButtons(permissions) {
    const buttons = document.querySelectorAll('#actionButtons button');
    buttons.forEach(button => {
        const requiredPermission = button.dataset.permission;
        if (hasRequiredPermission(permissions, requiredPermission)) {
            button.classList.remove('btn-secondary', 'btn-warning');
            button.classList.add('btn-primary');
        } else if (hasPotentialAccess(permissions, requiredPermission)) {
            button.classList.remove('btn-secondary', 'btn-primary');
            button.classList.add('btn-warning');
        } else {
            button.classList.remove('btn-primary', 'btn-warning');
            button.classList.add('btn-secondary');
        }
    });
}

function hasRequiredPermission(permissions, requiredPermission) {
    const highLevelPermissions = [
        'Directory.Read.All',
        'Directory.ReadWrite.All',
        'RoleManagement.ReadWrite.Directory'
    ];

    return permissions.includes(requiredPermission) ||
           permissions.some(perm => highLevelPermissions.includes(perm));
}

function hasPotentialAccess(permissions, requiredPermission) {
    if (permissions.includes('Directory.AccessAsUser.All')) {
        const basePerm = requiredPermission.split('.')[0];
        return basePerm === 'Directory' || basePerm === 'RoleManagement';
    }
    return false;
}

function hasAccessAsUserPermission(permissions, requiredPermission) {
    return permissions.includes('Directory.AccessAsUser.All') &&
           requiredPermission.startsWith('Directory.');
}

function getGlobalAdmins() {
    performGraphAction('get_global_admins');
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
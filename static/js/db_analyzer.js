document.addEventListener('DOMContentLoaded', function() {
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    setupActionButtons();
});

function updateCurrentTime() {
    const currentTimeElement = document.getElementById('currentTime');
    const now = new Date();
    currentTimeElement.textContent = now.toUTCString();
}

function setupActionButtons() {
    const actionButtons = [
        { name: 'Get Global Admins', permission: 'RoleManagement.Read.Directory', action: getGlobalAdmins },
        { name: 'Get All Users', permission: 'User.Read.All', action: getAllUsers },
        { name: 'Get All Groups', permission: 'Group.Read.All', action: getAllGroups },
        // Add more buttons as needed
    ];

    const buttonContainer = document.getElementById('actionButtons');
    actionButtons.forEach(button => {
        const btn = document.createElement('button');
        btn.textContent = button.name;
        btn.className = 'btn btn-secondary me-2 mb-2';
        btn.onclick = button.action;
        btn.dataset.permission = button.permission;
        buttonContainer.appendChild(btn);
    });
}

function checkAndHighlightPermissions(tokenId) {
    // ... (keep this function as is)
}

function displayTokenPermissions(permissions) {
    // ... (keep this function as is)
}

function highlightButtons(permissions) {
    // ... (keep this function as is)
}

function hasAccessAsUserPermission(permissions, requiredPermission) {
    // ... (keep this function as is)
}

function getGlobalAdmins() {
    performGraphAction('get_global_admins');
}

function getAllUsers() {
    performGraphAction('get_all_users');
}

function getAllGroups() {
    performGraphAction('get_all_groups');
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
            resultsDiv.innerHTML = `<h2>${action.replace(/_/g, ' ').capitalize()}</h2>`;
            if (data.error) {
                resultsDiv.innerHTML += `<p class="text-danger">Error: ${data.error}</p>`;
            } else {
                resultsDiv.innerHTML += `<pre>${JSON.stringify(data, null, 2)}</pre>`;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('results').innerHTML = `<p class="text-danger">Error: ${error.message}</p>`;
        });
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}
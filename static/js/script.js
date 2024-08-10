let isPollingCancelled = false
let pollInterval = null;


// Utility functions
function showSection(sectionId) {
    document.querySelectorAll('.action-section').forEach(section => {
        section.style.display = 'none';
    });
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.style.display = 'block';
    } else {
        console.error(`Section with id ${sectionId} not found`);
    }
}

function updateTime() {
    document.getElementById('currentTime').textContent = new Date().toUTCString();
}

let currentNotification = null;
let notificationTimeout = null;

function showNotification(message, type, duration = 5000) {
    // Clear any existing notification
    if (currentNotification) {
        currentNotification.remove();
        clearTimeout(notificationTimeout);
    }

    // Create new notification
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    notification.style.zIndex = '1050';  // Ensure it's above other elements
    notification.role = 'alert';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    // Add notification to the DOM
    document.body.appendChild(notification);
    currentNotification = notification;

    // Set up auto-dismiss
    notificationTimeout = setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 150);  // 150ms for fade out animation
        currentNotification = null;
    }, duration);

    // Set up manual dismiss
    notification.querySelector('.btn-close').addEventListener('click', () => {
        clearTimeout(notificationTimeout);
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 150);
        currentNotification = null;
    });
}



function fetchPostRequest(url, data) {
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(data)
    }).then(response => response.json());
}


// Token operations
function copyToken(tokenId) {
    fetch(`/get_access_token/${tokenId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.access_token) {
                return navigator.clipboard.writeText(data.access_token);
            } else {
                throw new Error('Failed to get access token: ' + (data.error || 'Unknown error'));
            }
        })
        .then(() => showNotification('Access token copied to clipboard', 'success'))
        .catch(err => {
            console.error('Error:', err);
            showNotification(err.message || 'An error occurred while copying the token', 'error');
        });
}

function showTokenDetails(tokenId) {
    if (!tokenId) {
        console.error('Token ID is undefined');
        showNotification('Invalid token ID', 'error');
        return;
    }

    fetch(`/token_details/${tokenId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                const modalBody = document.querySelector('#tokenDetailsModal .modal-body');
                modalBody.innerHTML = `
                    <h6>Highlighted Claims</h6>
                    <pre class="bg-light p-3 rounded"><code>${JSON.stringify(data.highlighted_claims, null, 2)}</code></pre>
                    <h6>Full Decoded Token</h6>
                    <pre id="fullDecodedToken" class="bg-light p-3 rounded"><code>${JSON.stringify(data.full_decoded, null, 2)}</code></pre>
                `;

                const modal = new bootstrap.Modal(document.getElementById('tokenDetailsModal'));
                modal.show();
            } else {
                throw new Error(data.error || 'Unknown error occurred');
            }
        })
        .catch(error => {
            console.error('Error fetching token details:', error);
            showNotification('An error occurred while fetching token details: ' + error.message, 'error');
        });
}


function tokenTableEventHandler(e) {
    const target = e.target;
    if (!target.classList.contains('btn')) return; // Exit if not a button

    e.preventDefault();
    const tokenId = target.getAttribute('data-token-id');

    console.log('Clicked element:', target);
    console.log('Token ID:', tokenId);

    if (target.classList.contains('delete-token-btn')) {
        deleteToken(tokenId, e);
    } else if (target.classList.contains('show-token-details-btn')) {
        showTokenDetails(tokenId);
    } else if (target.classList.contains('copy-token-btn')) {
        copyToken(tokenId);
    } else if (target.classList.contains('generate-access-token-btn')) {
        generateFromRefreshToken(tokenId);
    }
}

function copyFullDecodedToken() {
    const tokenText = document.getElementById('fullDecodedToken').textContent;
    navigator.clipboard.writeText(tokenText)
        .then(() => showNotification('Full decoded token copied to clipboard', 'success'))
        .catch(err => {
            console.error('Failed to copy: ', err);
            showNotification('Failed to copy full decoded token', 'error');
        });
}

function deleteToken(tokenId, event) {
    event.preventDefault();
    if (confirm('Are you sure you want to delete this token?')) {
        fetch(`/delete_token/${tokenId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.querySelector(`tr[data-token-id="${tokenId}"]`)?.remove();
                showNotification('Token deleted successfully', 'success');
            } else {
                showNotification(`Failed to delete token: ${data.error}`, 'error');
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            showNotification('An error occurred while deleting the token', 'error');
        });
    }
}

function storeToken(token, tokenType, tenantId, user, source) {
    if (tokenType === 'refresh_token') {
        console.log('Storing refresh tokens is currently not available');
        showNotification('Storing refresh tokens is currently not available', 'warning');
        return;
    }
    fetchPostRequest('/insert_token', {
        token, token_type: tokenType, tenant_id: tenantId, user, source
    })
    .then(data => {
        if (data.success) {
            refreshTokenTable();
            showNotification('Token stored successfully', 'success');
        } else {
            console.error('Failed to store token:', data.error);
            showNotification('Failed to store token: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error storing token:', error);
        showNotification('Error storing token', 'error');
    });
}

function toggleCustomClientId(selectElement, customGroupId) {
    const customGroup = document.getElementById(customGroupId);
    customGroup.style.display = selectElement.value === "" ? 'block' : 'none';
}

// Authentication methods
function handleDeviceCodeAuth(e) {
    e.preventDefault();
    const clientIdSelect = document.getElementById('deviceCodeClientId');
    const clientId = clientIdSelect.value === "" ? document.getElementById('customClientId').value : clientIdSelect.value;
    const tenant = document.getElementById('deviceCodeTenant').value || 'common';
    const scope = document.getElementById('deviceCodeScope').value || 'https://graph.microsoft.com/.default offline_access';

    startDeviceCodeAuth(clientId, tenant, scope);
}

function startDeviceCodeAuth(clientId, tenant, scope) {
    fetchPostRequest('/device_code_auth', { client_id: clientId, tenant, scope })
    .then(data => {
        if (data.error) {
            showNotification('Error: ' + data.error, 'error');
        } else {
            const deviceCodeResult = document.getElementById('deviceCodeResult');
            deviceCodeResult.style.display = 'block';

            document.getElementById('deviceCodeMessage').innerHTML = data.message.replace(
                'https://microsoft.com/devicelogin',
                '<a href="https://microsoft.com/devicelogin" target="_blank" rel="noopener noreferrer">https://microsoft.com/devicelogin</a>'
            );
            document.getElementById('deviceCodeUserCode').textContent = 'User Code: ' + data.user_code;
            document.getElementById('cancelDeviceCodeAuth').style.display = 'inline-block';
            pollForToken(clientId, data.device_code, tenant, data.interval);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('An error occurred while starting device code auth', 'error');
    });
}

function pollForToken(clientId, deviceCode, tenant, interval) {
    pollInterval = setInterval(() => {
        if (isPollingCancelled) {
            clearInterval(pollInterval);
            return;
        }
        fetchPostRequest('/poll_for_token', { client_id: clientId, device_code: deviceCode, tenant })
        .then(data => {
            if (data.status === 'success') {
                clearInterval(pollInterval);
                showNotification(data.message, 'success');
                storeToken(data.access_token, 'access_token', tenant, null, 'Device Code Flow');
                if (data.refresh_token) {
                    storeToken(data.refresh_token, 'refresh_token', tenant, null, 'Device Code Flow');
                }
                resetDeviceCodeUI();
                refreshTokenTable();
                closeDeviceCodeModal(); // New function to close the modal
            } else if (data.status === 'pending') {
                console.log(data.message); // Optional: update UI to show waiting message
            } else if (data.status === 'error') {
                clearInterval(pollInterval);
                showNotification('Error: ' + data.message, 'error');
                resetDeviceCodeUI();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            clearInterval(pollInterval);
            showNotification('An error occurred while polling for token', 'error');
            resetDeviceCodeUI();
        });
    }, interval * 1000);
}


function resetDeviceCodeUI() {
    document.getElementById('cancelDeviceCodeAuth').style.display = 'none';
    document.getElementById('deviceCodeMessage').textContent = '';
    document.getElementById('deviceCodeUserCode').textContent = '';
    isPollingCancelled = false; // Reset the polling cancellation flag
}

function closeDeviceCodeModal() {
    const modal = document.getElementById('deviceCodeAuthModal');
    if (modal) {
        const bootstrapModal = bootstrap.Modal.getInstance(modal);
        if (bootstrapModal) {
            bootstrapModal.hide();
        }
    }
}



function cancelDeviceCodeAuth() {
    isPollingCancelled = true;
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }
    resetDeviceCodeUI();
    console.log('Device code auth cancelled');
}

function handleRequestTokenPassword(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const tenant = formData.get('tenant');

    if (!tenant) {
        showNotification('Tenant ID or Domain is required', 'error');
        return;
    }

    fetchPostRequest('/request_token_password', {
        client_id: formData.get('client_id'),
        grant_type: 'password',
        username: formData.get('username'),
        password: formData.get('password'),
        scope: formData.get('scope'),
        tenant
    })
    .then(data => {
        if (data.success) {
            if (data.access_token) {
                storeToken(data.access_token, 'access_token', tenant, formData.get('username'), 'Password Grant');
            }
            if (data.refresh_token) {
                storeToken(data.refresh_token, 'refresh_token', tenant, formData.get('username'), 'Password Grant');
            }
            refreshTokenTable();
        } else {
           showNotification('Failed to generate token: ' + (data.error || 'Unknown error'), 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('An error occurred while requesting the token', 'error');
    });
}

function handleRequestTokenSecret(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    fetch('/request_token_secret', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(`HTTP error! status: ${response.status}, message: ${text}`);
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            updateTokenResult(data);
            storeToken(data.access_token, 'access_token', formData.get('tenant'), null, 'Client Secret Auth');
            closeModal('clientSecretAuthModal');
            refreshTokenTable();
        } else {
            showNotification('Failed to generate token: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('An error occurred while requesting the token: ' + error.message, 'error');
    });
}

function updateTokenResult(data) {
    const tokenResultElement = document.getElementById('tokenResult');
    if (tokenResultElement) {
        tokenResultElement.innerHTML = `
            <h5>Access Token</h5>
            <div class="position-relative mb-3">
                <pre class="p-3 rounded" style="background-color: #e9ecef; white-space: pre-wrap; word-wrap: break-word;">${data.access_token}</pre>
                <button class="btn btn-sm btn-secondary position-absolute top-0 end-0 m-2" onclick="copyClientToken()">Copy</button>
            </div>
            <p>Token Type: ${data.token_type}</p>
            <p>Expires In: ${data.expires_in} seconds</p>
        `;
    } else {
        console.warn('Element with id "tokenResult" not found. Unable to display token details.');
        showNotification('Token generated successfully, but unable to display details.', 'warning');
    }
}

function closeModal(modalId) {
    const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
    if (modal) {
        modal.hide();
    }
}

function handleImplicitGrantAuth(e) {
    e.preventDefault();
    console.log('Implicit Grant Auth initiated');

    const clientId = document.getElementById('implicitGrantClientId').value;
    const tenantId = document.getElementById('implicitGrantTenantId').value;
    const redirectUri = encodeURIComponent(document.getElementById('implicitGrantRedirectUri').value);
    const scope = encodeURIComponent('openid profile email');
    const responseType = 'id_token token';
    const responseMode = 'form_post';
    const state = document.getElementById('implicitGrantState').value;
    const nonce = document.getElementById('implicitGrantNonce').value;

    console.log('Client ID:', clientId);
    console.log('Tenant ID:', tenantId);
    console.log('Redirect URI:', redirectUri);
    console.log('State:', state);
    console.log('Nonce:', nonce);

    const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
        `client_id=${clientId}` +
        `&response_type=${responseType}` +
        `&redirect_uri=${redirectUri}` +
        `&response_mode=${responseMode}` +
        `&scope=${scope}` +
        `&state=${state}` +
        `&nonce=${nonce}`;

    console.log('Auth URL:', authUrl);
    window.open(authUrl, '_blank');
}


document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updateTime();
    setInterval(updateTime, 1000);
    parseIdToken();
    initializeTokenTableEvents();
});

function initializeEventListeners() {
    function generateRandomString() {
        return Math.random().toString(36).substring(2, 15);
    }

    function setElementValue(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.value = value;
        } else {
            console.warn(`Element with id '${id}' not found`);
        }
    }


    document.getElementById('insertTokenForm')?.addEventListener('submit', handleInsertToken);
    document.getElementById('passwordAuthForm')?.addEventListener('submit', handleRequestTokenPassword);
    document.getElementById('clientSecretAuthForm')?.addEventListener('submit', handleRequestTokenSecret);

    setElementValue('implicitGrantClientId', '');
    setElementValue('implicitGrantTenantId', 'common');
    setElementValue('implicitGrantRedirectUri', 'http://localhost:5000/auth');
    setElementValue('implicitGrantScope', 'openid profile email');
    setElementValue('implicitGrantResponseType', 'id_token token');
    setElementValue('implicitGrantState', generateRandomString());
    setElementValue('implicitGrantNonce', generateRandomString());


    document.getElementById('implicitGrantAuthForm')?.addEventListener('submit', handleImplicitGrantAuth);


    const implicitGrantAuthModal = document.getElementById('implicitGrantAuthModal');
    implicitGrantAuthModal?.addEventListener('show.bs.modal', function (event) {
        setElementValue('implicitGrantState', generateRandomString());
        setElementValue('implicitGrantNonce', generateRandomString());
    });



    document.getElementById('deviceCodeAuthForm')?.addEventListener('submit', handleDeviceCodeAuth);
    document.getElementById('deviceCodeClientId')?.addEventListener('change', () => toggleCustomClientId(this, 'customClientIdGroup1'));
    document.getElementById('cancelDeviceCodeAuth')?.addEventListener('click', cancelDeviceCodeAuth);

    document.getElementById('queryTenantForm')?.addEventListener('submit', handleQueryTenant);
    document.getElementById('requestTokenCertificateForm')?.addEventListener('submit', handleRequestTokenCertificate);
    document.getElementById('insertRefreshTokenForm')?.addEventListener('submit', handleInsertRefreshToken);
    document.getElementById('clientIdSelect1')?.addEventListener('change', () => toggleCustomClientId(this, 'customClientIdGroup2'));
    document.getElementById('passwordClientId')?.addEventListener('change', () => toggleCustomClientId(this, 'customClientIdGroup3'));
    document.getElementById('copyFullTokenBtn').addEventListener('click', copyFullDecodedToken);

    document.querySelectorAll('[data-section]').forEach(el => {
        el.addEventListener('click', function(e) {
            e.preventDefault();
            showSection(this.dataset.section);
        });
    });

    document.querySelectorAll('.copy-token-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tokenText = this.closest('.token-display').querySelector('pre').textContent;
            copyToClipboard(tokenText);
        });
    });
}

function copyClientToken() {
    const tokenText = document.querySelector('#tokenResult pre')?.textContent;
    if (tokenText) {
        copyToClipboard(tokenText);
    } else {
        showNotification('No token available to copy', 'error');
    }
}

function parseIdToken() {
    const hash = window.location.hash.substr(1);
    const result = hash.split('&').reduce((result, item) => {
        const [key, value] = item.split('=');
        result[key] = value;
        return result;
    }, {});
    if (result.id_token) {
        console.log("ID Token:", result.id_token);
        // Here you might want to validate and store the token
    }
}

function copyToClipboard(text) {
    return navigator.clipboard.writeText(text)
        .then(() => showNotification('Copied to clipboard', 'success'))
        .catch(err => {
            console.error('Failed to copy: ', err);
            showNotification('Failed to copy to clipboard', 'error');
        });
}

function handleInsertToken(e) {
    e.preventDefault();
    const token = document.getElementById('token').value;

    fetchPostRequest('/insert_token', { token: token })
        .then(data => {
            if (data.success) {
                showNotification('Token inserted successfully', 'success');
                document.getElementById('token').value = '';
                refreshTokenTable();

                // Close the modal if it exists
                const modal = bootstrap.Modal.getInstance(document.getElementById('insertTokenModal'));
                if (modal) {
                    modal.hide();
                }

                // Alternatively, if you want to redirect to another page:
                // window.location.href = '/some-other-page';
            } else {
                showNotification('Failed to insert token: ' + data.error, 'error');
            }
        })
        .catch(error => handleFetchError(error, 'An error occurred while inserting the token'));
}

function refreshTokenTable() {
    console.log('Refreshing token table...');
    fetch('/')  // Fetch the entire index page
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            console.log('Received new index HTML');
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newTable = doc.querySelector('.table-responsive');
            if (newTable) {
                console.log('Updating table content');
                document.querySelector('.table-responsive').outerHTML = newTable.outerHTML;
                // Re-initialize event listeners if necessary
                initializeTokenTableEvents();
                console.log('Table refresh complete');
            } else {
                console.error('New table content not found in response');
                console.log('Response HTML:', html);
                throw new Error('New table content not found in response');
            }

            // Update current time
            const newCurrentTime = doc.getElementById('currentTime');
            if (newCurrentTime) {
                document.getElementById('currentTime').textContent = newCurrentTime.textContent;
            }
        })
        .catch(error => {
            console.error('Error refreshing token table:', error);
            showNotification('Failed to refresh token table', 'error');
        });
}



function generateFromRefreshToken(refreshTokenId) {
    const clientId = prompt("Please enter the client ID:");

    if (!clientId) {
        showNotification('Client ID is required', 'error');
        return;
    }

    fetchPostRequest('/generate_from_refresh', {
        'refresh_token_id': refreshTokenId,
        'client_id': clientId
    })
    .then(data => {
        if (data.success) {
            showNotification('New access token generated successfully', 'success');
            // refreshTokenTable();
        } else {
            showNotification('Failed to generate new access token: ' + data.error, 'error');
        }
    })
    .catch(error => handleFetchError(error, 'An error occurred while generating new access token'));
}

function handleGenerateFromRefresh(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    fetchPostRequest('/generate_from_refresh', formData)
        .then(data => {
            if (data.success) {
                showNotification(data.message, 'success');
                if (data.refresh_token) {
                    document.getElementById('newRefreshToken').value = data.refresh_token;
                }
                refreshTokenTable();
            } else {
                showNotification(data.error, 'error');
            }
        })
        .catch(() => showNotification('Failed to generate token from refresh token', 'error'));
}

function handleInsertRefreshToken(e) {
    e.preventDefault();
    const refreshToken = document.getElementById('newRefreshToken').value;
    fetchPostRequest('/insert_token', { token: refreshToken, token_type: 'refresh_token' })
        .then(data => {
            if (data.success) {
                showNotification(data.message, 'success');
                document.getElementById('newRefreshToken').value = '';
                refreshTokenTable();
            } else {
                showNotification(data.error, 'error');
            }
        })
        .catch(() => showNotification('Failed to insert refresh token', 'error'));
}

function handleRequestTokenCertificate(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    fetchPostRequest('/request_token_certificate', formData)
        .then(data => {
            if (data.success) {
                showNotification(data.message, 'success');
                refreshTokenTable();
            } else {
                showNotification(data.error, 'error');
            }
        })
        .catch(() => showNotification('Failed to request token with certificate', 'error'));
}

function handleQueryTenant(e) {
    e.preventDefault();
    const tenantDomain = document.getElementById('tenantDomain').value;
    fetchPostRequest('/query_tenant_details', { tenant_domain: tenantDomain })
        .then(data => {
            if (data.success) {
                document.getElementById('tenantDetails').textContent = JSON.stringify(data.details, null, 2);
            } else {
                showNotification(data.error, 'error');
            }
        })
        .catch(() => showNotification('Failed to query tenant details', 'error'));
}

function handleFetchError(error, customMessage) {
    console.error('Fetch error:', error);
    showNotification(customMessage || 'An error occurred while processing your request', 'error');
}

function initializeTokenTableEvents() {
    const tokenTable = document.querySelector('.table-responsive');
    if (tokenTable) {
        tokenTable.addEventListener('click', tokenTableEventHandler);
    }
}

// Call this function after the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeTokenTableEvents);

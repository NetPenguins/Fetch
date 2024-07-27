document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('queryTenantForm').addEventListener('submit', handleQueryTenant);
    document.getElementById('insertTokenForm').addEventListener('submit', handleInsertToken);
    document.getElementById('requestTokenSecretForm').addEventListener('submit', handleRequestTokenSecret);
    document.getElementById('requestTokenCertificateForm').addEventListener('submit', handleRequestTokenCertificate);
    document.getElementById('generateFromRefreshForm').addEventListener('submit', handleGenerateFromRefresh);
    document.getElementById('insertRefreshTokenForm').addEventListener('submit', handleInsertRefreshToken);

    loadRefreshTokens();
});

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard!');
    }, (err) => {
        console.error('Could not copy text: ', err);
    });
}

function showTokenDetails(tokenName) {
    fetch(`/token_details/${tokenName}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }

            // Update highlighted claims table
            const table = document.getElementById('highlightedClaimsTable');
            table.innerHTML = '<tr><th>Claim</th><th>Value</th></tr>';
            for (const [claim, value] of Object.entries(data.highlighted_claims)) {
                table.innerHTML += `<tr><td>${claim}</td><td>${value}</td></tr>`;
            }

            // Update full decoded token
            document.getElementById('fullDecodedToken').textContent = JSON.stringify(data.full_decoded, null, 2);
            showSection('tokenDetails');
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to decode token');
        });
}

function handleQueryTenant(e) {
    e.preventDefault();
    const tenantDomain = document.getElementById('tenantDomain').value;
    fetch('/query_tenant_details', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `tenant_domain=${encodeURIComponent(tenantDomain)}`
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('tenantDetails').textContent = JSON.stringify(data, null, 2);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to query tenant details');
    });
}


function handleInsertToken(e) {
    e.preventDefault();
    const token = document.getElementById('token').value;
    fetch('/insert_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `token=${encodeURIComponent(token)}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            alert(data.message);
            document.getElementById('token').value = '';
            refreshTokenTable();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to insert token');
    });
}

function handleRequestTokenSecret(e) {
    e.preventDefault();
    const clientId = document.getElementById('clientId').value;
    const clientSecret = document.getElementById('clientSecret').value;
    const scope = document.getElementById('scope').value;
    fetch('/request_token_secret', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&scope=${encodeURIComponent(scope)}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            alert(data.message);
            refreshTokenTable();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to request token');
    });
}

function handleRequestTokenCertificate(e) {
    e.preventDefault();
    const clientId = document.getElementById('certClientId').value;
    const scope = document.getElementById('certScope').value;
    const privateKey = document.getElementById('privateKey').value;
    fetch('/request_token_certificate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `client_id=${encodeURIComponent(clientId)}&scope=${encodeURIComponent(scope)}&private_key=${encodeURIComponent(privateKey)}`
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        if (data.success) {
            refreshTokenTable();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to request token with certificate');
    });
}

function refreshTokenTable() {
    fetch('/')
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newAccessTokenTable = doc.querySelector('#accessTokenTable');
            const newRefreshTokenTable = doc.querySelector('#refreshTokenTable');

            if (newAccessTokenTable) {
                document.querySelector('#accessTokenTable').replaceWith(newAccessTokenTable);
            }
            if (newRefreshTokenTable) {
                document.querySelector('#refreshTokenTable').replaceWith(newRefreshTokenTable);
            }
        })
        .catch(error => {
            console.error('Error refreshing token tables:', error);
        });
}

function handleInsertToken(e) {
    e.preventDefault();
    const token = document.getElementById('token').value;
    fetch('/insert_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `token=${encodeURIComponent(token)}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            window.location.href = '/';  // Redirect to home page on success
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to insert token');
    });
}

function copyAccessToken(tokenId) {
    fetch(`/get_access_token/${tokenId}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                navigator.clipboard.writeText(data.access_token).then(() => {
                    alert('Access token copied to clipboard!');
                }, (err) => {
                    console.error('Could not copy text: ', err);
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to get access token');
        });
}

function handleGenerateFromRefresh(e) {
    e.preventDefault();
    const clientId = document.getElementById('refreshClientId').value;
    const refreshToken = document.getElementById('refreshToken').value;
    fetch('/generate_from_refresh', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `client_id=${encodeURIComponent(clientId)}&refresh_token=${encodeURIComponent(refreshToken)}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            alert(data.message);
            document.getElementById('newRefreshToken').value = data.refresh_token;
            window.location.href = '/';  // Redirect to home page on success
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to generate token from refresh token');
    });
}

function handleInsertRefreshToken(e) {
    e.preventDefault();
    const refreshToken = document.getElementById('newRefreshToken').value;
    fetch('/insert_token', {  // We're using the same endpoint for both token types
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `token=${encodeURIComponent(refreshToken)}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            alert(data.message);
            document.getElementById('newRefreshToken').value = '';
            refreshTokenTable();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to insert refresh token');
    });
}

function loadRefreshTokens() {
    fetch('/get_refresh_tokens')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('savedRefreshTokens');
            select.innerHTML = '<option value="">Select a saved refresh token</option>';
            data.refresh_tokens.forEach(token => {
                const option = document.createElement('option');
                option.value = token.token;
                option.textContent = `Token ID: ${token.id}`;
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to load refresh tokens');
        });
}

function useSavedRefreshToken() {
    const select = document.getElementById('savedRefreshTokens');
    document.getElementById('refreshToken').value = select.value;
}

document.addEventListener('DOMContentLoaded', function() {
    let elements = {
        tokenSelect: document.getElementById('tokenSelect'),
        tokenScpContent: document.getElementById('tokenScpContent'),
        selectAllBtn: document.getElementById('selectAllBtn'),
        deselectAllBtn: document.getElementById('deselectAllBtn'),
        enumerateBtn: document.getElementById('enumerateBtn'),
        endpointsList: document.getElementById('endpointsList'),
        results: document.getElementById('results'),
        armEndpointsData: document.getElementById('arm-endpoints-data')
    };

    // Check for missing elements and log warnings
    Object.entries(elements).forEach(([key, value]) => {
        if (!value) {
            console.warn(`Element with ID "${key}" not found in the DOM`);
        }
    });

    let ARM_ENDPOINTS = null;
    let FLATTENED_ENDPOINTS = null;

    let currentState = {
        tokenId: null,
        permissions: [],
        isAppToken: false
    };

    initializeApp();

    async function initializeApp() {
        try {
            ARM_ENDPOINTS = JSON.parse(elements.armEndpointsData.textContent);
            FLATTENED_ENDPOINTS = flattenEndpoints(ARM_ENDPOINTS);
            createEndpointsList(ARM_ENDPOINTS);
            setupEventListeners();
            logAvailableTokens();
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    }

    function logAvailableTokens() {
        if (elements.tokenSelect) {
            console.log('Available tokens:', Array.from(elements.tokenSelect.options).map(option => option.value));
        } else {
            console.error('Token select element not found');
        }
    }

    function flattenEndpoints(endpoints, prefix = '') {
        return Object.entries(endpoints).reduce((acc, [key, value]) => {
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (value.path) {
                acc[newKey] = value;
            } else {
                Object.assign(acc, flattenEndpoints(value, newKey));
            }
            return acc;
        }, {});
    }

    function createEndpointsList(endpoints) {
        elements.endpointsList.innerHTML = '';
        for (const [category, subcategories] of Object.entries(endpoints)) {
            const categoryWrapper = createCategoryWrapper(category, subcategories);
            elements.endpointsList.appendChild(categoryWrapper);
        }
    }

    function createCategoryWrapper(category, subcategories) {
        const categoryWrapper = document.createElement('div');
        categoryWrapper.className = 'category-wrapper';
        categoryWrapper.appendChild(createCategoryHeader(category));
        categoryWrapper.appendChild(createCategoryContent(category, subcategories));
        return categoryWrapper;
    }

    function createCategoryHeader(category) {
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header';
        categoryHeader.innerHTML = `
            <input type="checkbox" class="category-checkbox" id="category-${category}">
            <span class="category-toggle">+</span> ${category}
        `;
        categoryHeader.onclick = toggleCategory;
        const categoryCheckbox = categoryHeader.querySelector('.category-checkbox');
        categoryCheckbox.addEventListener('change', (e) => {
            e.stopPropagation();
            toggleCategoryCheckbox(e.target);
        });
        return categoryHeader;
    }

    function createCategoryContent(category, subcategories) {
        const categoryContent = document.createElement('div');
        categoryContent.className = 'category-content';
        categoryContent.style.display = 'none';
        for (const [subcategory, data] of Object.entries(subcategories)) {
            categoryContent.appendChild(createSubcategoryDiv(category, subcategory, data));
        }
        return categoryContent;
    }

    function createSubcategoryDiv(category, subcategory, data) {
        const subcategoryDiv = document.createElement('div');
        subcategoryDiv.className = 'subcategory';
        if (data.path) {
            subcategoryDiv.appendChild(createEndpointItem(category, subcategory, data));
        } else {
            subcategoryDiv.innerHTML = `<strong>${subcategory}</strong>`;
            for (const [endpoint, endpointData] of Object.entries(data)) {
                if (endpointData.path) {
                    subcategoryDiv.appendChild(createEndpointItem(category, `${subcategory}.${endpoint}`, endpointData));
                }
            }
        }
        return subcategoryDiv;
    }

    function createEndpointItem(category, endpoint, endpointData) {
        const endpointItem = document.createElement('div');
        endpointItem.className = 'endpoint-item form-check';
        endpointItem.innerHTML = `
            <input class="form-check-input" type="checkbox" name="endpoints" value="${category}.${endpoint}" id="${category}-${endpoint.replace('.', '-')}">
            <label class="form-check-label" for="${category}-${endpoint.replace('.', '-')}">
                ${endpoint}
            </label>
        `;
        return endpointItem;
    }

    function toggleCategory(event) {
        if (event.target.type === 'checkbox') return;
        const content = this.nextElementSibling;
        const toggle = this.querySelector('.category-toggle');
        if (content.style.display === 'none') {
            content.style.display = 'block';
            toggle.textContent = '−';
        } else {
            content.style.display = 'none';
            toggle.textContent = '+';
        }
    }

    function toggleCategoryCheckbox(checkbox) {
        const categoryContent = checkbox.closest('.category-header').nextElementSibling;
        const childCheckboxes = categoryContent.querySelectorAll('input[type="checkbox"]');
        childCheckboxes.forEach(childCheckbox => {
            childCheckbox.checked = checkbox.checked;
        });
        if (checkbox.checked) {
            categoryContent.style.display = 'block';
            checkbox.closest('.category-header').querySelector('.category-toggle').textContent = '−';
        }
    }

    function setupEventListeners() {
        if (elements.tokenSelect) {
            elements.tokenSelect.addEventListener('change', handleTokenChange);
        }
        if (elements.selectAllBtn) {
            elements.selectAllBtn.addEventListener('click', selectAll);
        }
        if (elements.deselectAllBtn) {
            elements.deselectAllBtn.addEventListener('click', deselectAll);
        }
        if (elements.enumerateBtn) {
            elements.enumerateBtn.addEventListener('click', enumerateARM);
        }
    }

    async function handleTokenChange() {
        const tokenId = this.value;
        currentState.tokenId = tokenId;
        if (tokenId) {
            try {
                const permissions = await fetchTokenPermissions(tokenId);
                currentState.permissions = permissions;
                displayTokenPermissions(permissions);
                highlightEndpoints(permissions);
            } catch (error) {
                console.error('Error fetching token permissions:', error);
                showNotification('Failed to fetch token permissions', 'error');
            }
        } else {
            if (elements.tokenScpContent) {
                elements.tokenScpContent.textContent = '';
            }
        }
    }

    async function fetchTokenPermissions(tokenId) {
        const response = await fetch(`/get_token_permissions/${tokenId}`);
        const data = await response.json();
        if (!data.success || !data.permissions) {
            throw new Error('Failed to fetch token permissions');
        }
        return data.permissions;
    }

    function displayTokenPermissions(permissions) {
        if (elements.tokenScpContent) {
            elements.tokenScpContent.innerHTML = permissions.map(perm =>
                `<a href="https://graphpermissions.merill.net/permission/${encodeURIComponent(perm)}" target="_blank">${perm}</a>`
            ).join(' ');
        }
    }

    function highlightEndpoints(permissions) {
        document.querySelectorAll('.endpoint-item').forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            const endpointPath = checkbox.value.split('.');
            let endpointData = ARM_ENDPOINTS;
            for (const key of endpointPath) {
                if (endpointData && endpointData[key]) {
                    endpointData = endpointData[key];
                } else {
                    endpointData = null;
                    break;
                }
            }

            if (endpointData && endpointData.audience.includes('https://management.azure.com')) {
                item.classList.add('highlighted');
            } else {
                item.classList.remove('highlighted');
            }
        });
    }

    function selectAll() {
        document.querySelectorAll('#endpointsList input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = true;
        });
    }

    function deselectAll() {
        document.querySelectorAll('#endpointsList input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
    }



async function fetchARMData(tokenId, endpoint) {
    const formData = new FormData();
    formData.append('token_id', tokenId);
    formData.append('endpoints', endpoint);

    try {
        const response = await fetch('/enumerate_arm', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data[endpoint];
    } catch (error) {
        console.error('Error in fetchARMData:', error);
        throw error;
    }
}

async function enumerateARM() {
    if (!currentState.tokenId) {
        showNotification("Please select an access token first.", "warning");
        return;
    }

    const endpoints = ["Tenants", "Subscriptions", "ResourceGroups"];
    elements.results.innerHTML = '<h2>Enumeration Results</h2>';

    for (const endpoint of endpoints) {
        try {
            showLoading(endpoint);
            const result = await fetchARMData(currentState.tokenId, endpoint);
            displayResult(endpoint, result);
        } catch (error) {
            console.error('Error fetching data for endpoint:', endpoint, error);
            displayError(endpoint, error);
        } finally {
            removeLoading(endpoint);
        }
    }
}





    function displayResult(endpoint, result) {
        const resultSection = document.createElement('div');
        resultSection.className = 'result-section mb-3';
        resultSection.innerHTML = `
            <h3>${endpoint}</h3>
            <pre>${JSON.stringify(result, null, 2)}</pre>
        `;
        elements.results.appendChild(resultSection);
    }

    function displayError(endpoint, error) {
        const errorSection = document.createElement('div');
        errorSection.className = 'result-section mb-3 text-danger';
        errorSection.innerHTML = `
            <h3>${endpoint}</h3>
            <p>Error: ${error.message}</p>
        `;
        elements.results.appendChild(errorSection);
    }

    function showLoading(endpoint) {
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.textContent = `Loading ${endpoint}...`;
        elements.results.appendChild(loadingIndicator);
    }

    function removeLoading(endpoint) {
        const loadingIndicator = elements.results.querySelector('.loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
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
});
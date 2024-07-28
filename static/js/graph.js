// graph.js

const GRAPH_ENDPOINTS = JSON.parse(document.getElementById('graph-endpoints-data').textContent);

function createEndpointsList() {
    const endpointsList = document.getElementById('endpointsList');
    for (const [category, endpoints] of Object.entries(GRAPH_ENDPOINTS)) {
        const categoryWrapper = document.createElement('div');
        categoryWrapper.className = 'category-wrapper';
        categoryWrapper.innerHTML = `
            <div class="category-header" onclick="toggleCategory(this)">
                <span class="category-toggle"></span>
                <input class="form-check-input" type="checkbox" onclick="event.stopPropagation(); toggleCategoryCheckbox(this)">
                <span>${category}</span>
            </div>
            <div class="category-content" style="display: none;">
                ${createEndpointCheckboxes(endpoints, category)}
            </div>
        `;
        endpointsList.appendChild(categoryWrapper);
    }
}

function createEndpointCheckboxes(endpoints, category) {
    return Object.entries(endpoints).map(([endpoint, path]) => {
        if (typeof path === 'object') {
            return `
                <div class="subcategory">
                    <div class="category-header" onclick="toggleCategory(this)">
                        <span class="category-toggle"></span>
                        <input class="form-check-input" type="checkbox" onclick="event.stopPropagation(); toggleCategoryCheckbox(this)">
                        <span>${endpoint}</span>
                    </div>
                    <div class="category-content" style="display: none;">
                        ${createEndpointCheckboxes(path, `${category}.${endpoint}`)}
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" name="endpoints" value="${category}.${endpoint}" id="${category}.${endpoint}">
                    <label class="form-check-label" for="${category}.${endpoint}">${endpoint}</label>
                </div>
            `;
        }
    }).join('');
}

function toggleCategory(header) {
    header.classList.toggle('open');
    const content = header.nextElementSibling;
    content.style.display = content.style.display === 'none' ? 'block' : 'none';
}

function toggleCategoryCheckbox(checkbox) {
    const categoryContent = checkbox.closest('.category-header').nextElementSibling;
    const checks = categoryContent.querySelectorAll('input[type="checkbox"]');
    checks.forEach(check => check.checked = checkbox.checked);
}

function selectAll() {
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.checked = true);
}

function deselectAll() {
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.checked = false);
}

function enumerateGraph() {
    const tokenId = document.getElementById('tokenSelect').value;
    const endpoints = Array.from(document.querySelectorAll('input[name="endpoints"]:checked')).map(cb => cb.value);
    const formData = new FormData();
    formData.append('token_id', tokenId);
    endpoints.forEach(endpoint => formData.append('endpoints', endpoint));

    fetch('/enumerate_graph', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = '<h2>Enumeration Results</h2>';
        displayResults(data, resultsDiv);
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('results').innerHTML = `<p class="text-danger">Error: ${error.message}</p>`;
    });
}

function displayResults(data, container, indent = 0) {
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object' && value !== null) {
            const subContainer = document.createElement('div');
            subContainer.style.marginLeft = `${indent * 20}px`;
            subContainer.innerHTML = `<h3>${key}</h3>`;
            container.appendChild(subContainer);
            displayResults(value, subContainer, indent + 1);
        } else {
            const resultElem = document.createElement('pre');
            resultElem.style.marginLeft = `${indent * 20}px`;
            resultElem.textContent = `${key}: ${JSON.stringify(value, null, 2)}`;
            container.appendChild(resultElem);
        }
    }
}

function updateCurrentTime() {
    const currentTimeElement = document.getElementById('currentTime');
    const now = new Date();
    currentTimeElement.textContent = now.toUTCString();
}

document.addEventListener('DOMContentLoaded', function() {
    createEndpointsList();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
});
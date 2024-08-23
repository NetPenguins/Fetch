ARM_ENDPOINTS = {
    "Tenants": {
        "path": "/tenants",
        "api-version": "2022-12-01",
        "method": "GET",
        "audience": "https://management.azure.com"
    },
    "Subscriptions": {
        "path": "/subscriptions",
        "api-version": "2022-12-01",
        "method": "GET",
        "audience": "https://management.azure.com",
        "depends_on": "Tenants"
    },
    "ResourceGroups": {
        "path": "/subscriptions/{subscriptionId}/resourcegroups",
        "api-version": "2021-04-01",
        "method": "GET",
        "audience": "https://management.azure.com",
        "depends_on": "Subscriptions",
        "parameter": "subscriptionId"
    }
}
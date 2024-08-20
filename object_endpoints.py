OBJECT_ENDPOINTS = {
    "Users": {
        "users": {
            "path": "/users",
            "delegatedPermission": "User.Read.All",
            "applicationPermission": "User.Read.All",
            "audience": ["https://graph.microsoft.com"],
            "actions": {
                "details": {
                    "path": "/users/{id}",
                    "delegatedPermission": "Directory.Read.All",
                    "applicationPermission": "Directory.Read.All"
                },
                "appRoleAssignments": {
                    "path": "/users/{id}/appRoleAssignments",
                    "delegatedPermission": "AppRoleAssignment.Read.All",
                    "applicationPermission": "AppRoleAssignment.Read.All"
                },
                "calendars": {
                    "path": "/users/{id}/calendars",
                    "delegatedPermission": "Calendars.Read",
                    "applicationPermission": "Calendars.Read"
                },
                "oauth2PermissionGrants": {
                    "path": "/users/{id}/oauth2PermissionGrants",
                    "delegatedPermission": "DelegatedPermissionGrant.Read.All",
                    "applicationPermission": "DelegatedPermissionGrant.Read.All"
                },
                "ownedDevices": {
                    "path": "/users/{id}/ownedDevices",
                    "delegatedPermission": "Directory.Read.All",
                    "applicationPermission": "Directory.Read.All"
                },
                "ownedObjects": {
                    "path": "/users/{id}/ownedObjects",
                    "delegatedPermission": "Directory.Read.All",
                    "applicationPermission": "Directory.Read.All"
                },
                "registeredDevices": {
                    "path": "/users/{id}/registeredDevices",
                    "delegatedPermission": "Directory.Read.All",
                    "applicationPermission": "Directory.Read.All"
                },
                "notebooks": {
                    "path": "/users/{id}/onenote/notebooks",
                    "delegatedPermission": "Notes.Read.All",
                    "applicationPermission": "Notes.Read.All"
                },
                "directReports": {
                    "path": "/users/{id}/directReports",
                    "delegatedPermission": "User.Read.All",
                    "applicationPermission": "User.Read.All"
                },
                "people": {
                    "path": "/users/{id}/people",
                    "delegatedPermission": "People.Read",
                    "applicationPermission": "People.Read.All"
                },
                "contacts": {
                    "path": "/users/{id}/contacts",
                    "delegatedPermission": "Contacts.Read",
                    "applicationPermission": "Contacts.Read"
                },
                "plannerTasks": {
                    "path": "/users/{id}/planner/tasks",
                    "delegatedPermission": "Tasks.Read",
                    "applicationPermission": "Tasks.Read.All"
                },
                "sponsors": {
                    "path": "/users/{id}/sponsors",
                    "delegatedPermission": "User.Read.All",
                    "applicationPermission": "User.Read.All"
                },
                "memberOf": {
                    "path": "/users/{id}/memberOf",
                    "delegatedPermission": "Directory.Read.All",
                    "applicationPermission": "Directory.Read.All"
                },
                "getMemberGroups": {
                    "path": "/users/{id}/getMemberGroups",
                    "delegatedPermission": "Directory.Read.All",
                    "applicationPermission": "Directory.Read.All",
                    "method": "POST"
                }
            }
        }
    },
    "Groups": {
        "groups": {
            "path": "/groups",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All",
            "audience": ["https://graph.microsoft.com"],
            "actions": {
                "details": {
                    "path": "/groups/{id}",
                    "delegatedPermission": "Directory.Read.All",
                    "applicationPermission": "Directory.Read.All"
                },
                "owners": {
                    "path": "/groups/{id}/owners",
                    "delegatedPermission": "Directory.Read.All",
                    "applicationPermission": "Directory.Read.All",
                },
                "members": {
                    "path": "/groups/{id}/members",
                    "delegatedPermission": "Directory.Read.All",
                    "applicationPermission": "Directory.Read.All",
                }
            }
        }
    },
    "ServicePrincipals": {
        "serviceprincipals": {
            "path": "/servicePrincipals",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All",
            "audience": ["https://graph.microsoft.com"],
            "actions": {
                "details": {
                    "path": "/servicePrincipals/{id}",
                    "delegatedPermission": "Directory.Read.All",
                    "applicationPermission": "Directory.Read.All"
                },
                "appRoleAssignments": {
                    "path": "/servicePrincipals/{id}/appRoleAssignments",
                    "delegatedPermission": "AppRoleAssignment.Read.All",
                    "applicationPermission": "AppRoleAssignment.Read.All"
                },
                "appRoleAssignedTo": {
                    "path": "/servicePrincipals/{id}/appRoleAssignedTo",
                    "delegatedPermission": "AppRoleAssignment.Read.All",
                    "applicationPermission": "AppRoleAssignment.Read.All"
                },
                "oauth2PermissionGrants": {
                    "path": "/servicePrincipals/{id}/oauth2PermissionGrants",
                    "delegatedPermission": "DelegatedPermissionGrant.Read.All",
                    "applicationPermission": "DelegatedPermissionGrant.Read.All"
                },
                "delegatedPermissionClassifications": {
                    "path": "/servicePrincipals/{id}/delegatedPermissionClassifications",
                    "delegatedPermission": "Directory.Read.All",
                    "applicationPermission": "Directory.Read.All"
                },
                "owners": {
                    "path": "/servicePrincipals/{id}/owners",
                    "delegatedPermission": "Directory.Read.All",
                    "applicationPermission": "Directory.Read.All"
                },
                "claimsMappingPolicies": {
                    "path": "/servicePrincipals/{id}/claimsMappingPolicies",
                    "delegatedPermission": "Policy.Read.All",
                    "applicationPermission": "Policy.Read.All"
                },
                "homeRealmDiscoveryPolicies": {
                    "path": "/servicePrincipals/{id}/homeRealmDiscoveryPolicies",
                    "delegatedPermission": "Policy.Read.All",
                    "applicationPermission": "Policy.Read.All"
                },
                "tokenIssuancePolicies": {
                    "path": "/servicePrincipals/{id}/tokenIssuancePolicies",
                    "delegatedPermission": "Policy.Read.All",
                    "applicationPermission": "Policy.Read.All"
                },
                "tokenLifetimePolicies": {
                    "path": "/servicePrincipals/{id}/tokenLifetimePolicies",
                    "delegatedPermission": "Policy.Read.All",
                    "applicationPermission": "Policy.Read.All"
                },
                "memberOf": {
                    "path": "/servicePrincipals/{id}/memberOf",
                    "delegatedPermission": "Directory.Read.All",
                    "applicationPermission": "Directory.Read.All"
                },
                "getMemberGroups": {
                    "path": "/servicePrincipals/{id}/getMemberGroups",
                    "delegatedPermission": "Directory.Read.All",
                    "applicationPermission": "Directory.Read.All",
                    "method": "POST"
                },
                "getMemberObjects": {
                    "path": "/servicePrincipals/{id}/getMemberObjects",
                    "delegatedPermission": "Directory.Read.All",
                    "applicationPermission": "Directory.Read.All",
                    "method": "POST"
                },
                "ownedObjects": {
                    "path": "/servicePrincipals/{id}/ownedObjects",
                    "delegatedPermission": "Directory.Read.All",
                    "applicationPermission": "Directory.Read.All"
                }
            }
        }
    },
    "Applications": {
        "applications": {
            "path": "/applications",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All",
            "audience": ["https://graph.microsoft.com"],
            "actions": {
                "extensionProperties": {
                    "path": "/applications/{id}/extensionProperties",
                    "delegatedPermission": "Directory.Read.All",
                    "applicationPermission": "Directory.Read.All"
                },
                "owners": {
                    "path": "/applications/{id}/owners",
                    "delegatedPermission": "Directory.Read.All",
                    "applicationPermission": "Directory.Read.All",
                    "select": "id, userPrincipalName, displayName"
                },
                "tokenIssuancePolicies": {
                    "path": "/applications/{id}/tokenIssuancePolicies",
                    "delegatedPermission": "Policy.Read.All",
                    "applicationPermission": "Policy.Read.All,Application.ReadWrite.All"
                },
                "tokenLifetimePolicies": {
                    "path": "/applications/{id}/tokenLifetimePolicies",
                    "delegatedPermission": "Policy.Read.All",
                    "applicationPermission": "Policy.Read.All,Application.ReadWrite.All"
                }
            }
        }
    }
}
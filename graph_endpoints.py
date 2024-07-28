GRAPH_ENDPOINTS = {
    "Me": {
        "Me": {
            "path": "/me",
            "delegatedPermission": "User.Read",
            "applicationPermission": "User.Read.All"
        }
    },
    "Organization": {
        "organization": {
            "path": "/organization",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All"
        }
    },
    "Domains": {
        "domains": {
            "path": "/domains",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All"
        }
    },
    "Identity": {
        "apiConnectors": {
            "path": "/identity/apiConnectors",
            "delegatedPermission": "APIConnectors.ReadWrite.All",
            "applicationPermission": "APIConnectors.ReadWrite.All"
        },
        "userFlows": {
            "path": "/identity/userFlows",
            "delegatedPermission": "IdentityUserFlow.Read.All",
            "applicationPermission": "IdentityUserFlow.Read.All"
        },
        "b2cUserFlows": {
            "b2cUserFlows": {
                "path": "/identity/b2cUserFlows",
                "delegatedPermission": "IdentityUserFlow.Read.All",
                "applicationPermission": "IdentityUserFlow.Read.All"
            }
        },
        "userFlowAttributes": {
            "path": "/identity/userFlowAttributes",
            "delegatedPermission": "IdentityUserFlow.Read.All",
            "applicationPermission": "IdentityUserFlow.Read.All"
        },
        "b2xUserFlows": {
            "b2xUserFlows": {
                "path": "/identity/b2xUserFlows",
                "delegatedPermission": "IdentityUserFlow.Read.All",
                "applicationPermission": "IdentityUserFlow.Read.All"
            }
        },
        "customAuthenticationExtensions": {
            "path": "/identity/customAuthenticationExtensions",
            "delegatedPermission": "Application.Read.All",
            "applicationPermission": "Application.Read.All"
        },
        "conditionalAccess": {
            "policies": {
                "path": "/identity/conditionalAccess/policies",
                "delegatedPermission": "Policy.Read.All",
                "applicationPermission": "Policy.Read.All"
            },
            "namedLocations": {
                "path": "/identity/conditionalAccess/namedLocations",
                "delegatedPermission": "Policy.Read.All",
                "applicationPermission": "Policy.Read.All"
            }
        }
    },
    "IdentityProviders": {
        "identityProviders": {
            "path": "/identityProviders",
            "delegatedPermission": "IdentityProvider.Read.All",
            "applicationPermission": None
        }
    },
    "SubscribedSkus": {
        "subscribedSkus": {
            "path": "/subscribedSkus",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All"
        }
    },
    "DirectoryRoles": {
        "directoryRoles": {
            "path": "/directoryRoles",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All"
        }
    },
    "Policies": {
        "identitySecurityDefaultsEnforcementPolicy": {
            "path": "/policies/identitySecurityDefaultsEnforcementPolicy",
            "delegatedPermission": "Policy.Read.All",
            "applicationPermission": "Policy.Read.All"
        },
        "authorizationPolicy": {
            "path": "/policies/authorizationPolicy",
            "delegatedPermission": "Policy.Read.All",
            "applicationPermission": "Policy.Read.All"
        },
        "featureRolloutPolicies": {
            "path": "/policies/featureRolloutPolicies",
            "delegatedPermission": "Directory.ReadWrite.All",
            "applicationPermission": None
        },
        "activityBasedTimeoutPolicies": {
            "path": "/policies/activityBasedTimeoutPolicies",
            "delegatedPermission": "Policy.Read.All",
            "applicationPermission": "Policy.Read.All"
        },
        "homeRealmDiscoveryPolicies": {
            "path": "/policies/homeRealmDiscoveryPolicies",
            "delegatedPermission": "Policy.Read.All",
            "applicationPermission": "Policy.Read.All"
        },
        "claimsMappingPolicies": {
            "path": "/policies/claimsMappingPolicies",
            "delegatedPermission": "Policy.Read.All",
            "applicationPermission": "Policy.Read.All"
        },
        "tokenIssuancePolicies": {
            "path": "/policies/tokenIssuancePolicies",
            "delegatedPermission": "Policy.Read.All",
            "applicationPermission": "Policy.Read.All"
        },
        "tokenLifetimePolicies": {
            "path": "/policies/tokenLifetimePolicies",
            "delegatedPermission": "Policy.Read.All",
            "applicationPermission": "Policy.Read.All"
        },
        "authenticationMethodsPolicy": {
            "email": {
                "path": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/email",
                "delegatedPermission": "Policy.Read.All",
                "applicationPermission": "Policy.Read.All"
            },
            "fido2": {
                "path": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/fido2",
                "delegatedPermission": "Policy.Read.All",
                "applicationPermission": "Policy.Read.All"
            },
            "microsoftAuthenticator": {
                "path": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/microsoftAuthenticator",
                "delegatedPermission": "Policy.Read.All",
                "applicationPermission": "Policy.Read.All"
            },
            "sms": {
                "path": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/sms",
                "delegatedPermission": "Policy.Read.All",
                "applicationPermission": "Policy.Read.All"
            },
            "temporaryAccessPass": {
                "path": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/temporaryAccessPass",
                "delegatedPermission": "Policy.Read.All",
                "applicationPermission": "Policy.Read.All"
            },
            "softwareOath": {
                "path": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/softwareOath",
                "delegatedPermission": "Policy.Read.All",
                "applicationPermission": "Policy.Read.All"
            },
            "voice": {
                "path": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/voice",
                "delegatedPermission": "Policy.Read.All",
                "applicationPermission": "Policy.Read.All"
            },
            "x509Certificate": {
                "path": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/x509Certificate",
                "delegatedPermission": "Policy.Read.All",
                "applicationPermission": "Policy.Read.All"
            }
        },
        "adminConsentRequestPolicy": {
            "path": "/policies/adminConsentRequestPolicy",
            "delegatedPermission": "Policy.Read.All",
            "applicationPermission": "Policy.Read.All"
        },
        "permissionGrantPolicies": {
            "path": "/policies/permissionGrantPolicies",
            "delegatedPermission": "Policy.Read.PermissionGrant",
            "applicationPermission": "Policy.Read.PermissionGrant"
        },
        "externalIdentitiesPolicy": {
            "path": "/policies/externalIdentitiesPolicy",
            "delegatedPermission": "Policy.Read.All",
            "applicationPermission": "Policy.Read.All"
        },
        "crossTenantAccessPolicy": {
            "crossTenantAccessPolicy": {
                "path": "/policies/crossTenantAccessPolicy",
                "delegatedPermission": "Policy.Read.All",
                "applicationPermission": "Policy.Read.All"
            },
            "default": {
                "path": "/policies/crossTenantAccessPolicy/default",
                "delegatedPermission": "Policy.Read.All",
                "applicationPermission": "Policy.Read.All"
            },
            "partners": {
                "path": "/policies/crossTenantAccessPolicy/partners",
                "delegatedPermission": "Policy.Read.All",
                "applicationPermission": "Policy.Read.All"
            }
        }
    },
    "IdentityGovernance": {
        "entitlementManagement": {
            "accessPackages": {
                "path": "/identityGovernance/entitlementManagement/accessPackages",
                "delegatedPermission": "EntitlementManagement.Read.All",
                "applicationPermission": "EntitlementManagement.Read.All"
            },
            "connectedOrganizations": {
                "connectedOrganizations": {
                    "path": "/identityGovernance/entitlementManagement/connectedOrganizations",
                    "delegatedPermission": "EntitlementManagement.Read.All",
                    "applicationPermission": "EntitlementManagement.Read.All"
                },
            },
            "settings": {
                "path": "/identityGovernance/entitlementManagement/settings",
                "delegatedPermission": "EntitlementManagement.Read.All",
                "applicationPermission": "EntitlementManagement.Read.All"
            },
        },
        "accessReviews": {
            "definitions": {
                "definitions": {
                    "path": "/identityGovernance/accessReviews/definitions",
                    "delegatedPermission": "AccessReview.Read.All",
                    "applicationPermission": "AccessReview.Read.All"
                },
                "children": {
                    "instances": {}
                }
            }
        },
        "termsOfUse": {
            "agreements": {
                "path": "/identityGovernance/termsOfUse/agreements",
                "delegatedPermission": "Agreement.Read.All",
                "applicationPermission": None
            },
        }
    },
    "AdministrativeUnits": {
        "administrativeUnits": {
            "path": "/AdministrativeUnits",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All"
        },
    },
    "PrivilegedAccess": {
        "aadroles": {
            "resources": {
                "resources": {
                    "path": "/privilegedAccess/aadroles/resources",
                    "delegatedPermission": "PrivilegedAccess.ReadWrite.AzureAD",
                    "applicationPermission": "PrivilegedAccess.Read.AzureAD"
                },
            }
        },
        "azureResources": {
            "resources": {
                "resources": {
                    "path": "/privilegedAccess/azureResources/resources",
                    "delegatedPermission": "PrivilegedAccess.ReadWrite.AzureResources",
                    "applicationPermission": "PrivilegedAccess.Read.AzureResources"
                },
            }
        }
    },
    "OnPremisesPublishingProfiles": {
        "provisioning": {
            "provisioning": {
                "path": "/onPremisesPublishingProfiles/provisioning",
                "delegatedPermission": "OnPremisesPublishingProfiles.ReadWrite.All",
                "applicationPermission": None
            },
            "publishedResources": {
                "path": "/onPremisesPublishingProfiles/provisioning/publishedResources",
                "delegatedPermission": "OnPremisesPublishingProfiles.ReadWrite.All",
                "applicationPermission": None
            },
            "agentGroups": {
                "path": "/onPremisesPublishingProfiles/provisioning/agentGroups",
                "delegatedPermission": "OnPremisesPublishingProfiles.ReadWrite.All",
                "applicationPermission": None
            },
            "agents": {
                "path": "/onPremisesPublishingProfiles/provisioning/agents",
                "delegatedPermission": "OnPremisesPublishingProfiles.ReadWrite.All",
                "applicationPermission": None
            },
        },
        "applicationProxy": {
            "connectors": {
                "path": "/onPremisesPublishingProfiles/applicationProxy/connectors",
                "delegatedPermission": "Directory.ReadWrite.All",
                "applicationPermission": None
            },
            "connectorGroups": {
                "connectorGroups": {
                    "path": "/onPremisesPublishingProfiles/applicationProxy/connectorGroups",
                    "delegatedPermission": "Directory.ReadWrite.All",
                    "applicationPermission": None
                },
            }
        }
    },
    "Groups": {
        "groups": {
            "path": "/groups",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All"
        },
        "dynamicGroups": {
            "path": "/groups?$filter=groupTypes/any(s:s eq 'DynamicMembership')",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All"
        }
    },
    "GroupSettings": {
        "groupSettings": {
            "path": "/groupSettings",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All"
        },
    },
    "Applications": {
        "applications": {
            "path": "/applications",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All"
        },
    },
    "ServicePrincipals": {
        "servicePrincipals": {
            "path": "/servicePrincipals",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All"
        },
    },
    "Users": {
        "users": {
            "path": "/users",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All"
        },
    },
    "Devices": {
        "devices": {
            "path": "/devices",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All"
        },
    },
    "Teamwork": {
        "teamwork": {
            "path": "/teamwork",
            "delegatedPermission": "Teamwork.Read.All",
            "applicationPermission": "Teamwork.Read.All"
        },
    },
    "Admin": {
        "sharepoint": {
            "settings": {
                "path": "/admin/sharepoint/settings",
                "delegatedPermission": "SharePointTenantSettings.Read.All",
                "applicationPermission": "SharePointTenantSettings.Read.All"
            },
        }
    },
    "RoleManagement": {
        "directory": {
            "roleDefinitions": {
                "path": "/roleManagement/directory/roleDefinitions",
                "delegatedPermission": "RoleManagement.Read.All",
                "applicationPermission": "RoleManagement.Read.All"
            },
            "roleAssignments": {
                "path": "/roleManagement/directory/roleAssignments",
                "delegatedPermission": "RoleManagement.Read.All",
                "applicationPermission": "RoleManagement.Read.All"
            },
        },
        "exchange": {
            "roleDefinitions": {
                "path": "/roleManagement/exchange/roleDefinitions",
                "delegatedPermission": "RoleManagement.Read.All",
                "applicationPermission": "RoleManagement.Read.All"
            },
            "roleAssignments": {
                "path": "/roleManagement/exchange/roleAssignments",
                "delegatedPermission": "RoleManagement.Read.All",
                "applicationPermission": "RoleManagement.Read.All"
            },
        },
        "deviceManagement": {
            "roleDefinitions": {
                "path": "/roleManagement/deviceManagement/roleDefinitions",
                "delegatedPermission": "RoleManagement.Read.All",
                "applicationPermission": "RoleManagement.Read.All"
            },
            "roleAssignments": {
                "path": "/roleManagement/deviceManagement/roleAssignments",
                "delegatedPermission": "RoleManagement.Read.All",
                "applicationPermission": "RoleManagement.Read.All"
            },
        },
        "cloudPC": {
            "roleDefinitions": {
                "path": "/roleManagement/cloudPC/roleDefinitions",
                "delegatedPermission": "RoleManagement.Read.All",
                "applicationPermission": "RoleManagement.Read.All"
            },
            "roleAssignments": {
                "path": "/roleManagement/cloudPC/roleAssignments",
                "delegatedPermission": "RoleManagement.Read.All",
                "applicationPermission": "RoleManagement.Read.All"
            },
        },
        "entitlementManagement": {
            "roleDefinitions": {
                "path": "/roleManagement/entitlementManagement/roleDefinitions",
                "delegatedPermission": "RoleManagement.Read.All",
                "applicationPermission": "RoleManagement.Read.All"
            },
            "roleAssignments": {
                "path": "/roleManagement/entitlementManagement/roleAssignments",
                "delegatedPermission": "RoleManagement.Read.All",
                "applicationPermission": "RoleManagement.Read.All"
            },
        }
    },
    "Reports": {
        "authenticationMethods": {
            "usersRegisteredByFeature": {
                "path": "/reports/authenticationMethods/microsoft.graph.usersRegisteredByFeature()",
                "delegatedPermission": "AuditLog.Read.All",
                "applicationPermission": None
            }
        }
    }
}
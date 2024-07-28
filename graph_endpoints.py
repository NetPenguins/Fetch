GRAPH_ENDPOINTS = {
    "Me": {
        "Me": "/me",
    },
    "Organization": {
        "organization": "/organization",
    },
    "Domains": {
        "domains": "/domains",
    },
    "Identity": {
        "apiConnectors": "/identity/apiConnectors",
        "userFlows": "/identity/userFlows",
        "b2cUserFlows": {
            "b2cUserFlows": "/identity/b2cUserFlows",
        },
        "userFlowAttributes": "/identity/userFlowAttributes",
        "b2xUserFlows": {
            "b2xUserFlows": "/identity/b2xUserFlows",
        },
        "customAuthenticationExtensions": "/identity/customAuthenticationExtensions",
        "conditionalAccess": {
            "policies": "/identity/conditionalAccess/policies",
            "namedLocations": "/identity/conditionalAccess/namedLocations",
        }
    },
    "IdentityProviders": {
        "identityProviders": "/identityProviders",
    },
    "SubscribedSkus": {
        "subscribedSkus": "/subscribedSkus",
    },
    "DirectoryRoles": {
        "directoryRoles": "/directoryRoles",
    },
    "Policies": {
        "identitySecurityDefaultsEnforcementPolicy": "/policies/identitySecurityDefaultsEnforcementPolicy",
        "authorizationPolicy": "/policies/authorizationPolicy",
        "featureRolloutPolicies": "/policies/featureRolloutPolicies",
        "activityBasedTimeoutPolicies": "/policies/activityBasedTimeoutPolicies",
        "homeRealmDiscoveryPolicies": "/policies/homeRealmDiscoveryPolicies",
        "claimsMappingPolicies": "/policies/claimsMappingPolicies",
        "tokenIssuancePolicies": "/policies/tokenIssuancePolicies",
        "tokenLifetimePolicies": "/policies/tokenLifetimePolicies",
        "authenticationMethodsPolicy": {
            "email": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/email",
            "fido2": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/fido2",
            "microsoftAuthenticator": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/microsoftAuthenticator",
            "sms": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/sms",
            "temporaryAccessPass": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/temporaryAccessPass",
            "softwareOath": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/softwareOath",
            "voice": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/voice",
            "x509Certificate": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/x509Certificate",
        },
        "adminConsentRequestPolicy": "/policies/adminConsentRequestPolicy",
        "permissionGrantPolicies": "/policies/permissionGrantPolicies",
        "externalIdentitiesPolicy": "/policies/externalIdentitiesPolicy",
        "crossTenantAccessPolicy": {
            "crossTenantAccessPolicy": "/policies/crossTenantAccessPolicy",
            "default": "/policies/crossTenantAccessPolicy/default",
            "partners": "/policies/crossTenantAccessPolicy/partners",
        }
    },
    "IdentityGovernance": {
        "entitlementManagement": {
            "accessPackages": "/identityGovernance/entitlementManagement/accessPackages",
            "connectedOrganizations": {
                "connectedOrganizations": "/identityGovernance/entitlementManagement/connectedOrganizations",
            },
            "settings": "/identityGovernance/entitlementManagement/settings",
        },
        "accessReviews": {
            "definitions": {
                "definitions": "/identityGovernance/accessReviews/definitions",
                "children": {
                    "instances": {
                    }
                }
            }
        },
        "termsOfUse": {
            "agreements": "/identityGovernance/termsOfUse/agreements",
        }
    },
    "AdministrativeUnits": {
        "administrativeUnits": "/AdministrativeUnits",
    },
    "PrivilegedAccess": {
        "aadroles": {
            "resources": {
                "resources": "/privilegedAccess/aadroles/resources",
            }
        },
        "azureResources": {
            "resources": {
                "resources": "/privilegedAccess/azureResources/resources",
            }
        }
    },
    "OnPremisesPublishingProfiles": {
        "provisioning": {
            "provisioning": "/onPremisesPublishingProfiles/provisioning",
            "publishedResources": "/onPremisesPublishingProfiles/provisioning/publishedResources",
            "agentGroups": "/onPremisesPublishingProfiles/provisioning/agentGroups",
            "agents": "/onPremisesPublishingProfiles/provisioning/agents",
        },
        "applicationProxy": {
            "connectors": "/onPremisesPublishingProfiles/applicationProxy/connectors",
            "connectorGroups": {
                "connectorGroups": "/onPremisesPublishingProfiles/applicationProxy/connectorGroups",
            }
        }
    },
    "Groups": {
        "groups": "/groups",
        "dynamicGroups": "/groups?$filter=groupTypes/any(s:s eq 'DynamicMembership')"
    },
    "GroupSettings": {
        "groupSettings": "/groupSettings",
    },
    "Applications": {
        "applications": "/applications",
    },
    "ServicePrincipals": {
        "servicePrincipals": "/servicePrincipals",
    },
    "Users": {
        "users": "/users",
    },
    "Devices": {
        "devices": "/devices",
    },
    "Teamwork": {
        "teamwork": "/teamwork",
    },
    "Admin": {
        "sharepoint": {
            "settings": "/admin/sharepoint/settings",
        }
    },
    "RoleManagement": {
        "directory": {
            "roleDefinitions": "/roleManagement/directory/roleDefinitions",
            "roleAssignments": "/roleManagement/directory/roleAssignments",
        },
        "exchange": {
            "roleDefinitions": "/roleManagement/exchange/roleDefinitions",
            "roleAssignments": "/roleManagement/exchange/roleAssignments",
        },
        "deviceManagement": {
            "roleDefinitions": "/roleManagement/deviceManagement/roleDefinitions",
            "roleAssignments": "/roleManagement/deviceManagement/roleAssignments",
        },
        "cloudPC": {
            "roleDefinitions": "/roleManagement/cloudPC/roleDefinitions",
            "roleAssignments": "/roleManagement/cloudPC/roleAssignments",
        },
        "entitlementManagement": {
            "roleDefinitions": "/roleManagement/entitlementManagement/roleDefinitions",
            "roleAssignments": "/roleManagement/entitlementManagement/roleAssignments",
        }
    },
    "Reports": {
        "authenticationMethods": {
            "usersRegisteredByFeature": "/reports/authenticationMethods/microsoft.graph.usersRegisteredByFeature()"
        }
    }
}
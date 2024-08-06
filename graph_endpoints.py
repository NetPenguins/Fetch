GRAPH_ENDPOINTS = {
    "Me": {
        "me": {
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
    "Governance": {
        "appConsent": {
            "appConsentRequests": {
                "path": "/identityGovernance/appConsent/appConsentRequests",
                "delegatedPermission": "ConsentRequest.Read.All",
                "applicationPermission": "ConsentRequest.Read.All"
            }
        },
        "policies": {
            "adminConsentRequestPolicy": {
                "path": "/policies/adminConsentRequestPolicy",
                "delegatedPermission": "Policy.Read.All",
                "applicationPermission": "Policy.Read.All"
            }
        }
    },
    "Identity": {
        "apiConnectors": {
            "path": "/identity/apiConnectors",
            "delegatedPermission": "APIConnectors.ReadWrite.All",
            "applicationPermission": "APIConnectors.ReadWrite.All"
        },
        "oauth2PermissionGrants": {
            "path": "/oauth2PermissionGrants",
            "delegatedPermission": "Directory.ReadWrite.All",
            "applicationPermission": "DelegatedPermissionGrant.ReadWrite.All"
        },
        "userFlows": {
            "path": "/identity/userFlows",
            "delegatedPermission": "IdentityUserFlow.Read.All",
            "applicationPermission": "IdentityUserFlow.Read.All"
        },
        "authenticationEventListeners": {
            "path": "/identity/authenticationEventListeners",
            "delegatedPermission": "IdentityUserFlow.Read.All",
            "applicationPermission": "IdentityUserFlow.Read.All"
        },
        "b2cUserFlows": {
            "path": "/identity/b2cUserFlows",
            "delegatedPermission": "IdentityUserFlow.Read.All",
            "applicationPermission": "IdentityUserFlow.Read.All"
        },
        "userFlowAttributes": {
            "path": "/identity/userFlowAttributes",
            "delegatedPermission": "IdentityUserFlow.Read.All",
            "applicationPermission": "IdentityUserFlow.Read.All"
        },
        "b2xUserFlows": {
            "path": "/identity/b2xUserFlows",
            "delegatedPermission": "IdentityUserFlow.Read.All",
            "applicationPermission": "IdentityUserFlow.Read.All"
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
            "applicationPermission": "IdentityProvider.Read.All"
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
            "applicationPermission": "Directory.ReadWrite.All"
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
                "path": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations"
                        "/microsoftAuthenticator",
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
            "path": "/policies/crossTenantAccessPolicy",
            "delegatedPermission": "Policy.Read.All",
            "applicationPermission": "Policy.Read.All"
        },
        "crossTenantAccessPolicyDefault": {
            "path": "/policies/crossTenantAccessPolicy/default",
            "delegatedPermission": "Policy.Read.All",
            "applicationPermission": "Policy.Read.All"
        },
        "crossTenantAccessPolicyPartners": {
            "path": "/policies/crossTenantAccessPolicy/partners",
            "delegatedPermission": "Policy.Read.All",
            "applicationPermission": "Policy.Read.All"
        }
    },
    "IdentityGovernance": {
        "entitlementManagementAccessPackages": {
            "path": "/identityGovernance/entitlementManagement/accessPackages",
            "delegatedPermission": "EntitlementManagement.Read.All",
            "applicationPermission": "EntitlementManagement.Read.All"
        },
        "entitlementManagementConnectedOrganizations": {
            "path": "/identityGovernance/entitlementManagement/connectedOrganizations",
            "delegatedPermission": "EntitlementManagement.Read.All",
            "applicationPermission": "EntitlementManagement.Read.All"
        },
        "entitlementManagementSettings": {
            "path": "/identityGovernance/entitlementManagement/settings",
            "delegatedPermission": "EntitlementManagement.Read.All",
            "applicationPermission": "EntitlementManagement.Read.All"
        },
        "accessReviewsDefinitions": {
            "path": "/identityGovernance/accessReviews/definitions",
            "delegatedPermission": "AccessReview.Read.All",
            "applicationPermission": "AccessReview.Read.All"
        },
        "termsOfUseAgreements": {
            "path": "/identityGovernance/termsOfUse/agreements",
            "delegatedPermission": "Agreement.Read.All",
            "applicationPermission": "Agreement.Read.All"
        }
    },
    "AdministrativeUnits": {
        "administrativeUnits": {
            "path": "/administrativeUnits",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All"
        }
    },
    "PrivilegedAccess": {
        "aadRolesResources": {
            "path": "/privilegedAccess/aadRoles/resources",
            "delegatedPermission": "PrivilegedAccess.ReadWrite.AzureAD",
            "applicationPermission": "PrivilegedAccess.Read.AzureAD"
        },
        "azureResourcesResources": {
            "path": "/privilegedAccess/azureResources/resources",
            "delegatedPermission": "PrivilegedAccess.ReadWrite.AzureResources",
            "applicationPermission": "PrivilegedAccess.Read.AzureResources"
        }
    },
    "OnPremisesPublishingProfiles": {
        "provisioningProfiles": {
            "path": "/onPremisesPublishingProfiles/provisioning",
            "delegatedPermission": "OnPremisesPublishingProfiles.ReadWrite.All",
            "applicationPermission": "OnPremisesPublishingProfiles.ReadWrite.All"
        },
        "publishedResources": {
            "path": "/onPremisesPublishingProfiles/provisioning/publishedResources",
            "delegatedPermission": "OnPremisesPublishingProfiles.ReadWrite.All",
            "applicationPermission": "OnPremisesPublishingProfiles.ReadWrite.All"
        },
        "agentGroups": {
            "path": "/onPremisesPublishingProfiles/provisioning/agentGroups",
            "delegatedPermission": "OnPremisesPublishingProfiles.ReadWrite.All",
            "applicationPermission": "OnPremisesPublishingProfiles.ReadWrite.All"
        },
        "agents": {
            "path": "/onPremisesPublishingProfiles/provisioning/agents",
            "delegatedPermission": "OnPremisesPublishingProfiles.ReadWrite.All",
            "applicationPermission": "OnPremisesPublishingProfiles.ReadWrite.All"
        },
        "connectors": {
            "path": "/onPremisesPublishingProfiles/applicationProxy/connectors",
            "delegatedPermission": "Directory.ReadWrite.All",
            "applicationPermission": "Directory.ReadWrite.All"
        },
        "connectorGroups": {
            "path": "/onPremisesPublishingProfiles/applicationProxy/connectorGroups",
            "delegatedPermission": "Directory.ReadWrite.All",
            "applicationPermission": "Directory.ReadWrite.All"
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
        }
    },
    "Applications": {
        "applications": {
            "path": "/applications",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All"
        }
    },
    "ServicePrincipals": {
        "servicePrincipals": {
            "path": "/servicePrincipals",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All"
        }
    },
    "Users": {
        "users": {
            "path": "/users",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All"
        },
        "Guests": {
            "path": "/users?$filter=userType eq %27Guest%27",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All"
        },
        "OnPremises": {
            "path": "/users?$filter=OnPremisesSyncEnabled eq true",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All"
        },
        "DeltaUsers": {
            "path": "/users/delta",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All"
        }
    },
    "Devices": {
        "devices": {
            "path": "/devices",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All"
        }
    },
    "Teamwork": {
        "teamwork": {
            "path": "/teamwork",
            "delegatedPermission": "Teamwork.Read.All",
            "applicationPermission": "Teamwork.Read.All"
        }
    },
    "Sharepoint": {
        "sharepointSettings": {
            "path": "/admin/sharepoint/settings",
            "delegatedPermission": "SharePointTenantSettings.Read.All",
            "applicationPermission": "SharePointTenantSettings.Read.All"
        }
    },
    "Subscriptions": {
        "subscriptions": {
            "path": "/subscriptions",
            "delegatedPermission": "ManagedTenants.Read.All",
            "applicationPermission": "ManagedTenants.Read.All"
        }
    },
    "UserActivities": {
        "activities": {
            "path": "/me/activities",
            "delegatedPermission": "UserActivity.ReadWrite.CreatedByApp",
            "applicationPermission": "UserActivity.ReadWrite.CreatedByApp"
        }
    },
    "UserDrive": {
        "drive": {
            "path": "/me/drive",
            "delegatedPermission": "Files.Read",
            "applicationPermission": "Files.Read.All"
        }
    },
    "UserMail": {
        "mail": {
            "path": "/me/messages",
            "delegatedPermission": "Mail.Read",
            "applicationPermission": "Mail.Read"
        }
    },
    "AuditLogs": {
        "provisioning": {
            "path": "/auditLogs/provisioning",
            "delegatedPermission": "AuditLog.Read.All,Directory.Read.All",
            "applicationPermission": "AuditLog.Read.All,Directory.Read.All"
        },
        "directoryLogs": {
            "path": "/auditLogs/directoryAudits",
            "delegatedPermission": "AuditLog.Read.All",
            "applicationPermission": "AuditLog.Read.All"
        },
        "signIns": {
            "path": "/auditLogs/signIns",
            "delegatedPermission": "AuditLog.Read.All",
            "applicationPermission": "AuditLog.Read.All"
        }
    },
    "RoleManagement": {
        "directoryRoleDefinitions": {
            "path": "/roleManagement/directory/roleDefinitions",
            "delegatedPermission": "RoleManagement.Read.All",
            "applicationPermission": "RoleManagement.Read.All"
        },
        "directoryRoleAssignments": {
            "path": "/roleManagement/directory/roleAssignments",
            "delegatedPermission": "RoleManagement.Read.All",
            "applicationPermission": "RoleManagement.Read.All"
        },
        "exchangeRoleDefinitions": {
            "path": "/roleManagement/exchange/roleDefinitions",
            "delegatedPermission": "RoleManagement.Read.All",
            "applicationPermission": "RoleManagement.Read.All"
        },
        "exchangeRoleAssignments": {
            "path": "/roleManagement/exchange/roleAssignments",
            "delegatedPermission": "RoleManagement.Read.All",
            "applicationPermission": "RoleManagement.Read.All"
        },
        "deviceManagementRoleDefinitions": {
            "path": "/roleManagement/deviceManagement/roleDefinitions",
            "delegatedPermission": "RoleManagement.Read.All",
            "applicationPermission": "RoleManagement.Read.All"
        },
        "deviceManagementRoleAssignments": {
            "path": "/roleManagement/deviceManagement/roleAssignments",
            "delegatedPermission": "RoleManagement.Read.All",
            "applicationPermission": "RoleManagement.Read.All"
        },
        "cloudPCRoleDefinitions": {
            "path": "/roleManagement/cloudPC/roleDefinitions",
            "delegatedPermission": "RoleManagement.Read.All",
            "applicationPermission": "RoleManagement.Read.All"
        },
        "cloudPCRoleAssignments": {
            "path": "/roleManagement/cloudPC/roleAssignments",
            "delegatedPermission": "RoleManagement.Read.All",
            "applicationPermission": "RoleManagement.Read.All"
        },
        "entitlementManagementRoleDefinitions": {
            "path": "/roleManagement/entitlementManagement/roleDefinitions",
            "delegatedPermission": "RoleManagement.Read.All",
            "applicationPermission": "RoleManagement.Read.All"
        },
        "entitlementManagementRoleAssignments": {
            "path": "/roleManagement/entitlementManagement/roleAssignments",
            "delegatedPermission": "RoleManagement.Read.All",
            "applicationPermission": "RoleManagement.Read.All"
        }
    },
    "Reports": {
        "userRegistrationDetails": {
            "path": "/reports/authenticationMethods/userRegistrationDetails",
            "delegatedPermission": "AuditLog.Read.All",
            "applicationPermission": "AuditLog.Read.All"
        }
    }
}

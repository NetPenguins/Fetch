GRAPH_ENDPOINTS = {
    "Me": {
        "me": {
            "path": "/me",
            "delegatedPermission": "User.Read",
            "applicationPermission": "User.Read.All",
            "audience": ["https://graph.microsoft.com"]
        }
    },
    "Organization": {
        "organization": {
            "path": "/organization",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All",
            "audience": ["https://graph.microsoft.com"]
        }
    },
    "Domains": {
        "domains": {
            "path": "/domains",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All",
            "audience": ["https://graph.microsoft.com"]
        }
    },
    "Governance": {
        "appConsent": {
            "appConsentRequests": {
                "path": "/identityGovernance/appConsent/appConsentRequests",
                "delegatedPermission": "ConsentRequest.Read.All",
                "applicationPermission": "ConsentRequest.Read.All",
                "audience": ["https://graph.microsoft.com"]
            }
        },
        "policies": {
            "adminConsentRequestPolicy": {
                "path": "/policies/adminConsentRequestPolicy",
                "delegatedPermission": "Policy.Read.All",
                "applicationPermission": "Policy.Read.All",
                "audience": ["https://graph.microsoft.com"]
            }
        }
    },
    "Identity": {
        "apiConnectors": {
            "path": "/identity/apiConnectors",
            "delegatedPermission": "APIConnectors.ReadWrite.All",
            "applicationPermission": "APIConnectors.ReadWrite.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "oauth2PermissionGrants": {
            "path": "/oauth2PermissionGrants",
            "delegatedPermission": "Directory.ReadWrite.All",
            "applicationPermission": "DelegatedPermissionGrant.ReadWrite.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "userFlows": {
            "path": "/identity/userFlows",
            "delegatedPermission": "IdentityUserFlow.Read.All",
            "applicationPermission": "IdentityUserFlow.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "authenticationEventListeners": {
            "path": "/identity/authenticationEventListeners",
            "delegatedPermission": "IdentityUserFlow.Read.All",
            "applicationPermission": "IdentityUserFlow.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "b2cUserFlows": {
            "path": "/identity/b2cUserFlows",
            "delegatedPermission": "IdentityUserFlow.Read.All",
            "applicationPermission": "IdentityUserFlow.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "userFlowAttributes": {
            "path": "/identity/userFlowAttributes",
            "delegatedPermission": "IdentityUserFlow.Read.All",
            "applicationPermission": "IdentityUserFlow.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "b2xUserFlows": {
            "path": "/identity/b2xUserFlows",
            "delegatedPermission": "IdentityUserFlow.Read.All",
            "applicationPermission": "IdentityUserFlow.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "customAuthenticationExtensions": {
            "path": "/identity/customAuthenticationExtensions",
            "delegatedPermission": "Application.Read.All",
            "applicationPermission": "Application.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "conditionalAccess": {
            "policies": {
                "path": "/identity/conditionalAccess/policies",
                "delegatedPermission": "Policy.Read.All",
                "applicationPermission": "Policy.Read.All",
                "audience": ["https://graph.microsoft.com"]
            },
            "namedLocations": {
                "path": "/identity/conditionalAccess/namedLocations",
                "delegatedPermission": "Policy.Read.All",
                "applicationPermission": "Policy.Read.All",
                "audience": ["https://graph.microsoft.com"]
            }
        }
    },
    "IdentityProviders": {
        "identityProviders": {
            "path": "/identityProviders",
            "delegatedPermission": "IdentityProvider.Read.All",
            "applicationPermission": "IdentityProvider.Read.All",
            "audience": ["https://graph.microsoft.com"]
        }
    },
    "SubscribedSkus": {
        "subscribedSkus": {
            "path": "/subscribedSkus",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All",
            "audience": ["https://graph.microsoft.com"]
        }
    },
    "DirectoryRoles": {
        "directoryRoles": {
            "path": "/directoryRoles",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All",
            "audience": ["https://graph.microsoft.com"]
        }
    },
    "Policies": {
        "identitySecurityDefaultsEnforcementPolicy": {
            "path": "/policies/identitySecurityDefaultsEnforcementPolicy",
            "delegatedPermission": "Policy.Read.All",
            "applicationPermission": "Policy.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "authorizationPolicy": {
            "path": "/policies/authorizationPolicy",
            "delegatedPermission": "Policy.Read.All",
            "applicationPermission": "Policy.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "featureRolloutPolicies": {
            "path": "/policies/featureRolloutPolicies",
            "delegatedPermission": "Directory.ReadWrite.All",
            "applicationPermission": "Directory.ReadWrite.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "activityBasedTimeoutPolicies": {
            "path": "/policies/activityBasedTimeoutPolicies",
            "delegatedPermission": "Policy.Read.All",
            "applicationPermission": "Policy.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "homeRealmDiscoveryPolicies": {
            "path": "/policies/homeRealmDiscoveryPolicies",
            "delegatedPermission": "Policy.Read.All",
            "applicationPermission": "Policy.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "claimsMappingPolicies": {
            "path": "/policies/claimsMappingPolicies",
            "delegatedPermission": "Policy.Read.All",
            "applicationPermission": "Policy.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "tokenIssuancePolicies": {
            "path": "/policies/tokenIssuancePolicies",
            "delegatedPermission": "Policy.Read.All",
            "applicationPermission": "Policy.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "tokenLifetimePolicies": {
            "path": "/policies/tokenLifetimePolicies",
            "delegatedPermission": "Policy.Read.All",
            "applicationPermission": "Policy.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "authenticationMethodsPolicy": {
            "email": {
                "path": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/email",
                "delegatedPermission": "Policy.Read.All",
                "applicationPermission": "Policy.Read.All",
                "audience": ["https://graph.microsoft.com"]
            },
            "fido2": {
                "path": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/fido2",
                "delegatedPermission": "Policy.Read.All",
                "applicationPermission": "Policy.Read.All",
                "audience": ["https://graph.microsoft.com"]
            },
            "microsoftAuthenticator": {
                "path": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/microsoftAuthenticator",
                "delegatedPermission": "Policy.Read.All",
                "applicationPermission": "Policy.Read.All",
                "audience": ["https://graph.microsoft.com"]
            },
            "sms": {
                "path": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/sms",
                "delegatedPermission": "Policy.Read.All",
                "applicationPermission": "Policy.Read.All",
                "audience": ["https://graph.microsoft.com"]
            },
            "temporaryAccessPass": {
                "path": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/temporaryAccessPass",
                "delegatedPermission": "Policy.Read.All",
                "applicationPermission": "Policy.Read.All",
                "audience": ["https://graph.microsoft.com"]
            },
            "softwareOath": {
                "path": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/softwareOath",
                "delegatedPermission": "Policy.Read.All",
                "applicationPermission": "Policy.Read.All",
                "audience": ["https://graph.microsoft.com"]
            },
            "voice": {
                "path": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/voice",
                "delegatedPermission": "Policy.Read.All",
                "applicationPermission": "Policy.Read.All",
                "audience": ["https://graph.microsoft.com"]
            },
            "x509Certificate": {
                "path": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/x509Certificate",
                "delegatedPermission": "Policy.Read.All",
                "applicationPermission": "Policy.Read.All",
                "audience": ["https://graph.microsoft.com"]
            }
        },
        "adminConsentRequestPolicy": {
            "path": "/policies/adminConsentRequestPolicy",
            "delegatedPermission": "Policy.Read.All",
            "applicationPermission": "Policy.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "permissionGrantPolicies": {
            "path": "/policies/permissionGrantPolicies",
            "delegatedPermission": "Policy.Read.PermissionGrant",
            "applicationPermission": "Policy.Read.PermissionGrant",
            "audience": ["https://graph.microsoft.com"]
        },
        "externalIdentitiesPolicy": {
            "path": "/policies/externalIdentitiesPolicy",
            "delegatedPermission": "Policy.Read.All",
            "applicationPermission": "Policy.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "crossTenantAccessPolicy": {
            "path": "/policies/crossTenantAccessPolicy",
            "delegatedPermission": "Policy.Read.All",
            "applicationPermission": "Policy.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "crossTenantAccessPolicyDefault": {
            "path": "/policies/crossTenantAccessPolicy/default",
            "delegatedPermission": "Policy.Read.All",
            "applicationPermission": "Policy.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "crossTenantAccessPolicyPartners": {
            "path": "/policies/crossTenantAccessPolicy/partners",
            "delegatedPermission": "Policy.Read.All",
            "applicationPermission": "Policy.Read.All",
            "audience": ["https://graph.microsoft.com"]
        }
    },
    "IdentityGovernance": {
        "entitlementManagementAccessPackages": {
            "path": "/identityGovernance/entitlementManagement/accessPackages",
            "delegatedPermission": "EntitlementManagement.Read.All",
            "applicationPermission": "EntitlementManagement.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "entitlementManagementConnectedOrganizations": {
            "path": "/identityGovernance/entitlementManagement/connectedOrganizations",
            "delegatedPermission": "EntitlementManagement.Read.All",
            "applicationPermission": "EntitlementManagement.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "entitlementManagementSettings": {
            "path": "/identityGovernance/entitlementManagement/settings",
            "delegatedPermission": "EntitlementManagement.Read.All",
            "applicationPermission": "EntitlementManagement.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "accessReviewsDefinitions": {
            "path": "/identityGovernance/accessReviews/definitions",
            "delegatedPermission": "AccessReview.Read.All",
            "applicationPermission": "AccessReview.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "termsOfUseAgreements": {
            "path": "/identityGovernance/termsOfUse/agreements",
            "delegatedPermission": "Agreement.Read.All",
            "applicationPermission": "Agreement.Read.All",
            "audience": ["https://graph.microsoft.com"]
        }
    },
    "AdministrativeUnits": {
        "administrativeUnits": {
            "path": "/administrativeUnits",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All",
            "audience": ["https://graph.microsoft.com"]
        }
    },
    "PrivilegedAccess": {
        "aadRolesResources": {
            "path": "/privilegedAccess/aadRoles/resources",
            "delegatedPermission": "PrivilegedAccess.ReadWrite.AzureAD",
            "applicationPermission": "PrivilegedAccess.Read.AzureAD",
            "audience": ["https://graph.microsoft.com"]
        },
        "azureResourcesResources": {
            "path": "/privilegedAccess/azureResources/resources",
            "delegatedPermission": "PrivilegedAccess.ReadWrite.AzureResources",
            "applicationPermission": "PrivilegedAccess.Read.AzureResources",
            "audience": ["https://graph.microsoft.com"]
        },
        "roleEligibilitySchedules": {
            "path": "/roleManagement/directory/roleEligibilityScheduleInstances",
            "delegatedPermission": "RoleEligibilitySchedule.Read.Directory",
            "applicationPermission": "RoleEligibilitySchedule.Read.Directory",
            "audience": ["https://graph.microsoft.com"]
        }
    },
    "OnPremisesPublishingProfiles": {
        "provisioningProfiles": {
            "path": "/onPremisesPublishingProfiles/provisioning",
            "delegatedPermission": "OnPremisesPublishingProfiles.ReadWrite.All",
            "applicationPermission": "OnPremisesPublishingProfiles.ReadWrite.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "publishedResources": {
            "path": "/onPremisesPublishingProfiles/provisioning/publishedResources",
            "delegatedPermission": "OnPremisesPublishingProfiles.ReadWrite.All",
            "applicationPermission": "OnPremisesPublishingProfiles.ReadWrite.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "agentGroups": {
            "path": "/onPremisesPublishingProfiles/provisioning/agentGroups",
            "delegatedPermission": "OnPremisesPublishingProfiles.ReadWrite.All",
            "applicationPermission": "OnPremisesPublishingProfiles.ReadWrite.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "agents": {
            "path": "/onPremisesPublishingProfiles/provisioning/agents",
            "delegatedPermission": "OnPremisesPublishingProfiles.ReadWrite.All",
            "applicationPermission": "OnPremisesPublishingProfiles.ReadWrite.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "connectors": {
            "path": "/onPremisesPublishingProfiles/applicationProxy/connectors",
            "delegatedPermission": "Directory.ReadWrite.All",
            "applicationPermission": "Directory.ReadWrite.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "connectorGroups": {
            "path": "/onPremisesPublishingProfiles/applicationProxy/connectorGroups",
            "delegatedPermission": "Directory.ReadWrite.All",
            "applicationPermission": "Directory.ReadWrite.All",
            "audience": ["https://graph.microsoft.com"]
        }
    },
    "Groups": {
        "groups": {
            "path": "/groups",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "dynamicGroups": {
            "path": "/groups?$filter=groupTypes/any(s:s eq 'DynamicMembership')",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All",
            "audience": ["https://graph.microsoft.com"]
        }
    },
    "GroupSettings": {
        "groupSettings": {
            "path": "/groupSettings",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All",
            "audience": ["https://graph.microsoft.com"]
        }
    },
    "Applications": {
        "applications": {
            "path": "/applications",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All",
            "audience": ["https://graph.microsoft.com"]
        }
    },
    "ServicePrincipals": {
        "servicePrincipals": {
            "path": "/servicePrincipals",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All",
            "audience": ["https://graph.microsoft.com"]
        }
    },
    "Users": {
        "users": {
            "path": "/users",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "Guests": {
            "path": "/users?$filter=userType eq %27Guest%27",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "OnPremises": {
            "path": "/users?$filter=OnPremisesSyncEnabled eq true",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "DeltaUsers": {
            "path": "/users/delta",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All",
            "audience": ["https://graph.microsoft.com"]
        }
    },
    "Devices": {
        "devices": {
            "path": "/devices",
            "delegatedPermission": "Directory.Read.All",
            "applicationPermission": "Directory.Read.All",
            "audience": ["https://graph.microsoft.com"]
        }
    },
    "Teamwork": {
        "teamwork": {
            "path": "/teamwork",
            "delegatedPermission": "Teamwork.Read.All",
            "applicationPermission": "Teamwork.Read.All",
            "audience": ["https://graph.microsoft.com"]
        }
    },
    "Sharepoint": {
        "sharepointSettings": {
            "path": "/admin/sharepoint/settings",
            "delegatedPermission": "SharePointTenantSettings.Read.All",
            "applicationPermission": "SharePointTenantSettings.Read.All",
            "audience": ["https://graph.microsoft.com"]
        }
    },
    "Subscriptions": {
        "subscriptions": {
            "path": "/subscriptions",
            "delegatedPermission": "ManagedTenants.Read.All",
            "applicationPermission": "ManagedTenants.Read.All",
            "audience": ["https://graph.microsoft.com"]
        }
    },
    "UserActivities": {
        "activities": {
            "path": "/me/activities",
            "delegatedPermission": "UserActivity.ReadWrite.CreatedByApp",
            "applicationPermission": "UserActivity.ReadWrite.CreatedByApp",
            "audience": ["https://graph.microsoft.com"]
        }
    },
    "UserDrive": {
        "drive": {
            "path": "/me/drive",
            "delegatedPermission": "Files.Read",
            "applicationPermission": "Files.Read.All",
            "audience": ["https://graph.microsoft.com"]
        }
    },
    "UserMail": {
        "mail": {
            "path": "/me/messages",
            "delegatedPermission": "Mail.Read",
            "applicationPermission": "Mail.Read",
            "audience": ["https://graph.microsoft.com"]
        }
    },
    "AuditLogs": {
        "provisioning": {
            "path": "/auditLogs/provisioning",
            "delegatedPermission": "AuditLog.Read.All,Directory.Read.All",
            "applicationPermission": "AuditLog.Read.All,Directory.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "directoryLogs": {
            "path": "/auditLogs/directoryAudits",
            "delegatedPermission": "AuditLog.Read.All",
            "applicationPermission": "AuditLog.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "signIns": {
            "path": "/auditLogs/signIns",
            "delegatedPermission": "AuditLog.Read.All",
            "applicationPermission": "AuditLog.Read.All",
            "audience": ["https://graph.microsoft.com"]
        }
    },
    "RoleManagement": {
        "directoryRoleDefinitions": {
            "path": "/roleManagement/directory/roleDefinitions",
            "delegatedPermission": "RoleManagement.Read.All",
            "applicationPermission": "RoleManagement.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "directoryRoleAssignments": {
            "path": "/roleManagement/directory/roleAssignments",
            "delegatedPermission": "RoleManagement.Read.All",
            "applicationPermission": "RoleManagement.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "exchangeRoleDefinitions": {
            "path": "/roleManagement/exchange/roleDefinitions",
            "delegatedPermission": "RoleManagement.Read.All",
            "applicationPermission": "RoleManagement.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "exchangeRoleAssignments": {
            "path": "/roleManagement/exchange/roleAssignments",
            "delegatedPermission": "RoleManagement.Read.All",
            "applicationPermission": "RoleManagement.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "deviceManagementRoleDefinitions": {
            "path": "/roleManagement/deviceManagement/roleDefinitions",
            "delegatedPermission": "RoleManagement.Read.All",
            "applicationPermission": "RoleManagement.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "deviceManagementRoleAssignments": {
            "path": "/roleManagement/deviceManagement/roleAssignments",
            "delegatedPermission": "RoleManagement.Read.All",
            "applicationPermission": "RoleManagement.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "cloudPCRoleDefinitions": {
            "path": "/roleManagement/cloudPC/roleDefinitions",
            "delegatedPermission": "RoleManagement.Read.All",
            "applicationPermission": "RoleManagement.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "cloudPCRoleAssignments": {
            "path": "/roleManagement/cloudPC/roleAssignments",
            "delegatedPermission": "RoleManagement.Read.All",
            "applicationPermission": "RoleManagement.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "entitlementManagementRoleDefinitions": {
            "path": "/roleManagement/entitlementManagement/roleDefinitions",
            "delegatedPermission": "RoleManagement.Read.All",
            "applicationPermission": "RoleManagement.Read.All",
            "audience": ["https://graph.microsoft.com"]
        },
        "entitlementManagementRoleAssignments": {
            "path": "/roleManagement/entitlementManagement/roleAssignments",
            "delegatedPermission": "RoleManagement.Read.All",
            "applicationPermission": "RoleManagement.Read.All",
            "audience": ["https://graph.microsoft.com"]
        }
    },
    "Reports": {
        "userRegistrationDetails": {
            "path": "/reports/authenticationMethods/userRegistrationDetails",
            "delegatedPermission": "AuditLog.Read.All",
            "applicationPermission": "AuditLog.Read.All",
            "audience": ["https://graph.microsoft.com"]
        }
    }
}

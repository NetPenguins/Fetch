from flask import Flask, render_template, request, jsonify, redirect, url_for
import sqlite3
import jwt
import time
import requests
import json
from datetime import datetime, timedelta
import secrets


app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Change this to a random secret key

# Azure AD configuration
TENANT_ID = 'be9b3b2c-bc81-4990-a8a9-e620c6dda223'  # Replace with your actual tenant ID
TOKEN_ENDPOINT = f'https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token'
# DEFAULT_CLIENT_ID = '1b730954-1685-4b74-9bfd-dac224a7b894'
DEFAULT_CLIENT_ID = 'e894cfc2-f4be-4298-b710-914c9ccbfb1a'


GRAPH_ENDPOINTS = {
    "organization": "/organization",
    "domains": "/domains",
    "identity_apiConnectors": "/identity/apiConnectors",
    "identityProviders": "/identityProviders",
    "subscribedSkus": "/subscribedSkus",
    "directoryRoles": "/directoryRoles",
    "identity_userFlows": "/identity/userFlows",
    "identity_b2cUserFlows": "/identity/b2cUserFlows",
    "identity_userFlowAttributes": "/identity/userFlowAttributes",
    "identity_b2xUserFlows": "/identity/b2xUserFlows",
    "policies_identitySecurityDefaultsEnforcementPolicy": "/policies/identitySecurityDefaultsEnforcementPolicy",
    "policies_authorizationPolicy": "/policies/authorizationPolicy",
    "policies_featureRolloutPolicies": "/policies/featureRolloutPolicies",
    "policies_activityBasedTimeoutPolicies": "/policies/activityBasedTimeoutPolicies",
    "policies_homeRealmDiscoveryPolicies": "/policies/homeRealmDiscoveryPolicies",
    "policies_claimsMappingPolicies": "/policies/claimsMappingPolicies",
    "policies_tokenIssuancePolicies": "/policies/tokenIssuancePolicies",
    "policies_tokenLifetimePolicies": "/policies/tokenLifetimePolicies",
    "policies_authenticationMethodsPolicy_email": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/email",
    "policies_authenticationMethodsPolicy_fido2": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/fido2",
    "policies_authenticationMethodsPolicy_microsoftAuthenticator": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/microsoftAuthenticator",
    "policies_authenticationMethodsPolicy_sms": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/sms",
    "policies_authenticationMethodsPolicy_temporaryAccessPass": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/temporaryAccessPass",
    "policies_authenticationMethodsPolicy_softwareOath": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/softwareOath",
    "policies_authenticationMethodsPolicy_voice": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/voice",
    "policies_authenticationMethodsPolicy_x509Certificate": "/policies/authenticationMethodsPolicy/authenticationMethodConfigurations/x509Certificate",
    "policies_adminConsentRequestPolicy": "/policies/adminConsentRequestPolicy",
    "policies_permissionGrantPolicies": "/policies/permissionGrantPolicies",
    "policies_externalIdentitiesPolicy": "/policies/externalIdentitiesPolicy",
    "policies_crossTenantAccessPolicy": "/policies/crossTenantAccessPolicy",
    "policies_crossTenantAccessPolicy_default": "/policies/crossTenantAccessPolicy/default",
    "policies_crossTenantAccessPolicy_partners": "/policies/crossTenantAccessPolicy/partners",
    "identity_customAuthenticationExtensions": "/identity/customAuthenticationExtensions",
    "identity_conditionalAccess_policies": "/identity/conditionalAccess/policies",
    "identity_conditionalAccess_namedLocations": "/identity/conditionalAccess/namedLocations",
    "identityGovernance_entitlementManagement_accessPackages": "/identityGovernance/entitlementManagement/accessPackages",
    "identityGovernance_accessReviews_definitions": "/identityGovernance/accessReviews/definitions",
    "identityGovernance_termsOfUse_agreements": "/identityGovernance/termsOfUse/agreements",
    "identityGovernance_entitlementManagement_connectedOrganizations": "/identityGovernance/entitlementManagement/connectedOrganizations",
    "identityGovernance_entitlementManagement_settings": "/identityGovernance/entitlementManagement/settings",
    "administrativeUnits": "/AdministrativeUnits",
    "privilegedAccess_aadroles_resources": "/privilegedAccess/aadroles/resources",
    "privilegedAccess_azureResources_resources": "/privilegedAccess/azureResources/resources",
    "onPremisesPublishingProfiles_provisioning": "/onPremisesPublishingProfiles/provisioning",
    "onPremisesPublishingProfiles_provisioning_publishedResources": "/onPremisesPublishingProfiles/provisioning/publishedResources",
    "onPremisesPublishingProfiles_provisioning_agentGroups": "/onPremisesPublishingProfiles/provisioning/agentGroups",
    "onPremisesPublishingProfiles_provisioning_agents": "/onPremisesPublishingProfiles/provisioning/agents",
    "onPremisesPublishingProfiles_applicationProxy_connectors": "/onPremisesPublishingProfiles/applicationProxy/connectors",
    "onPremisesPublishingProfiles_applicationProxy_connectorGroups": "/onPremisesPublishingProfiles/applicationProxy/connectorGroups",
    "groups": "/groups",
    "groupSettings": "/groupSettings",
    "applications": "/applications",
    "servicePrincipals": "/servicePrincipals",
    "users": "/users",
    "devices": "/devices",
    "teamwork": "/teamwork",
    "admin_sharepoint_settings": "/admin/sharepoint/settings",
    "roleManagement_directory_roleDefinitions": "/roleManagement/directory/roleDefinitions",
    "roleManagement_directory_roleAssignments": "/roleManagement/directory/roleAssignments",
    "roleManagement_exchange_roleDefinitions": "/roleManagement/exchange/roleDefinitions",
    "roleManagement_exchange_roleAssignments": "/roleManagement/exchange/roleAssignments",
    "roleManagement_deviceManagement_roleDefinitions": "/roleManagement/deviceManagement/roleDefinitions",
    "roleManagement_deviceManagement_roleAssignments": "/roleManagement/deviceManagement/roleAssignments",
    "roleManagement_cloudPC_roleDefinitions": "/roleManagement/cloudPC/roleDefinitions",
    "roleManagement_cloudPC_roleAssignments": "/roleManagement/cloudPC/roleAssignments",
    "roleManagement_entitlementManagement_roleDefinitions": "/roleManagement/entitlementManagement/roleDefinitions",
    "roleManagement_entitlementManagement_roleAssignments": "/roleManagement/entitlementManagement/roleAssignments",
    "reports_authenticationMethods_usersRegisteredByFeature": "/reports/authenticationMethods/microsoft.graph.usersRegisteredByFeature()"
}



def get_db_connection():
    conn = sqlite3.connect('azure_token_manager.db')
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    conn.execute('''CREATE TABLE IF NOT EXISTS tenant_details
                    (domain TEXT PRIMARY KEY, details TEXT)''')
    conn.execute('''CREATE TABLE IF NOT EXISTS access_tokens
                    (id INTEGER PRIMARY KEY AUTOINCREMENT,
                     token TEXT,
                     oid TEXT,
                     audience TEXT,
                     expiration INTEGER,
                     email TEXT,
                     scp TEXT,
                     token_type TEXT)''')
    conn.execute('''CREATE TABLE IF NOT EXISTS refresh_tokens
                    (id INTEGER PRIMARY KEY AUTOINCREMENT,
                     token TEXT UNIQUE)''')

    # Create tables for storing Graph API results
    for endpoint in list(GRAPH_ENDPOINTS.keys()) + ['me']:
        conn.execute(f'''CREATE TABLE IF NOT EXISTS {endpoint}_results
                        (id INTEGER PRIMARY KEY AUTOINCREMENT,
                         data TEXT,
                         timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')

    conn.commit()
    conn.close()

init_db()  # Call this function to initialize the database


def determine_token_type(token):
    if token.startswith("eyJ"):
        return 'Access Token'
    elif token.startswith("0."):
        return 'Refresh Token'
    else:
        return 'Unknown Token Type'


@app.route('/')
def index():
    conn = get_db_connection()
    current_time = int(time.time())
    access_tokens = conn.execute('SELECT *, (expiration - ?) AS time_left FROM access_tokens',
                                 (current_time,)).fetchall()
    refresh_tokens = conn.execute('SELECT * FROM refresh_tokens').fetchall()
    conn.close()
    return render_template('index.html', access_tokens=access_tokens, refresh_tokens=refresh_tokens,
                           current_time=datetime.utcnow(), datetime=datetime, timedelta=timedelta)


@app.route('/graph_enumerator')
def graph_enumerator():
    conn = get_db_connection()
    access_tokens = conn.execute('SELECT id, oid, audience FROM access_tokens').fetchall()
    conn.close()
    current_time = datetime.utcnow()  # Get the current time
    return render_template('graph_enumerator.html',
                           access_tokens=access_tokens,
                           graph_endpoints=GRAPH_ENDPOINTS,
                           current_time=current_time)  # Pass current_time to the template

@app.route('/enumerate_graph', methods=['POST'])
def enumerate_graph():
    token_id = request.form.get('token_id')
    endpoints = request.form.getlist('endpoints')

    conn = get_db_connection()
    token = conn.execute('SELECT token FROM access_tokens WHERE id = ?', (token_id,)).fetchone()
    conn.close()

    if not endpoints:
        endpoints = ['users', 'groups']

    if not token:
        return jsonify({"error": "Token not found"}), 404

    access_token = token['token']

    results = {}

    for endpoint in endpoints:
        if endpoint in GRAPH_ENDPOINTS:
            url = f"https://graph.microsoft.com/v1.0{GRAPH_ENDPOINTS[endpoint]}"
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            try:
                response = requests.get(url, headers=headers)
                response.raise_for_status()
                results[endpoint] = response.json()
                store_graph_results(endpoint, results[endpoint])
            except requests.exceptions.RequestException as e:
                results[endpoint] = {
                    "error": f"Failed to fetch data: {str(e)}",
                    "status_code": e.response.status_code if e.response else None,
                    "response_text": e.response.text if e.response else None
                }

    return jsonify(results)

@app.route('/get_me', methods=['POST'])
def get_me():
    token_id = request.form.get('token_id')

    conn = get_db_connection()
    token = conn.execute('SELECT token FROM access_tokens WHERE id = ?', (token_id,)).fetchone()
    conn.close()

    if not token:
        return jsonify({"error": "Token not found"}), 404

    access_token = token['token']
    url = "https://graph.microsoft.com/v1.0/me"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        results = response.json()
        try:
            store_graph_results('me', results)
        except Exception as e:
            print(f"Failed to store 'me' results: {str(e)}")
        return jsonify(results)
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to fetch data: {str(e)}"}), response.status_code


@app.route('/search_dynamic_groups', methods=['POST'])
def search_dynamic_groups():
    token_id = request.form.get('token_id')

    conn = get_db_connection()
    token = conn.execute('SELECT token FROM access_tokens WHERE id = ?', (token_id,)).fetchone()
    conn.close()

    if not token:
        return jsonify({"error": "Token not found"}), 404

    access_token = token['token']
    url = "https://graph.microsoft.com/v1.0/groups?$filter=groupTypes/any(s:s eq 'DynamicMembership')"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        results = response.json()
        store_graph_results('dynamic_groups', results)
        return jsonify(results)
    else:
        return jsonify({"error": f"Failed to fetch data: {response.status_code}"}), response.status_code


def store_graph_results(endpoint, data):
    conn = get_db_connection()
    try:
        conn.execute(f'INSERT INTO {endpoint}_results (data) VALUES (?)', (json.dumps(data),))
        conn.commit()
    except sqlite3.OperationalError as e:
        if "no such table" in str(e):
            # If the table doesn't exist, create it and try inserting again
            conn.execute(f'''CREATE TABLE IF NOT EXISTS {endpoint}_results
                            (id INTEGER PRIMARY KEY AUTOINCREMENT,
                             data TEXT,
                             timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')
            conn.execute(f'INSERT INTO {endpoint}_results (data) VALUES (?)', (json.dumps(data),))
            conn.commit()
        else:
            # If it's a different error, re-raise it
            raise
    finally:
        conn.close()


@app.route('/insert_token', methods=['POST'])
def insert_token():
    token = request.form['token']
    token_type = determine_token_type(token)

    try:
        if token_type == 'Access Token':
            try:
                decoded = jwt.decode(token, options={"verify_signature": False})
                print(f"Decoded token: {json.dumps({k: v for k, v in decoded.items() if k not in ['exp', 'iat']}, indent=2)}")

                expiration = int(decoded.get('exp', 0))
                current_time = int(time.time())

                if expiration < current_time + 300:
                    return jsonify({"error": "Token has expired or will expire in less than 5 minutes"}), 400

                oid = decoded.get('oid', 'Unknown')
                audience = decoded.get('aud', 'Unknown')
                email = decoded.get('unique_name', 'Unknown')
                scp = decoded.get('scp', 'Unknown')

                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute('SELECT * FROM access_tokens WHERE token = ?', (token,))
                existing_token = cursor.fetchone()

                if existing_token:
                    conn.close()
                    return jsonify({"error": "Token already exists in the database"}), 400

                conn.execute(
                    'INSERT INTO access_tokens (token, oid, audience, expiration, email, scp, token_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    (token, oid, audience, expiration, email, scp, token_type))
                conn.commit()
                conn.close()
            except jwt.exceptions.DecodeError:
                return jsonify({"error": "Invalid access token format"}), 400
        elif token_type == 'Refresh Token':
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM refresh_tokens WHERE token = ?', (token,))
            existing_token = cursor.fetchone()

            if existing_token:
                conn.close()
                return jsonify({"error": "Refresh token already exists in the database"}), 400

            conn.execute('INSERT INTO refresh_tokens (token) VALUES (?)', (token,))
            conn.commit()
            conn.close()
        else:
            return jsonify({"error": "Unknown token type"}), 400

        return jsonify({"success": True, "message": f"{token_type} inserted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/request_auth')
def request_auth():
    client_id = request.args.get('client_id', DEFAULT_CLIENT_ID)
    tenant_id = request.args.get('tenant_id', 'common')
    redirect_uri = url_for('auth_callback', _external=True)
    nonce = secrets.token_urlsafe(16)
    state = secrets.token_urlsafe(16)

    auth_url = (
        f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/authorize?"
        f"client_id={client_id}"
        f"&response_type=id_token"
        f"&redirect_uri={redirect_uri}"
        f"&scope=openid"
        f"&response_mode=fragment"
        f"&state={state}"
        f"&nonce={nonce}"
    )

    print(f"Auth URL: {auth_url}")  # Log the URL
    return jsonify({"auth_url": auth_url})


@app.route('/auth_callback')
def auth_callback():
    # This route will handle the callback from Microsoft
    # You'll need to implement logic to handle the received ID token
    return "Authentication callback received. Please check the URL fragment for the ID token."



@app.route('/request_token_secret', methods=['POST'])
def request_token_secret():
    client_id = request.form['client_id']
    client_secret = request.form['client_secret']
    scope = request.form['scope']

    data = {
        'client_id': client_id,
        'scope': scope,
        'client_secret': client_secret,
        'grant_type': 'client_credentials'
    }

    response = requests.post(TOKEN_ENDPOINT, data=data)

    if response.status_code == 200:
        result = response.json()
        token = result['access_token']
        return insert_token(token)
    else:
        return jsonify({"error": f"Error: {response.status_code} - {response.text}"}), 400


@app.route('/generate_from_refresh', methods=['POST'])
def generate_from_refresh():
    client_id = request.form['client_id']
    refresh_token = request.form['refresh_token']

    url = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
    data = {
        'client_id': client_id,
        'scope': 'https://graph.microsoft.com/offline_access',
        'grant_type': 'refresh_token',
        'refresh_token': refresh_token
    }

    response = requests.post(url, data=data)

    if response.status_code == 200:
        token_data = response.json()
        new_access_token = token_data['access_token']
        new_refresh_token = token_data.get('refresh_token', refresh_token)

        # Insert the new access token
        insert_token(new_access_token)

        # Insert the new refresh token if it's different from the old one
        if new_refresh_token != refresh_token:
            insert_token(new_refresh_token)

        return jsonify({
            "success": True,
            "message": "New tokens generated and inserted successfully",
            "access_token": new_access_token,
            "refresh_token": new_refresh_token
        }), 200
    else:
        return jsonify({"error": "Failed to generate new access token"}), 400


@app.route('/delete_token/<int:token_id>', methods=['POST'])
def delete_token(token_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # First, check if it's an access token
    cursor.execute('DELETE FROM access_tokens WHERE id = ?', (token_id,))
    if cursor.rowcount == 0:
        # If not found in access_tokens, check refresh_tokens
        cursor.execute('DELETE FROM refresh_tokens WHERE id = ?', (token_id,))

    conn.commit()
    conn.close()

    if cursor.rowcount > 0:
        return jsonify({"success": True, "message": "Token deleted successfully"}), 200
    else:
        return jsonify({"error": "Token not found"}), 404


if __name__ == '__main__':
    app.run(debug=True, ssl_context='adhoc', host='127.0.0.1', port=5000)
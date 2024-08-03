from flask import render_template, request, jsonify, redirect, url_for
from app import app
from models import get_db_connection
from utils import determine_token_type, insert_token, store_graph_results, generate_new_tokens, \
    request_token_with_secret, request_token_with_password, aware_utcnow, aware_utcfromtimestamp, naive_utcnow, \
    naive_utcfromtimestamp, get_all_pages
from graph_endpoints import GRAPH_ENDPOINTS
from microsoft_service_principals import microsoft_service_principals
from config import Config
import requests
import json
import jwt
from datetime import datetime, timedelta
import time


@app.route('/')
def index():
    conn = get_db_connection()
    current_time = int(time.time())
    access_tokens = conn.execute('SELECT *, (expiration - ?) AS time_left FROM access_tokens',
                                 (current_time,)).fetchall()
    refresh_tokens = conn.execute('SELECT * FROM refresh_tokens').fetchall()
    conn.close()
    return render_template('index.html', access_tokens=access_tokens, refresh_tokens=refresh_tokens,
                           current_time=aware_utcnow(), datetime=datetime, timedelta=timedelta)


@app.route('/request_token_password', methods=['POST'])
def request_token_password():
    client_id = request.form.get('client_id')
    username = request.form.get('username')
    password = request.form.get('password')
    tenant = request.form.get('tenant')
    scope = request.form.get('scope')

    if not tenant:
        return jsonify({
            "success": False,
            "error": "Tenant ID or Domain is required"
        }), 400

    # Construct the token endpoint URL
    token_url = f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token"

    # Prepare the token request
    token_data = {
        'grant_type': 'password',
        'client_id': client_id,
        'username': username,
        'password': password,
        'scope': scope
    }

    try:
        response = requests.post(token_url, data=token_data)
        if response.status_code != 200:
            error_description = response.json().get('error_description', 'Unknown error')
            return jsonify({
                "success": False,
                "error": f"Token request failed: {response.status_code} - {error_description}"
            }), 400

        token_response = response.json()
        return jsonify({
            "success": True,
            "access_token": token_response.get('access_token'),
            "refresh_token": token_response.get('refresh_token')
        })
    except requests.exceptions.RequestException as e:
        return jsonify({
            "success": False,
            "error": f"Request failed: {str(e)}"
        }), 400


@app.route('/graph_enumerator')
def graph_enumerator():
    conn = get_db_connection()
    access_tokens = conn.execute('SELECT id, oid, audience, email FROM access_tokens').fetchall()
    conn.close()
    current_time = aware_utcnow()
    return render_template('graph_enumerator.html',
                           access_tokens=access_tokens,
                           graph_endpoints=GRAPH_ENDPOINTS,
                           current_time=current_time)


@app.route('/enumerate_graph', methods=['POST'])
def enumerate_graph():
    token_id = request.form.get('token_id')
    endpoints = request.form.getlist('endpoints')

    conn = get_db_connection()
    token = conn.execute('SELECT token FROM access_tokens WHERE id = ?', (token_id,)).fetchone()
    conn.close()

    if not token:
        return jsonify({"error": "Token not found"}), 404

    access_token = token['token']
    results = {}

    def fetch_endpoint(endpoint_path):
        url = f"https://graph.microsoft.com/v1.0{endpoint_path}"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {
                "error": f"Failed to fetch data: {str(e)}",
                "status_code": e.response.status_code if e.response else None,
                "response_text": e.response.text if e.response else None
            }

    def get_nested_endpoint(data, keys):
        for key in keys:
            if key in data:
                data = data[key]
            else:
                return None
        return data

    for endpoint in endpoints:
        keys = endpoint.split('.')
        endpoint_data = get_nested_endpoint(GRAPH_ENDPOINTS, keys)
        if isinstance(endpoint_data, dict) and 'path' in endpoint_data:
            results[endpoint] = fetch_endpoint(endpoint_data['path'])

    return jsonify(results)


@app.route('/insert_token', methods=['POST'])
def insert_token_route():
    token = request.form['token']
    return insert_token(token)


@app.route('/request_token_secret', methods=['POST'])
def request_token_secret():
    tenant = request.form.get('tenant')
    client_id = request.form.get('client_id')
    scope = request.form.get('scope')
    client_secret = request.form.get('client_secret')

    result = request_token_with_secret(client_id, client_secret, scope, tenant)
    return jsonify(result), 200 if result.get('success') else 400

@app.route('/generate_from_refresh', methods=['POST'])
def generate_from_refresh():
    client_id = request.form['client_id']
    refresh_token = request.form['refresh_token']
    result = generate_new_tokens(client_id, refresh_token)
    return jsonify(result), 200 if result.get('success') else 400


@app.route('/refresh_token', methods=['POST'])
def refresh_token():
    client_id = request.form.get('client_id')
    refresh_token = request.form.get('refresh_token')

    # Azure AD token endpoint
    token_url = f"https://login.microsoftonline.com/{Config.TENANT_ID}/oauth2/v2.0/token"

    # Prepare the token request
    token_data = {
        'grant_type': 'refresh_token',
        'client_id': client_id,
        'refresh_token': refresh_token,
        'scope': 'https://graph.microsoft.com/.default'  # Adjust scope as needed
    }

    # Make the token request
    response = requests.post(token_url, data=token_data)

    if response.status_code == 200:
        token_response = response.json()
        new_access_token = token_response.get('access_token')
        new_refresh_token = token_response.get('refresh_token')

        # Store the new tokens in the database
        conn = get_db_connection()
        if new_access_token:
            conn.execute('INSERT INTO access_tokens (token) VALUES (?)', (new_access_token,))
        if new_refresh_token:
            conn.execute('INSERT INTO refresh_tokens (token) VALUES (?)', (new_refresh_token,))
        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Tokens refreshed successfully",
            "access_token": new_access_token,
            "refresh_token": new_refresh_token
        })
    else:
        return jsonify({
            "success": False,
            "error": f"Failed to refresh token: {response.text}"
        }), 400


@app.route('/delete_token/<int:token_id>', methods=['POST'])
def delete_token(token_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # First, check which table the token is in
    cursor.execute('SELECT 1 FROM access_tokens WHERE id = ?', (token_id,))
    is_access_token = cursor.fetchone() is not None

    if is_access_token:
        cursor.execute('DELETE FROM access_tokens WHERE id = ?', (token_id,))
        table_name = 'access_tokens'
    else:
        cursor.execute('DELETE FROM refresh_tokens WHERE id = ?', (token_id,))
        table_name = 'refresh_tokens'

    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()

    if deleted:
        return '', 204  # No Content
    else:
        return '', 404  # Not Found


@app.route('/get_refresh_tokens')
def get_refresh_tokens():
    try:
        conn = get_db_connection()
        refresh_tokens = conn.execute('SELECT id, token FROM refresh_tokens').fetchall()
        conn.close()
        return jsonify({
            "success": True,
            "refresh_tokens": [{"id": token['id'], "token": token['token'][:10] + '...'} for token in refresh_tokens]
        })
    except Exception as e:
        print(f"Error in get_refresh_tokens: {str(e)}")  # Log the error
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/token_details/<int:token_id>')
def token_details(token_id):
    try:
        conn = get_db_connection()
        token = conn.execute('SELECT token FROM access_tokens WHERE id = ?', (token_id,)).fetchone()
        conn.close()

        if not token:
            return jsonify({"success": False, "error": "Token not found"}), 404

        decoded_token = jwt.decode(token['token'], options={"verify_signature": False})

        highlighted_claims = {
            'exp': decoded_token.get('exp'),
            'iat': decoded_token.get('iat'),
            'aud': decoded_token.get('aud'),
            'iss': decoded_token.get('iss'),
            'sub': decoded_token.get('sub')
        }

        return jsonify({
            "success": True,
            "highlighted_claims": highlighted_claims,
            "full_decoded": decoded_token
        })

    except jwt.exceptions.DecodeError as e:
        return jsonify({"success": False, "error": f"Failed to decode token: {str(e)}"}), 400
    except Exception as e:
        print(f"Error in token_details: {str(e)}")  # Log the error
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/get_access_token/<int:token_id>', methods=['GET'])
def get_access_token(token_id):
    conn = get_db_connection()
    token = conn.execute('SELECT token FROM access_tokens WHERE id = ?', (token_id,)).fetchone()
    conn.close()
    if token:
        return jsonify({"success": True, "access_token": token['token']})
    else:
        return jsonify({"success": False, "error": "Token not found"}), 404


@app.route('/get_token_permissions/<int:token_id>')
def get_token_permissions(token_id):
    conn = get_db_connection()
    token = conn.execute('SELECT token FROM access_tokens WHERE id = ?', (token_id,)).fetchone()
    conn.close()

    if token:
        try:
            decoded_token = jwt.decode(token['token'], options={"verify_signature": False})
            scp = decoded_token.get('scp', '').split()
            roles = decoded_token.get('roles', [])
            permissions = list(set(scp + roles))
            return jsonify({"success": True, "permissions": permissions})
        except jwt.DecodeError:
            return jsonify({"success": False, "error": "Invalid token"}), 400
    else:
        return jsonify({"success": False, "error": "Token not found"}), 404


@app.route('/db_analyzer')
def db_analyzer():
    conn = get_db_connection()
    access_tokens = conn.execute('SELECT id, oid, audience, email FROM access_tokens').fetchall()
    conn.close()
    current_time = aware_utcnow()
    return render_template('db_analyzer.html',
                           access_tokens=access_tokens,
                           current_time=current_time)


@app.route('/graph_action/<action>/<int:token_id>')
def graph_action(action, token_id):
    conn = get_db_connection()
    token = conn.execute('SELECT token FROM access_tokens WHERE id = ?', (token_id,)).fetchone()
    conn.close()

    if not token:
        return jsonify({"error": "Token not found"}), 404

    access_token = token['token']
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    base_url = "https://graph.microsoft.com/v1.0"

    try:
        if action == 'get_privileged_roles':
            privileged_roles = [
                "Global Administrator", "Global Reader", "Application Administrator",
                "Application Developer", "Authentication Administrator",
                "Authentication Extensibility Administrator", "B2C IEF Keyset Administrator",
                "Cloud Application Administrator", "Cloud Device Administrator",
                "Conditional Access Administrator", "Directory Synchronization Accounts",
                "Directory Writers", "Domain Name Administrator",
                "External Identity Provider Administrator", "Helpdesk Administrator",
                "Hybrid Identity Administrator", "Intune Administrator",
                "Lifecycle Workflows Administrator", "Partner Tier1 Support",
                "Partner Tier2 Support", "Password Administrator", "Security Administrator",
                "Security Operator", "Security Reader", "User Administrator"
            ]

            roles_url = f"{base_url}/directoryRoles"
            all_roles = get_all_pages(roles_url, headers)

            privileged_role_members = {}

            for role in all_roles:
                if role.get('displayName') in privileged_roles:
                    role_id = role['id']
                    role_name = role['displayName']

                    members_url = f"{base_url}/directoryRoles/{role_id}/members"
                    members = get_all_pages(members_url, headers)
                    privileged_role_members[role_name] = members

            if not privileged_role_members:
                return jsonify({"error": "No privileged roles found or error fetching roles"}), 404

            return jsonify(privileged_role_members)

        elif action == 'get_custom_roles':
            roles_url = f"{base_url}/roleManagement/directory/roleDefinitions"
            all_roles = get_all_pages(roles_url, headers)
            custom_roles = [role for role in all_roles if not role.get('isBuiltIn', True)]
            return jsonify({"value": custom_roles})

        elif action == 'get_synced_objects':
            users_url = f"{base_url}/users?$select=id,displayName,userPrincipalName,onPremisesSecurityIdentifier"
            all_users = get_all_pages(users_url, headers)

            groups_url = f"{base_url}/groups?$select=id,displayName,mailNickname,onPremisesSecurityIdentifier"
            all_groups = get_all_pages(groups_url, headers)

            synced_users = [user for user in all_users if user.get('onPremisesSecurityIdentifier')]
            synced_groups = [group for group in all_groups if group.get('onPremisesSecurityIdentifier')]

            return jsonify({
                "synced_users": synced_users,
                "synced_groups": synced_groups
            })

        elif action == 'get_owned_devices':
            devices_url = f"{base_url}/me/ownedDevices"
            owned_devices = get_all_pages(devices_url, headers)
            return jsonify({"value": owned_devices})

        elif action == 'get_owned_objects':
            objects_url = f"{base_url}/me/ownedObjects"
            owned_objects = get_all_pages(objects_url, headers)
            return jsonify({"value": owned_objects})

        elif action == 'get_created_objects':
            objects_url = f"{base_url}/me/createdObjects"
            created_objects = get_all_pages(objects_url, headers)
            return jsonify({"value": created_objects})

        elif action == 'get_m365_groups':
            groups_url = f"{base_url}/groups?$filter=groupTypes/any(c:c eq 'Unified')"
            m365_groups = get_all_pages(groups_url, headers)
            return jsonify({"value": m365_groups})

        elif action == 'get_security_groups':
            groups_url = f"{base_url}/groups?$filter=securityEnabled eq true and mailEnabled eq false"
            security_groups = get_all_pages(groups_url, headers)
            return jsonify({"value": security_groups})

        elif action == 'get_mail_enabled_security_groups':
            groups_url = f"{base_url}/groups?$filter=mailEnabled eq true and securityEnabled eq true"
            mail_enabled_security_groups = get_all_pages(groups_url, headers)
            return jsonify({"value": mail_enabled_security_groups})

        elif action == 'get_distribution_groups':
            groups_url = f"{base_url}/groups?$filter=mailEnabled eq true and securityEnabled eq false"
            distribution_groups = get_all_pages(groups_url, headers)
            return jsonify({"value": distribution_groups})

        elif action == 'get_guest_users':
            users_url = f"{base_url}/users?$filter=userType eq 'Guest'"
            guest_users = get_all_pages(users_url, headers)
            return jsonify({"value": guest_users})

        elif action == 'get_app_role_assignments':
            users = get_all_pages(f"{base_url}/users", headers)
            groups = get_all_pages(f"{base_url}/groups", headers)
            service_principals = get_all_pages(f"{base_url}/servicePrincipals", headers)

            all_app_role_assignments = []
            target_resources = ["Microsoft Graph", "Command"]

            for user in users:
                user_assignments = get_all_pages(f"{base_url}/users/{user['id']}/appRoleAssignments", headers)
                all_app_role_assignments.extend(user_assignments)

            for group in groups:
                group_assignments = get_all_pages(f"{base_url}/groups/{group['id']}/appRoleAssignments", headers)
                all_app_role_assignments.extend(group_assignments)

            for sp in service_principals:
                sp_assignments = get_all_pages(f"{base_url}/servicePrincipals/{sp['id']}/appRoleAssignments", headers)
                all_app_role_assignments.extend(sp_assignments)

            graph_assignments = [
                assignment for assignment in all_app_role_assignments
                if assignment.get('resourceDisplayName', '').lower() in [r.lower() for r in target_resources]
            ]

            return jsonify({
                "all_assignments": all_app_role_assignments,
                "graph_assignments": graph_assignments
            })

        elif action == 'get_mismatched_service_principals':
            service_principals_url = f"{base_url}/servicePrincipals?$select=displayName,appId,appOwnerOrganizationId"
            service_principals = get_all_pages(service_principals_url, headers)
            mismatched_results = []
            total_microsoft_sps = 0

            microsoft_org_ids = ['f8cdef31-a31e-4b4a-93e4-5f571e91255a', '47df5bb7-e6bc-4256-afb0-dd8c8e3c1ce8']

            for sp in service_principals:
                display_name = sp.get('displayName')
                app_id = sp.get('appId')
                app_owner_org_id = sp.get('appOwnerOrganizationId')
                if display_name in microsoft_service_principals:
                    total_microsoft_sps += 1
                    expected_app_ids = microsoft_service_principals[display_name]

                    # Ensure expected_app_ids is always a list

                    if not isinstance(expected_app_ids, list):
                        expected_app_ids = [expected_app_ids]

                    is_microsoft_sp = app_owner_org_id in microsoft_org_ids
                    app_id_match = app_id in expected_app_ids
                    unexpected_org = not is_microsoft_sp

                    if not app_id_match or unexpected_org:
                        mismatched_results.append({
                            "displayName": display_name,
                            "appId": app_id,
                            "expectedAppIds": expected_app_ids,
                            "appOwnerOrganizationId": app_owner_org_id,
                            "isMicrosoftServicePrincipal": is_microsoft_sp,
                            "unexpectedOrganization": unexpected_org
                        })

            return jsonify({
                "totalServicePrincipals": len(service_principals),
                "totalMicrosoftServicePrincipals": total_microsoft_sps,
                "mismatchedServicePrincipals": mismatched_results
            })




        # Add other actions here...
        elif action == 'get_mail_enabled_security_groups':
            groups_url = f"{base_url}/groups?$filter=mailEnabled eq true and securityEnabled eq true"
            mail_enabled_security_groups = get_all_pages(groups_url, headers)
            return jsonify({"value": mail_enabled_security_groups})

        elif action == 'get_user_consent_requests':
            consent_requests_url = f"{base_url}/identityGovernance/appConsent/appConsentRequests"
            app_consent_requests = get_all_pages(consent_requests_url, headers)

            user_consent_requests = []
            for app_request in app_consent_requests:
                user_requests_url = f"{base_url}/identityGovernance/appConsent/appConsentRequests/{app_request['id']}/userConsentRequests"
                user_requests = get_all_pages(user_requests_url, headers)
                user_consent_requests.extend(user_requests)

            return jsonify({"value": user_consent_requests})


        else:
            return jsonify({"error": "Invalid action"}), 400

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@app.route('/device_code_auth', methods=['POST'])
def device_code_auth():
    client_id = request.form.get('client_id')
    tenant = request.form.get('tenant', 'common')
    scope = request.form.get('scope', 'https://graph.microsoft.com/User.Read offline_access')

    # Step 1: Request device code
    device_code_url = f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/devicecode"
    device_code_response = requests.post(device_code_url, data={
        "client_id": client_id,
        "scope": scope
    })

    if device_code_response.status_code != 200:
        return jsonify({"error": "Failed to get device code"}), 400

    device_code_data = device_code_response.json()

    # Return the device code data to the client
    return jsonify({
        "user_code": device_code_data["user_code"],
        "verification_uri": device_code_data["verification_uri"],
        "message": device_code_data["message"],
        "device_code": device_code_data["device_code"],
        "interval": device_code_data["interval"]
    })


@app.route('/poll_for_token', methods=['POST'])
def poll_for_token():
    client_id = request.form.get('client_id')
    device_code = request.form.get('device_code')
    tenant = request.form.get('tenant', 'common')

    token_url = f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token"

    token_response = requests.post(token_url, data={
        "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
        "client_id": client_id,
        "device_code": device_code
    })

    if token_response.status_code == 200:
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        return jsonify({"status": "success", "access_token": access_token})
    else:
        error = token_response.json().get("error")
        if error == "authorization_pending":
            return jsonify({"status": "pending"})
        else:
            return jsonify({"status": "error", "error": error})


@app.route('/current_time')
def get_current_time():
    return jsonify({'current_time': aware_utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')})


@app.template_filter('format_datetime')
def format_datetime(value, format='%Y-%m-%d %H:%M:%S UTC'):
    if value is None:
        return ""
    if isinstance(value, int):
        value = aware_utcfromtimestamp(value)
    return value.strftime(format)
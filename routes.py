import time
from datetime import datetime, timedelta, timezone

import jwt
from flask import render_template
import json


from app import app
from config import Config
from graph_endpoints import GRAPH_ENDPOINTS
from object_endpoints import OBJECT_ENDPOINTS
from microsoft_service_principals import microsoft_service_principals
from models import get_db_connection
from utils import determine_token_type, insert_token, generate_new_tokens, \
    aware_utcnow, aware_utcfromtimestamp, get_all_pages


@app.route('/')
def index():
    conn = get_db_connection()
    current_time = int(time.time())
    tokens = conn.execute('''
    SELECT *, (expiration - ?) AS time_left 
    FROM tokens
    ORDER BY CASE WHEN token_type = 'access_token' THEN 0 ELSE 1 END, expiration DESC
    ''', (current_time,)).fetchall()
    conn.close()

    token_list = []
    for token in tokens:
        token_dict = dict(token)
        if token_dict['expiration']:
            token_dict['expiration'] = datetime.fromtimestamp(token_dict['expiration'])
        token_dict['user'] = token_dict.get('email') or token_dict.get('user')
        token_list.append(token_dict)

    return render_template('index.html',
                           tokens=token_list,
                           current_time=datetime.utcnow(),
                           timedelta=timedelta,
                           format_datetime=lambda dt: dt.strftime('%Y-%m-%d %H:%M:%S') if dt else 'N/A')


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


@app.route('/guides')
def guides():
    current_time = aware_utcnow()
    return render_template('guides.html', current_time=current_time)


@app.route('/graph_enumerator')
def graph_enumerator():
    conn = get_db_connection()
    access_tokens = conn.execute(
        'SELECT id, oid, audience, email FROM tokens WHERE token_type = "access_token"').fetchall()
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
    token = conn.execute('SELECT token FROM tokens WHERE id = ? AND token_type = "access_token"',
                         (token_id,)).fetchone()
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
            json_response = response.json()
            if not json_response or (
                    isinstance(json_response, dict) and 'value' in json_response and not json_response['value']):
                return {"warning": "Empty result set", "raw_response": json_response}
            return json_response
        except requests.exceptions.RequestException as e:
            error_message = str(e)
            status_code = e.response.status_code if e.response else None
            response_text = e.response.text if e.response else None
            return {
                "error": f"Failed to fetch data: {error_message}",
                "status_code": status_code,
                "response_text": response_text
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
    # Determine the token type
    token_type = determine_token_type(token)
    # Get additional information if available
    tenant_id = request.form.get('tenant_id')
    user = request.form.get('user')
    source = request.form.get('source', 'Manual insertion')

    # Call the insert_token function with all necessary arguments
    result = insert_token(token, token_type, tenant_id, user, source)

    if result.get('success'):
        return jsonify(result), 200
    else:
        return jsonify(result), 400


from flask import request, jsonify
import requests


@app.route('/request_token_secret', methods=['POST'])
def request_token_secret():
    tenant = request.form.get('tenant')
    client_id = request.form.get('client_id')
    client_secret = request.form.get('client_secret')
    scope = request.form.get('scope', 'https://graph.microsoft.com/.default')

    if not all([tenant, client_id, client_secret]):
        return jsonify({"success": False, "error": "Missing required parameters"}), 400

    token_url = f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token"

    data = {
        'grant_type': 'client_credentials',
        'client_id': client_id,
        'client_secret': client_secret,
        'scope': scope
    }

    try:
        response = requests.post(token_url, data=data)
        response.raise_for_status()
        token_data = response.json()

        return jsonify({
            "success": True,
            "access_token": token_data['access_token'],
            "token_type": token_data['token_type'],
            "expires_in": token_data['expires_in']
        })
    except requests.exceptions.RequestException as e:
        app.logger.error(f"Error requesting token: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 400


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

    # Delete the token from the tokens table
    cursor.execute('DELETE FROM tokens WHERE id = ?', (token_id,))
    deleted = cursor.rowcount > 0

    conn.commit()
    conn.close()

    if deleted:
        return jsonify({"success": True, "message": "Token deleted successfully"}), 200
    else:
        return jsonify({"success": False, "error": "Token not found"}), 404


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
        token = conn.execute('SELECT token, token_type, email, user FROM tokens WHERE id = ?', (token_id,)).fetchone()
        conn.close()

        if not token:
            return jsonify({"success": False, "error": "Token not found"}), 404

        decoded_token = jwt.decode(token['token'], options={"verify_signature": False})

        permissions = decoded_token.get('scp', '').split() + decoded_token.get('roles', [])

        highlighted_claims = {
            "aud": decoded_token.get('aud'),
            "iss": decoded_token.get('iss'),
            "iat": decoded_token.get('iat'),
            "nbf": decoded_token.get('nbf'),
            "exp": decoded_token.get('exp'),
            "aio": decoded_token.get('aio'),
            "azp": decoded_token.get('azp'),
            "azpacr": decoded_token.get('azpacr'),
            "oid": decoded_token.get('oid'),
            "rh": decoded_token.get('rh'),
            "sub": decoded_token.get('sub'),
            "tid": decoded_token.get('tid'),
            "uti": decoded_token.get('uti'),
            "ver": decoded_token.get('ver')
        }

        return jsonify({
            "success": True,
            "id": token_id,
            "token_type": token['token_type'],
            "audience": decoded_token.get('aud'),
            "permissions": permissions,
            "identifier": token['email'] or token['user'],
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
    token = conn.execute('SELECT token FROM tokens WHERE id = ? AND token_type = "access_token"',
                         (token_id,)).fetchone()
    conn.close()
    if token:
        return jsonify({"success": True, "access_token": token['token']})
    else:
        return jsonify({"success": False, "error": "Token not found"}), 404


@app.route('/get_token_permissions/<int:token_id>')
def get_token_permissions(token_id):
    conn = get_db_connection()
    token = conn.execute('SELECT token FROM tokens WHERE id = ? AND token_type = "access_token"',
                         (token_id,)).fetchone()
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
    access_tokens = conn.execute(
        'SELECT id, oid, audience, email FROM tokens WHERE token_type = "access_token"').fetchall()
    conn.close()
    current_time = aware_utcnow()
    return render_template('db_analyzer.html',
                           access_tokens=access_tokens,
                           current_time=current_time)


@app.route('/graph_action/<action>/<int:token_id>')
def graph_action(action, token_id):
    conn = get_db_connection()
    token = conn.execute('SELECT token FROM tokens WHERE id = ? AND token_type = "access_token"',
                         (token_id,)).fetchone()
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

        elif action == 'get_role_eligibility_schedules':
            schedules_url = f"{base_url}/roleManagement/directory/roleEligibilitySchedules"
            try:
                role_eligibility_schedules = get_all_pages(schedules_url, headers)
            except Exception as e:
                print(f"Failed to fetch role eligibility schedules: {str(e)}")
                return jsonify({"error": "Failed to fetch role eligibility schedules"}), 500

            processed_schedules = []
            for schedule in role_eligibility_schedules:
                processed_schedule = {
                    "id": schedule.get("id"),
                    "principalId": schedule.get("principalId"),
                    "roleDefinitionId": schedule.get("roleDefinitionId"),
                    "directoryScopeId": schedule.get("directoryScopeId"),
                    "startDateTime": schedule.get("scheduleInfo", {}).get("startDateTime"),
                    "expiration": schedule.get("scheduleInfo", {}).get("expiration", {})
                }
                processed_schedules.append(processed_schedule)

            return jsonify({
                "totalSchedules": len(processed_schedules),
                "roleEligibilitySchedules": processed_schedules
            })

            return jsonify({
                "totalSchedules": len(processed_schedules),
                "roleEligibilitySchedules": processed_schedules
            })

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

        elif action == 'check_expiring_app_passwords':
            applications_url = f"{base_url}/applications?$select=appId,id,passwordCredentials"
            applications = get_all_pages(applications_url, headers)
            expiring_apps = []
            thirty_days_from_now = aware_utcnow() + timedelta(days=30)

            for app in applications:
                app_id = app.get('appId')
                app_object_id = app.get('id')
                password_credentials = app.get('passwordCredentials', [])
                for cred in password_credentials:
                    end_date_str = cred.get('endDateTime')
                    if end_date_str:
                        try:
                            # Parse the date string, ignoring sub-millisecond precision
                            end_date = datetime.strptime(end_date_str[:23], "%Y-%m-%dT%H:%M:%S.%f").replace(
                                tzinfo=timezone.utc)
                            if end_date <= thirty_days_from_now:
                                expiring_apps.append({
                                    "appId": app_id,
                                    "id": app_object_id,
                                    "keyId": cred.get('keyId'),
                                    "expirationDate": end_date_str  # Use the original string

                                })

                        except ValueError:
                            # If parsing fails, just use the original string
                            if end_date_str <= thirty_days_from_now.isoformat():
                                expiring_apps.append({
                                    "appId": app_id,
                                    "id": app_object_id,
                                    "keyId": cred.get('keyId'),
                                    "expirationDate": end_date_str
                                })

            return jsonify({"expiringApplications": expiring_apps})

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
    tenant = request.form.get('tenant')
    scope = request.form.get('scope')

    url = f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/devicecode"
    data = {
        'client_id': client_id,
        'scope': scope
    }

    response = requests.post(url, data=data)
    if response.status_code == 200:
        return jsonify(response.json())
    else:
        return jsonify({"error": f"Error: {response.status_code} - {response.text}"}), 400


@app.route('/get_tokens_table')
def get_tokens_table():
    conn = get_db_connection()
    current_time = int(time.time())
    tokens = conn.execute('''
    SELECT *, (expiration - ?) AS time_left 
    FROM tokens
    ORDER BY CASE WHEN token_type = 'access_token' THEN 0 ELSE 1 END, expiration DESC
    ''', (current_time,)).fetchall()
    conn.close()

    token_list = []
    for token in tokens:
        token_dict = dict(token)
        if token_dict['expiration']:
            token_dict['expiration'] = datetime.fromtimestamp(token_dict['expiration'])
        token_dict['user'] = token_dict.get('email') or token_dict.get('user')
        token_list.append(token_dict)

    return render_template('tokens_table.html',
                           tokens=token_list,
                           current_time=datetime.utcnow(),
                           timedelta=timedelta)


@app.route('/generate_from_refresh', methods=['POST'])
def generate_from_refresh():
    refresh_token_id = request.form['refresh_token_id']
    client_id = request.form['client_id']  # Add this line
    conn = get_db_connection()
    refresh_token = conn.execute('SELECT token, tenant_id FROM tokens WHERE id = ? AND token_type = "refresh_token"',
                                 (refresh_token_id,)).fetchone()
    conn.close()

    if not refresh_token:
        return jsonify({"success": False, "error": "Refresh token not found"}), 404

    result = generate_new_tokens(client_id, refresh_token['token'], refresh_token['tenant_id'])
    return jsonify(result)


@app.route('/poll_for_token', methods=['POST'])
def poll_for_token():
    client_id = request.form.get('client_id')
    device_code = request.form.get('device_code')
    tenant = request.form.get('tenant')

    url = f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token"
    data = {
        'grant_type': 'urn:ietf:params:oauth:grant-type:device_code',
        'client_id': client_id,
        'device_code': device_code
    }

    response = requests.post(url, data=data)
    if response.status_code == 200:
        token_data = response.json()
        return jsonify({
            "status": "success",
            "access_token": token_data['access_token'],
            "refresh_token": token_data.get('refresh_token')
        })
    elif response.status_code == 400 and 'authorization_pending' in response.text:
        return jsonify({"status": "pending"})
    else:
        return jsonify({"status": "error", "error": f"Error: {response.status_code} - {response.text}"}), 400


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


@app.route('/object_analyzer')
def object_analyzer():
    conn = get_db_connection()
    access_tokens = conn.execute(
        'SELECT id, oid, audience, email FROM tokens WHERE token_type = "access_token"').fetchall()
    conn.close()
    current_time = aware_utcnow()

    object_endpoints_json = json.dumps(OBJECT_ENDPOINTS)

    return render_template('object_analyzer.html',
                           access_tokens=access_tokens,
                           current_time=current_time,
                           object_endpoints_json=object_endpoints_json)


@app.route('/get_object_endpoints')
def get_object_endpoints():
    return jsonify(OBJECT_ENDPOINTS)

@app.route('/api/applications/<action>', methods=['GET'])
def get_application_data(action):
    token_id = request.args.get('token_id')
    application_id = request.args.get('user_id')  # We're reusing 'user_id' parameter for consistency

    if not application_id:
        return jsonify({"error": "Application ID is required"}), 400

    conn = get_db_connection()
    token = conn.execute('SELECT token FROM tokens WHERE id = ? AND token_type = "access_token"',
                         (token_id,)).fetchone()
    conn.close()

    if not token:
        return jsonify({"error": "Token not found"}), 404

    access_token = token['token']
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    base_url = "https://graph.microsoft.com/v1.0"

    action_urls = {
        "extensionProperties": f"{base_url}/applications/{application_id}/extensionProperties",
        "owners": f"{base_url}/applications/{application_id}/owners",
        "tokenIssuancePolicies": f"{base_url}/applications/{application_id}/tokenIssuancePolicies",
        "tokenLifetimePolicies": f"{base_url}/applications/{application_id}/tokenLifetimePolicies"
    }

    if action not in action_urls:
        return jsonify({"error": f"Invalid action: {action}"}), 400

    url = action_urls[action]

    try:
        data = get_all_pages(url, headers)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/<object_type>')
def get_objects(object_type):
    token_id = request.args.get('token_id')
    if not token_id:
        return jsonify({"error": "Token ID is required"}), 400

    # Normalize object_type to match keys in OBJECT_ENDPOINTS
    normalized_object_type = object_type.capitalize()

    # Special case for servicePrincipals
    if normalized_object_type == 'Serviceprincipals':
        normalized_object_type = 'ServicePrincipals'

    # Check if the normalized object type exists in OBJECT_ENDPOINTS
    if normalized_object_type not in OBJECT_ENDPOINTS:
        return jsonify({"error": f"Invalid object type: {object_type}"}), 400

    # Get the correct key for the object type (it's nested one level down)
    object_type_key = next(iter(OBJECT_ENDPOINTS[normalized_object_type].keys()))

    try:
        conn = get_db_connection()
        token_data = conn.execute('SELECT token, token_type FROM tokens WHERE id = ? AND token_type = "access_token"',
                                  (token_id,)).fetchone()
        conn.close()

        if not token_data:
            return jsonify({"error": "Token not found"}), 404

        access_token = token_data['token']
        token_type = token_data['token_type']

        # Decode the token to get permissions
        decoded_token = jwt.decode(access_token, options={"verify_signature": False})

        # Check if it's an app or user token
        is_app_token = 'roles' in decoded_token
        permissions = decoded_token.get('roles', []) if is_app_token else decoded_token.get('scp', '').split()

        app.logger.info(f"Token type: {'App' if is_app_token else 'User'}, Permissions: {permissions}")

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        base_url = "https://graph.microsoft.com/v1.0"
        endpoint_config = OBJECT_ENDPOINTS[normalized_object_type][object_type_key]
        url = f"{base_url}{endpoint_config['path']}"

        # For groups, we'll fetch all and filter server-side
        if normalized_object_type == 'Groups':
            url += "?$select=id,displayName,groupTypes"
        elif 'filter' in endpoint_config:
            url += f"?$filter={endpoint_config['filter']}"

        app.logger.info(f"Fetching {object_type} from URL: {url}")
        objects = []

        while url:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            objects.extend(data.get('value', []))
            url = data.get('@odata.nextLink')

        app.logger.info(f"Fetched {len(objects)} {object_type}")

        # For groups, filter out dynamic groups
        if normalized_object_type == 'Groups':
            original_count = len(objects)
            objects = [group for group in objects if 'DynamicMembership' not in group.get('groupTypes', [])]
            app.logger.info(f"Filtered out {original_count - len(objects)} dynamic groups")

        app.logger.info(f"Returning {len(objects)} {object_type}")

        return jsonify({
            "objects": objects,
            "permissions": permissions,
            "is_app_token": is_app_token,
            "total_fetched": len(objects)
        })

    except requests.exceptions.RequestException as e:
        app.logger.error(f"Error in get_objects for {object_type}: {str(e)}")
        if e.response is not None:
            app.logger.error(f"Response content: {e.response.text}")
        return jsonify({"error": f"An error occurred while fetching data: {str(e)}"}), 500

    except Exception as e:
        app.logger.error(f"Unexpected error in get_objects for {object_type}: {str(e)}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500


@app.route('/api/<object_type>/<action>', methods=['GET'])
def get_object_action(object_type, action):
    token_id = request.args.get('token_id')
    object_id = request.args.get('user_id')  # This is actually the object_id

    if not token_id or not object_id:
        return jsonify({"error": "Token ID and Object ID are required"}), 400

    conn = get_db_connection()
    token = conn.execute('SELECT token FROM tokens WHERE id = ? AND token_type = "access_token"',
                         (token_id,)).fetchone()
    conn.close()

    if not token:
        return jsonify({"error": "Token not found"}), 404

    access_token = token['token']
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    base_url = "https://graph.microsoft.com/v1.0"

    normalized_object_type = object_type.capitalize()
    if normalized_object_type == 'Serviceprincipals':
        normalized_object_type = 'ServicePrincipals'

    try:
        endpoint_config = OBJECT_ENDPOINTS[normalized_object_type][object_type.lower()]['actions'].get(action)
        if not endpoint_config:
            return jsonify({"error": f"Invalid action: {action}"}), 400

        # Use the full path from the endpoint configuration
        url = f"{base_url}{endpoint_config['path'].format(id=object_id)}"

        app.logger.debug(f"Request URL: {url}")  # Log the URL for debugging

        # Handle POST requests
        if endpoint_config.get('method') == 'POST':
            data = {"securityEnabledOnly": False}
            response = requests.post(url, headers=headers, json=data)
        else:
            response = requests.get(url, headers=headers)

        response.raise_for_status()
        return jsonify(response.json())

    except KeyError:
        return jsonify({"error": f"Invalid object type or action: {object_type}/{action}"}), 400
    except requests.exceptions.HTTPError as e:
        return jsonify({"error": str(e)}), e.response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Request failed: {str(e)}"}), 500
    except Exception as e:
        app.logger.error(f"Unexpected error in get_object_action: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500
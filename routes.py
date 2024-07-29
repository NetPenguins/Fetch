from flask import render_template, request, jsonify, redirect, url_for
from app import app
from models import get_db_connection
from utils import determine_token_type, insert_token, store_graph_results, generate_new_tokens, \
    request_token_with_secret, request_token_with_password
from graph_endpoints import GRAPH_ENDPOINTS
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
                           current_time=datetime.utcnow(), datetime=datetime, timedelta=timedelta)


@app.route('/graph_enumerator')
def graph_enumerator():
    conn = get_db_connection()
    access_tokens = conn.execute('SELECT id, oid, audience FROM access_tokens').fetchall()
    conn.close()
    current_time = datetime.utcnow()
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

    for endpoint in endpoints:
        category, sub_endpoint = endpoint.split('.', 1)
        endpoint_data = GRAPH_ENDPOINTS
        for key in endpoint.split('.'):
            endpoint_data = endpoint_data[key]
        if isinstance(endpoint_data, dict) and 'path' in endpoint_data:
            results[endpoint] = fetch_endpoint(endpoint_data['path'])

    return jsonify(results)


@app.route('/insert_token', methods=['POST'])
def insert_token_route():
    token = request.form['token']
    return insert_token(token)


@app.route('/request_token_secret', methods=['POST'])
def request_token_secret():
    client_id = request.form['client_id']
    client_secret = request.form['client_secret']
    scope = request.form['scope']
    result = request_token_with_secret(client_id, client_secret, scope, Config.TOKEN_ENDPOINT)
    if 'access_token' in result:
        # If successful, return both the access token and the decoded token
        decoded_token = jwt.decode(result['access_token'], options={"verify_signature": False})
        return jsonify({
            "success": True,
            "access_token": result['access_token'],
            "decoded_token": decoded_token
        })
    else:
        # If there was an error, return the error message
        return jsonify({"success": False, "error": result.get('error', 'Unknown error occurred')})


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

@app.route('/request_token_password', methods=['POST'])
def request_token_password():
    username = request.form['username']
    password = request.form['password']
    client_id = request.form['client_id']
    scope = request.form['scope']
    return request_token_with_password(username, password, client_id, scope, Config.TOKEN_ENDPOINT)


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
    access_tokens = conn.execute('SELECT id, oid, audience FROM access_tokens').fetchall()
    conn.close()
    current_time = datetime.utcnow()
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

    if action == 'get_global_admins':
        # First, get the Global Administrator role
        roles_url = f"{base_url}/directoryRoles"
        response = requests.get(roles_url, headers=headers)
        roles = response.json().get('value', [])
        global_admin_role = next((role for role in roles if role.get('displayName') == "Global Administrator"), None)

        if not global_admin_role:
            return jsonify({"error": "Global Administrator role not found"}), 404

        role_id = global_admin_role['id']

        # Now get the members of the Global Administrator role
        members_url = f"{base_url}/directoryRoles/{role_id}/members"
        response = requests.get(members_url, headers=headers)

    elif action == 'get_all_users':
        response = requests.get(f"{base_url}/users", headers=headers)

    elif action == 'get_all_groups':
        response = requests.get(f"{base_url}/groups", headers=headers)

    else:
        return jsonify({"error": "Invalid action"}), 400

    if response.status_code != 200:
        return jsonify({"error": f"Graph API request failed: {response.text}"}), response.status_code

    return jsonify(response.json())
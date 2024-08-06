import jwt
import json
import time
import requests
from models import get_db_connection
from flask import jsonify
from datetime import datetime, timezone
import sqlite3


def determine_token_type(token):
    if token.startswith("eyJ"):
        return 'access_token'
    elif token.startswith("0."):
        return 'refresh_token'
    else:
        return 'unknown'


def insert_token(token, token_type, tenant_id=None, user=None, source=None):
    conn = get_db_connection()
    try:
        if token_type == 'access_token':
            decoded = jwt.decode(token, options={"verify_signature": False})
            expiration = int(decoded.get('exp', 0))
            oid = decoded.get('oid', 'Unknown')
            audience = decoded.get('aud', 'Unknown')

            # Determine if it's a user token or an app token
            idtyp = decoded.get('idtyp', '').lower()

            if idtyp == 'app':
                identifier = decoded.get('app_displayname', 'Unknown App')
                scp = ' '.join(decoded.get('roles', []))
            else:
                identifier = decoded.get('preferred_username') or decoded.get('email') or decoded.get('unique_name',
                                                                                                      'Unknown User')
                scp = decoded.get('scp', '')
                if not scp:
                    scp = ' '.join(decoded.get('roles', []))

            conn.execute('''
            INSERT INTO tokens (token, token_type, oid, audience, expiration, email, scp, tenant_id, user, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (token, token_type, oid, audience, expiration, identifier, scp, tenant_id, user or identifier, source))
        elif token_type == 'refresh_token':
            # For refresh tokens, we don't decode them. Instead, we store minimal information.
            conn.execute('''
            INSERT INTO tokens (token, token_type, tenant_id, user, source)
            VALUES (?, ?, ?, ?, ?)
            ''', (token, token_type, tenant_id, user, source))
        else:
            # Handle unknown token type
            conn.execute('''
            INSERT INTO tokens (token, token_type, source)
            VALUES (?, ?, ?)
            ''', (token, 'unknown', 'Manual insertion'))

        conn.commit()
        return {"success": True, "message": f"{token_type} inserted successfully"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()


def store_graph_results(endpoint, data):
    conn = get_db_connection()
    try:
        conn.execute(f'INSERT INTO {endpoint}_results (data) VALUES (?)', (json.dumps(data),))
        conn.commit()
    except sqlite3.OperationalError as e:
        if "no such table" in str(e):
            conn.execute(f'''CREATE TABLE IF NOT EXISTS {endpoint}_results
                            (id INTEGER PRIMARY KEY AUTOINCREMENT,
                             data TEXT,
                             timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')
            conn.execute(f'INSERT INTO {endpoint}_results (data) VALUES (?)', (json.dumps(data),))
            conn.commit()
        else:
            raise
    finally:
        conn.close()


def generate_new_tokens(client_id, refresh_token, tenant_id):
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
        insert_token(new_access_token, 'access_token', tenant_id=tenant_id, source='Refresh Token')

        # Insert the new refresh token if it's different from the old one
        if new_refresh_token != refresh_token:
            insert_token(new_refresh_token, 'refresh_token', tenant_id=tenant_id, source='Token Refresh')

        return {
            "success": True,
            "message": "New tokens generated and inserted successfully",
            "access_token": new_access_token,
            "refresh_token": new_refresh_token
        }
    else:
        return {"error": "Failed to generate new access token"}




def request_token_with_secret(client_id, client_secret, scope, tenant):
    # Check if tenant is a full domain or just a tenant ID
    if '.' in tenant and not tenant.startswith('http'):
        tenant = f"{tenant}"

    token_endpoint = f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token"

    data = {
        'client_id': client_id,
        'scope': scope,
        'client_secret': client_secret,
        'grant_type': 'client_credentials'
    }

    try:
        response = requests.post(token_endpoint, data=data)
        response.raise_for_status()
        result = response.json()
        access_token = result.get('access_token')
        if access_token:
            insert_token(access_token, 'access_token', tenant_id=tenant, source='Client Secret Auth')
            return {
                "success": True,
                "access_token": access_token,
                "token_type": result.get('token_type'),
                "expires_in": result.get('expires_in')
            }
        else:
            return {"error": "No access token in response"}
    except requests.exceptions.RequestException as e:
        return {"error": f"Error: {str(e)}"}


def request_token_with_password(username, password, client_id, scope, token_endpoint):
    data = {
        'client_id': client_id,
        'scope': scope,
        'username': username,
        'password': password,
        'grant_type': 'password'
    }

    response = requests.post(token_endpoint, data=data)

    if response.status_code == 200:
        result = response.json()
        access_token = result['access_token']
        refresh_token = result.get('refresh_token')

        insert_token(access_token)
        if refresh_token:
            insert_token(refresh_token)

        return jsonify({"success": True, "message": "Tokens acquired and stored successfully"}), 200
    else:
        return jsonify({"error": f"Error: {response.status_code} - {response.text}"}), 400


def aware_utcnow():
    return datetime.now(timezone.utc)


def aware_utcfromtimestamp(timestamp):
    return datetime.fromtimestamp(timestamp, timezone.utc)


def naive_utcnow():
    return aware_utcnow().replace(tzinfo=None)


def naive_utcfromtimestamp(timestamp):
    return aware_utcfromtimestamp(timestamp).replace(tzinfo=None)


def get_all_pages(url, headers):
    all_data = []
    while url:
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            raise Exception(f"Error fetching data: {response.status_code}")
        data = response.json()
        all_data.extend(data.get('value', []))
        url = data.get('@odata.nextLink')
    return all_data

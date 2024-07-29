import jwt
import json
import time
import requests
from models import get_db_connection
from flask import jsonify
from datetime import datetime, timezone



def determine_token_type(token):
    if token.startswith("eyJ"):
        return 'Access Token'
    elif token.startswith("0."):
        return 'Refresh Token'
    else:
        return 'Unknown Token Type'


def insert_token(token):
    token_type = determine_token_type(token)

    try:
        if token_type == 'Access Token':
            try:
                decoded = jwt.decode(token, options={"verify_signature": False})
                print(
                    f"Decoded token: {json.dumps({k: v for k, v in decoded.items() if k not in ['exp', 'iat']}, indent=2)}")

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


def generate_new_tokens(client_id, refresh_token):
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

        return {
            "success": True,
            "message": "New tokens generated and inserted successfully",
            "access_token": new_access_token,
            "refresh_token": new_refresh_token
        }
    else:
        return {"error": "Failed to generate new access token"}


def request_token_with_secret(client_id, client_secret, scope, token_endpoint):
    data = {
        'client_id': client_id,
        'scope': scope,
        'client_secret': client_secret,
        'grant_type': 'client_credentials'
    }

    try:
        response = requests.post(token_endpoint, data=data)
        response.raise_for_status()  # Raises a HTTPError if the status is 4xx, 5xx
        result = response.json()
        access_token = result.get('access_token')
        if access_token:
            insert_token(access_token)
            return {"success": True, "access_token": access_token}
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
import sqlite3


def get_db_connection():
    conn = sqlite3.connect('azure_token_manager.db')
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    # Create your tables here
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
    from graph_endpoints import GRAPH_ENDPOINTS
    for endpoint in GRAPH_ENDPOINTS.keys():
        conn.execute(f'''CREATE TABLE IF NOT EXISTS {endpoint}_results
                         (id INTEGER PRIMARY KEY AUTOINCREMENT,
                          data TEXT,
                          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')

    conn.commit()
    conn.close()
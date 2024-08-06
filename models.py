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

def create_tables():
    conn = get_db_connection()
    conn.execute('''
    CREATE TABLE IF NOT EXISTS tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT NOT NULL,
        token_type TEXT NOT NULL,
        oid TEXT,
        audience TEXT,
        expiration INTEGER,
        email TEXT,
        scp TEXT,
        tenant_id TEXT,
        user TEXT,
        source TEXT
    )
    ''')
    conn.commit()
    conn.close()

def migrate_data():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if old tables exist
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='access_tokens'")
    access_tokens_exist = cursor.fetchone() is not None

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='refresh_tokens'")
    refresh_tokens_exist = cursor.fetchone() is not None

    if access_tokens_exist:
        # Migrate data from access_tokens table
        cursor.execute('''
        INSERT INTO tokens (token, token_type, oid, audience, expiration, email, scp)
        SELECT token, 'access_token', oid, audience, expiration, email, scp
        FROM access_tokens
        ''')

    if refresh_tokens_exist:
        # Migrate data from refresh_tokens table
        cursor.execute('''
        INSERT INTO tokens (token, token_type)
        SELECT token, 'refresh_token'
        FROM refresh_tokens
        ''')

    # Drop old tables
    if access_tokens_exist:
        cursor.execute('DROP TABLE access_tokens')
    if refresh_tokens_exist:
        cursor.execute('DROP TABLE refresh_tokens')

    conn.commit()
    conn.close()
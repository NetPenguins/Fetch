import sqlite3


def get_db_connection():
    conn = sqlite3.connect('azure_token_manager.db')
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    try:
        with get_db_connection() as conn:
            conn.execute('''CREATE TABLE IF NOT EXISTS tenant_details
                            (domain TEXT PRIMARY KEY, details TEXT)''')
            conn.execute('''CREATE TABLE IF NOT EXISTS tokens
                            (id INTEGER PRIMARY KEY AUTOINCREMENT,
                             token TEXT NOT NULL,
                             token_type TEXT NOT NULL,
                             oid TEXT,
                             audience TEXT,
                             expiration INTEGER,
                             email TEXT,
                             scp TEXT,
                             tenant_id TEXT,
                             user TEXT,
                             source TEXT)''')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_token_type ON tokens (token_type)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_expiration ON tokens (expiration)')

            # Create tables for storing Graph API results
            from static.endpoints.graph_endpoints import GRAPH_ENDPOINTS
            for endpoint in GRAPH_ENDPOINTS.keys():
                conn.execute(f'''CREATE TABLE IF NOT EXISTS {endpoint}_results
                                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                                  data TEXT,
                                  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')
    except sqlite3.Error as e:
        print(f"An error occurred: {e}")


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
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Check if old tables exist and migrate data
            for old_table, token_type in [('access_tokens', 'access_token'), ('refresh_tokens', 'refresh_token')]:
                cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{old_table}'")
                if cursor.fetchone():
                    cursor.execute(f'''
                    INSERT INTO tokens (token, token_type, oid, audience, expiration, email, scp)
                    SELECT token, '{token_type}', oid, audience, expiration, email, scp
                    FROM {old_table}
                    ''')
                    cursor.execute(f'DROP TABLE {old_table}')

            conn.commit()
    except sqlite3.Error as e:
        print(f"An error occurred during migration: {e}")

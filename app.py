from flask import Flask
from config import Config
from models import init_db, create_tables, migrate_data


app = Flask(__name__)
app.config.from_object(Config)

from routes import *

init_db()
create_tables()
migrate_data()


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
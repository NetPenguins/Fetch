from flask import Flask
from config import Config
from models import init_db

app = Flask(__name__)
app.config.from_object(Config)

init_db()

from routes import *


if __name__ == '__main__':
    app.run(debug=True, ssl_context='adhoc', host='127.0.0.1', port=5000)
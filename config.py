import secrets

class Config:
    SECRET_KEY = secrets.token_hex(16)
    REDIRECT_URI = 'https://127.0.0.1:5000/callback'
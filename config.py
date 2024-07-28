import secrets

class Config:
    SECRET_KEY = secrets.token_hex(16)
    TENANT_ID = 'be9b3b2c-bc81-4990-a8a9-e620c6dda223'
    TOKEN_ENDPOINT = f'https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token'
    CLIENT_ID = 'e894cfc2-f4be-4298-b710-914c9ccbfb1a'
    REDIRECT_URI = 'https://127.0.0.1:5000/callback'
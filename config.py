import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your_secret_key'
    TENANT_ID = os.environ.get('TENANT_ID') or 'your_tenant_id'
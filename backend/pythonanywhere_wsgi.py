# PythonAnywhere WSGI configuration for Typeform Clone Backend
import sys
import os

# Add your project directory to the path
path = '/home/mudit9999/Typeform-clone/backend'
if path not in sys.path:
    sys.path.insert(0, path)

# Set environment variables
os.environ['DATABASE_URL'] = 'sqlite:////home/mudit9999/Typeform-clone/backend/typeform.db'

# Import the FastAPI app
from main import app

# Wrap ASGI app with WSGI middleware for PythonAnywhere
from a2wsgi import ASGIMiddleware
application = ASGIMiddleware(app)
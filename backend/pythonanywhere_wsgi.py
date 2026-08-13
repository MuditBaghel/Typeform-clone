# PythonAnywhere WSGI configuration for Typeform Clone Backend
import sys
import os

# Add your project directory to the path
path = '/home/YOUR_USERNAME/Typeform-clone/backend'
if path not in sys.path:
    sys.path.insert(0, path)

# Set environment variables
os.environ['DATABASE_URL'] = 'sqlite:////home/YOUR_USERNAME/Typeform-clone/backend/typeform.db'

from main import app

# PythonAnywhere expects the application to be named 'application'
application = app
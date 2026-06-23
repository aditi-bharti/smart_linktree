"""
Firebase Authentication Configuration
To use Firebase Authentication:
1. Go to https://console.firebase.google.com/
2. Create a new project or select existing one
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Save the JSON file as 'firebase-credentials.json' in the project root
   OR set FIREBASE_CREDENTIALS environment variable with the JSON contents
6. Enable Google Sign-In in Authentication > Sign-in method
"""
import firebase_admin
from firebase_admin import credentials, auth
import os
import json

# Initialize Firebase Admin SDK
firebase_app = None

def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    global firebase_app
    
    if firebase_app is not None:
        return firebase_app
    
    cred = None

    # Option 1: Read from environment variable (for production/Render)
    firebase_env = os.environ.get('FIREBASE_CREDENTIALS')
    if firebase_env:
        try:
            cred_dict = json.loads(firebase_env)
            cred = credentials.Certificate(cred_dict)
            print("✅ Firebase credentials loaded from environment variable")
        except Exception as e:
            print(f"❌ Error loading Firebase credentials from environment: {e}")

    # Option 2: Read from file (for local development)
    if cred is None:
        cred_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'firebase-credentials.json')
        if os.path.exists(cred_path):
            try:
                cred = credentials.Certificate(cred_path)
                print("✅ Firebase credentials loaded from file")
            except Exception as e:
                print(f"❌ Error loading Firebase credentials from file: {e}")

    if cred is None:
        print("⚠️  WARNING: Firebase credentials not found!")
        print("   Set FIREBASE_CREDENTIALS environment variable or add firebase-credentials.json")
        print("   Firebase authentication will not work until you add credentials.")
        return None

    try:
        firebase_app = firebase_admin.initialize_app(cred)
        print("✅ Firebase Admin SDK initialized successfully")
        return firebase_app
    except Exception as e:
        print(f"❌ Error initializing Firebase: {e}")
        return None


def verify_firebase_token(id_token: str) -> dict:
    """
    Verify Firebase ID token and return user info
    """
    if firebase_app is None:
        initialize_firebase()
    
    if firebase_app is None:
        raise Exception("Firebase not initialized. Please add firebase-credentials.json")
    
    try:
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
        email = decoded_token.get('email', '')
        name = decoded_token.get('name', email.split('@')[0])
        picture = decoded_token.get('picture', '')
        
        return {
            'uid': uid,
            'email': email,
            'name': name,
            'picture': picture,
            'email_verified': decoded_token.get('email_verified', False)
        }
    except Exception as e:
        print(f"Error verifying Firebase token: {e}")
        return None


def get_firebase_user(uid: str) -> dict:
    """Get Firebase user by UID"""
    if firebase_app is None:
        initialize_firebase()
    
    if firebase_app is None:
        return None
    
    try:
        user = auth.get_user(uid)
        return {
            'uid': user.uid,
            'email': user.email,
            'name': user.display_name or user.email.split('@')[0],
            'picture': user.photo_url,
            'email_verified': user.email_verified
        }
    except Exception as e:
        print(f"Error getting Firebase user: {e}")
        return None
"""
Firebase Authentication Configuration

To use Firebase Authentication:
1. Go to https://console.firebase.google.com/
2. Create a new project or select existing one
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Save the JSON file as 'firebase-credentials.json' in the project root
6. Enable Google Sign-In in Authentication > Sign-in method
"""

import firebase_admin
from firebase_admin import credentials, auth
import os

# Initialize Firebase Admin SDK
firebase_app = None

def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    global firebase_app
    
    if firebase_app is not None:
        return firebase_app
    
    # Path to your Firebase credentials JSON file
    cred_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'firebase-credentials.json')
    
    if not os.path.exists(cred_path):
        print("⚠️  WARNING: Firebase credentials not found!")
        print(f"   Expected location: {cred_path}")
        print("   Firebase authentication will not work until you add credentials.")
        print("   See instructions in app/firebase_config.py")
        return None
    
    try:
        cred = credentials.Certificate(cred_path)
        firebase_app = firebase_admin.initialize_app(cred)
        print("✅ Firebase Admin SDK initialized successfully")
        return firebase_app
    except Exception as e:
        print(f"❌ Error initializing Firebase: {e}")
        return None


def verify_firebase_token(id_token: str) -> dict:
    """
    Verify Firebase ID token and return user info
    
    Args:
        id_token: Firebase ID token from client
        
    Returns:
        dict with user info (uid, email, name, picture) or None if invalid
    """
    if firebase_app is None:
        initialize_firebase()
    
    if firebase_app is None:
        raise Exception("Firebase not initialized. Please add firebase-credentials.json")
    
    try:
        # Verify the ID token
        decoded_token = auth.verify_id_token(id_token)
        
        # Extract user information
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

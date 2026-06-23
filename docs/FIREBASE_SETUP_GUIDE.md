# 🔥 Firebase Authentication Setup Guide

## Overview

This guide will help you integrate Firebase Authentication with Google Sign-In into your Smart LinkTree application.

---

## 📋 Prerequisites

- Google account
- Firebase project (free tier is sufficient)
- Your Smart LinkTree app running

---

## 🚀 Step-by-Step Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: `smart-linktree` (or your choice)
4. Click "Continue"
5. Disable Google Analytics (optional, can enable later)
6. Click "Create project"
7. Wait for project creation, then click "Continue"

### Step 2: Enable Google Sign-In

1. In Firebase Console, click "Authentication" in left sidebar
2. Click "Get started"
3. Click on "Sign-in method" tab
4. Click on "Google" provider
5. Toggle "Enable" switch to ON
6. Enter support email (your email)
7. Click "Save"

### Step 3: Register Web App

1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click the Web icon `</>`
4. Enter app nickname: `Smart LinkTree Web`
5. Check "Also set up Firebase Hosting" (optional)
6. Click "Register app"
7. **IMPORTANT**: Copy the `firebaseConfig` object shown

Example config:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### Step 4: Get Service Account Credentials

1. In Firebase Console, go to Project Settings
2. Click "Service accounts" tab
3. Click "Generate new private key"
4. Click "Generate key" in the dialog
5. A JSON file will download - **SAVE THIS FILE SECURELY**
6. Rename the file to `firebase-credentials.json`
7. Move it to your project root directory (same level as `app/` folder)

**⚠️ IMPORTANT**: Add `firebase-credentials.json` to `.gitignore` to keep it secure!

### Step 5: Update Frontend Configuration

1. Open `app/static/auth-firebase.html`
2. Find the `firebaseConfig` object (around line 100)
3. Replace the placeholder values with your actual Firebase config from Step 3:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### Step 6: Update Main Route (Optional)

If you want Firebase auth to be the default login page:

1. Open `app/main.py`
2. Find the `root()` function
3. Change it to serve `auth-firebase.html`:

```python
@app.get("/")
async def root():
    """Redirect to auth page"""
    return FileResponse(os.path.join(static_dir, "auth-firebase.html"), media_type="text/html")
```

Or add a new route:

```python
@app.get("/login")
async def login_page():
    """Serve Firebase auth page"""
    return FileResponse(os.path.join(static_dir, "auth-firebase.html"), media_type="text/html")
```

### Step 7: Restart Server

```bash
# Stop current server
pkill -f uvicorn

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🧪 Testing

### Test Firebase Authentication

1. Open: http://localhost:8000/auth-firebase.html
2. Click "Continue with Google"
3. Select your Google account
4. Grant permissions
5. You should be redirected to dashboard
6. Check that your profile was created with Google info

### Test Traditional Login (Still Works)

1. Open: http://localhost:8000/auth.html
2. Login with: demo / demo123
3. Should work as before

---

## 📁 File Structure

```
your-project/
├── app/
│   ├── firebase_config.py          # NEW: Firebase backend config
│   ├── routes/
│   │   └── auth.py                 # UPDATED: Added Firebase login endpoint
│   ├── models/
│   │   └── user.py                 # UPDATED: Added FirebaseLogin model
│   ├── auth.py                     # UPDATED: Added get_user_by_email
│   └── static/
│       └── auth-firebase.html      # NEW: Firebase auth page
├── firebase-credentials.json       # NEW: Your Firebase service account key
└── .gitignore                      # UPDATED: Add firebase-credentials.json
```

---

## 🔐 Security Best Practices

### 1. Protect Service Account Key

Add to `.gitignore`:
```
firebase-credentials.json
*.json
!package.json
```

### 2. Environment Variables (Production)

For production, use environment variables instead of hardcoded config:

```python
# app/firebase_config.py
import os
import json

firebase_config = json.loads(os.getenv('FIREBASE_CONFIG', '{}'))
```

### 3. Authorized Domains

In Firebase Console > Authentication > Settings > Authorized domains:
- Add your production domain
- Remove localhost in production

---

## 🎯 How It Works

### Flow Diagram

```
User clicks "Sign in with Google"
    ↓
Firebase popup opens
    ↓
User selects Google account
    ↓
Firebase returns ID token
    ↓
Frontend sends token to /api/auth/firebase-login
    ↓
Backend verifies token with Firebase Admin SDK
    ↓
Backend checks if user exists by email
    ↓
If new user: Create account with Google info
If existing: Login existing user
    ↓
Backend returns JWT token
    ↓
User redirected to dashboard
```

### Backend Endpoints

**New Endpoint:**
```
POST /api/auth/firebase-login
Body: { "id_token": "firebase_token_here" }
Response: { "access_token": "jwt_token", "user": {...} }
```

**Existing Endpoints (Still Work):**
```
POST /api/auth/login       # Traditional username/password
POST /api/auth/signup      # Traditional signup
```

---

## 🐛 Troubleshooting

### Error: "Firebase not configured"

**Solution**: Update `firebaseConfig` in `auth-firebase.html` with your actual Firebase credentials.

### Error: "Firebase credentials not found"

**Solution**: 
1. Download service account key from Firebase Console
2. Rename to `firebase-credentials.json`
3. Place in project root directory
4. Restart server

### Error: "Invalid Firebase token"

**Possible causes**:
1. Token expired (tokens expire after 1 hour)
2. Wrong project credentials
3. Service account key not loaded

**Solution**: 
- Check server logs for detailed error
- Verify `firebase-credentials.json` is in correct location
- Try signing in again

### Google Sign-In popup blocked

**Solution**: 
- Allow popups for localhost in browser settings
- Or use redirect method instead of popup

### Error: "User already exists"

This shouldn't happen, but if it does:
- The system checks by email, not username
- If email exists, it logs in existing user
- If email is new, it creates new account

---

## 🎨 Customization

### Change Button Style

Edit `auth-firebase.html`:
```css
.google-btn {
    background: #4285f4;  /* Google blue */
    color: white;
    /* ... */
}
```

### Add More Providers

Firebase supports:
- Facebook
- Twitter
- GitHub
- Microsoft
- Apple
- Email/Password

Enable in Firebase Console > Authentication > Sign-in method

### Custom User Data

Modify `app/routes/auth.py` in `firebase_login()`:
```python
user = create_user(
    username=username,
    email=firebase_user['email'],
    password=f"firebase_{firebase_user['uid']}",
    role="premium",  # Give Firebase users premium!
    position="developer"  # Custom position
)
```

---

## 📊 User Data

### Firebase Users in Database

Firebase users are stored in `data/users.json` like regular users:

```json
{
  "user_abc123": {
    "id": "user_abc123",
    "username": "john_doe",
    "email": "john@gmail.com",
    "password": "firebase_xyz789",
    "role": "free",
    "position": "guest",
    "avatar_url": "https://lh3.googleusercontent.com/...",
    "bio": "Signed in with Google"
  }
}
```

### Identifying Firebase Users

Firebase users have:
- Password starting with `firebase_`
- Avatar URL from Google
- Bio: "Signed in with Google"

---

## 🚀 Production Deployment

### 1. Update Authorized Domains

Firebase Console > Authentication > Settings > Authorized domains:
```
yourdomain.com
www.yourdomain.com
```

### 2. Use Environment Variables

```bash
export FIREBASE_CREDENTIALS='{"type":"service_account",...}'
```

### 3. HTTPS Required

Firebase Authentication requires HTTPS in production.

---

## 📞 Support

### Firebase Documentation
- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [Google Sign-In](https://firebase.google.com/docs/auth/web/google-signin)

### Common Issues
- [Firebase Auth Errors](https://firebase.google.com/docs/auth/admin/errors)
- [Troubleshooting Guide](https://firebase.google.com/docs/auth/web/troubleshooting)

---

## ✅ Checklist

Before going live:

- [ ] Firebase project created
- [ ] Google Sign-In enabled
- [ ] Web app registered in Firebase
- [ ] Service account key downloaded
- [ ] `firebase-credentials.json` in project root
- [ ] `firebaseConfig` updated in `auth-firebase.html`
- [ ] Server restarted
- [ ] Tested Google Sign-In locally
- [ ] `firebase-credentials.json` added to `.gitignore`
- [ ] Production domain added to authorized domains
- [ ] HTTPS enabled for production

---

**🎉 You're all set! Users can now sign in with Google!**

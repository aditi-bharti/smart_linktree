# 🔥 Firebase Google Sign-In - Quick Start

## ✅ What's Been Added

1. ✅ **Backend Firebase Integration** (`app/firebase_config.py`)
2. ✅ **New API Endpoint** (`POST /api/auth/firebase-login`)
3. ✅ **Firebase Auth Page** (`app/static/auth-firebase.html`)
4. ✅ **Updated Models** (Added `FirebaseLogin` model)
5. ✅ **Security** (`.gitignore` updated)

---

## 🚀 Quick Setup (5 Minutes)

### 1. Create Firebase Project

Go to: https://console.firebase.google.com/

1. Click "Add project"
2. Name: `smart-linktree`
3. Disable Analytics (optional)
4. Click "Create project"

### 2. Enable Google Sign-In

1. Click "Authentication" → "Get started"
2. Click "Sign-in method" tab
3. Enable "Google"
4. Enter your email as support email
5. Click "Save"

### 3. Get Firebase Config

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click Web icon `</>`
4. Register app: "Smart LinkTree Web"
5. **Copy the `firebaseConfig` object**

### 4. Get Service Account Key

1. Project Settings → "Service accounts" tab
2. Click "Generate new private key"
3. Click "Generate key"
4. Save file as `firebase-credentials.json` in project root

### 5. Update Frontend Config

Open `app/static/auth-firebase.html` (line ~100):

```javascript
const firebaseConfig = {
    apiKey: "PASTE_YOUR_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 6. Restart Server

```bash
pkill -f uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
```

### 7. Test It!

Open: http://localhost:8000/auth-firebase.html

Click "Continue with Google" → Sign in → Done! ✅

---

## 📁 Files Added/Modified

### New Files:
- `app/firebase_config.py` - Firebase backend integration
- `app/static/auth-firebase.html` - New login page with Google Sign-In
- `firebase-credentials.json` - Your Firebase service account key (YOU ADD THIS)
- `.gitignore` - Protects your credentials
- `FIREBASE_SETUP_GUIDE.md` - Detailed setup instructions
- `FIREBASE_QUICK_START.md` - This file

### Modified Files:
- `app/routes/auth.py` - Added `/api/auth/firebase-login` endpoint
- `app/models/user.py` - Added `FirebaseLogin` model
- `app/auth.py` - Added `get_user_by_email()` function

---

## 🎯 How It Works

```
User clicks "Sign in with Google"
    ↓
Google popup opens
    ↓
User signs in with Google account
    ↓
Firebase returns ID token
    ↓
Frontend sends token to backend
    ↓
Backend verifies with Firebase
    ↓
Backend creates/logs in user
    ↓
User redirected to dashboard
```

---

## 🧪 Testing

### Test Firebase Login:
```
1. Go to: http://localhost:8000/auth-firebase.html
2. Click "Continue with Google"
3. Sign in with your Google account
4. Should redirect to dashboard
5. Check your profile - avatar should be from Google!
```

### Test Traditional Login (Still Works):
```
1. Go to: http://localhost:8000/auth.html
2. Login: demo / demo123
3. Should work as before
```

---

## 🔐 Security Notes

**IMPORTANT**: 
- ✅ `firebase-credentials.json` is in `.gitignore`
- ✅ Never commit this file to Git
- ✅ Keep it secure like a password

---

## 🐛 Troubleshooting

### "Firebase not configured" message?
→ Update `firebaseConfig` in `auth-firebase.html`

### "Firebase credentials not found" error?
→ Add `firebase-credentials.json` to project root

### Google Sign-In popup blocked?
→ Allow popups for localhost in browser

### Still not working?
→ Check server logs: `tail -f /tmp/uvicorn.log`
→ Check browser console (F12)

---

## 📊 What Happens to User Data?

Firebase users are stored in `data/users.json` like regular users:

```json
{
  "user_abc123": {
    "username": "john_doe",
    "email": "john@gmail.com",
    "avatar_url": "https://lh3.googleusercontent.com/...",
    "bio": "Signed in with Google",
    "role": "free",
    "position": "guest"
  }
}
```

---

## 🎨 Customization

### Make Firebase Login the Default

Edit `app/main.py`:

```python
@app.get("/")
async def root():
    return FileResponse(os.path.join(static_dir, "auth-firebase.html"), media_type="text/html")
```

### Give Firebase Users Premium Access

Edit `app/routes/auth.py` in `firebase_login()`:

```python
user = create_user(
    username=username,
    email=firebase_user['email'],
    password=f"firebase_{firebase_user['uid']}",
    role="premium",  # ← Change this!
    position="developer"
)
```

---

## ✅ Quick Checklist

- [ ] Firebase project created
- [ ] Google Sign-In enabled
- [ ] `firebaseConfig` copied
- [ ] `firebase-credentials.json` downloaded and placed in project root
- [ ] `firebaseConfig` updated in `auth-firebase.html`
- [ ] Server restarted
- [ ] Tested Google Sign-In

---

## 📞 Need Help?

See detailed guide: `FIREBASE_SETUP_GUIDE.md`

Firebase Docs: https://firebase.google.com/docs/auth

---

**🎉 That's it! Your app now supports Google Sign-In!**

**Access the new login page:** http://localhost:8000/auth-firebase.html

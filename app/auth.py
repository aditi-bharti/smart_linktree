import hashlib
import secrets
import json
import os
from typing import Optional, Tuple
from datetime import datetime, timedelta
import jwt

# Configuration
# SECRET_KEY must be set via environment variable in production.
# Falls back to a randomly generated key for local development only —
# this means tokens won't survive a server restart unless SECRET_KEY is set.
SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY:
    SECRET_KEY = secrets.token_hex(32)
    print("⚠️  WARNING: SECRET_KEY environment variable not set!")
    print("   Using a randomly generated key for this session only.")
    print("   All existing login tokens will be invalidated on restart.")
    print("   Set SECRET_KEY in your environment before deploying to production.")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

USERS_FILE = os.path.join("data", "users.json")


def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    """Verify password"""
    return hash_password(password) == hashed


def create_access_token(user_id: str, username: str) -> str:
    """Create JWT access token"""
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode = {
        "sub": user_id,
        "username": username,
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        return {"user_id": user_id, "username": payload.get("username")}
    except jwt.InvalidTokenError:
        return None


def _load_users() -> dict:
    """Load users from file"""
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}


def _save_users(users: dict):
    """Save users to file"""
    os.makedirs(os.path.dirname(USERS_FILE), exist_ok=True)
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, indent=2, ensure_ascii=False)


def get_user_by_username(username: str) -> Optional[dict]:
    """Get user by username"""
    users = _load_users()
    for user_id, user_data in users.items():
        if user_data.get("username") == username:
            return user_data
    return None


def get_user_by_email(email: str) -> Optional[dict]:
    """Get user by email"""
    users = _load_users()
    for user_id, user_data in users.items():
        if user_data.get("email") == email:
            return user_data
    return None


def get_user_by_id(user_id: str) -> Optional[dict]:
    """Get user by ID"""
    users = _load_users()
    return users.get(user_id)


def create_user(username: str, email: str, password: str, role: str = "free", position: str = "guest") -> dict:
    """Create new user"""
    users = _load_users()
    
    # Check if username exists
    if get_user_by_username(username):
        return None
    
    user_id = f"user_{secrets.token_hex(8)}"
    user_data = {
        "id": user_id,
        "username": username,
        "email": email,
        "password": hash_password(password),
        "role": role,
        "position": position,
        "created_at": datetime.utcnow().isoformat(),
        "avatar_url": None,
        "bio": None
    }
    
    users[user_id] = user_data
    _save_users(users)
    
    return user_data


def update_user_profile(user_id: str, avatar_url: Optional[str] = None, bio: Optional[str] = None):
    """Update user profile"""
    users = _load_users()
    if user_id in users:
        if avatar_url:
            users[user_id]["avatar_url"] = avatar_url
        if bio:
            users[user_id]["bio"] = bio
        _save_users(users)
        return users[user_id]
    return None


def authenticate_user(username: str, password: str) -> Optional[dict]:
    """Authenticate user"""
    user = get_user_by_username(username)
    if not user:
        return None
    if not verify_password(password, user.get("password", "")):
        return None
    return user


def get_all_users() -> list:
    """Get all users (admin only)"""
    users = _load_users()
    return list(users.values())


def delete_user(user_id: str) -> bool:
    """Delete user (admin only)"""
    users = _load_users()
    if user_id in users:
        del users[user_id]
        _save_users(users)
        return True
    return False


def update_user(user_id: str, role: Optional[str] = None, position: Optional[str] = None, 
                position_verified: Optional[bool] = None) -> Optional[dict]:
    """Update user (admin only)"""
    users = _load_users()
    if user_id in users:
        if role is not None:
            users[user_id]["role"] = role
        if position is not None:
            users[user_id]["position"] = position
        if position_verified is not None:
            users[user_id]["position_verified"] = position_verified
        _save_users(users)
        return users[user_id]
    return None


def apply_for_position(user_id: str, position: str) -> Optional[dict]:
    """User applies for a position"""
    users = _load_users()
    if user_id in users:
        users[user_id]["position_application"] = position
        users[user_id]["position_verified"] = False
        _save_users(users)
        return users[user_id]
    return None


def approve_position_application(user_id: str) -> Optional[dict]:
    """Admin approves position application"""
    users = _load_users()
    if user_id in users:
        if users[user_id].get("position_application"):
            users[user_id]["position"] = users[user_id]["position_application"]
            users[user_id]["position_verified"] = True
            users[user_id]["position_application"] = None
            _save_users(users)
            return users[user_id]
    return None


def reject_position_application(user_id: str) -> Optional[dict]:
    """Admin rejects position application"""
    users = _load_users()
    if user_id in users:
        users[user_id]["position_application"] = None
        users[user_id]["position_verified"] = False
        _save_users(users)
        return users[user_id]
    return None

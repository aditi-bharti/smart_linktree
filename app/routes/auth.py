from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
from app.models.user import UserCreate, UserLogin, User, Token, FirebaseLogin, PositionApplication
from app.auth import (
    authenticate_user, create_user, create_access_token, 
    verify_token, get_user_by_id, update_user_profile,
    get_user_by_email, apply_for_position
)
from app.firebase_config import verify_firebase_token, initialize_firebase

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Initialize Firebase on startup
initialize_firebase()


def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """Get current user from token"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authentication header")
    
    user_data = verify_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = get_user_by_id(user_data["user_id"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user


@router.post("/signup")
async def signup(user_data: UserCreate) -> Token:
    """User signup"""
    # Check if username exists
    existing_user = authenticate_user(user_data.username, "dummy")
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Create user
    user = create_user(
        username=user_data.username,
        email=user_data.email,
        password=user_data.password,
        role=user_data.role or "free",
        position=user_data.position or "guest"
    )
    
    if not user:
        raise HTTPException(status_code=400, detail="Failed to create user")
    
    # Create token
    token = create_access_token(user["id"], user["username"])
    
    # Remove password from response
    user.pop("password", None)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/login")
async def login(credentials: UserLogin) -> Token:
    """User login"""
    user = authenticate_user(credentials.username, credentials.password)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create token
    token = create_access_token(user["id"], user["username"])
    
    # Remove password from response
    user.pop("password", None)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/firebase-login")
async def firebase_login(firebase_data: FirebaseLogin) -> Token:
    """Login or signup with Firebase (Google Sign-In)"""
    try:
        # Verify Firebase ID token
        firebase_user = verify_firebase_token(firebase_data.id_token)
        
        if not firebase_user:
            raise HTTPException(status_code=401, detail="Invalid Firebase token")
        
        # Import required modules
        from app.database import save_profile, get_profile
        from app.models.link import Profile
        from app.auth import get_user_by_username
        
        # Check if user exists by email
        existing_user = get_user_by_email(firebase_user['email'])
        
        if existing_user:
            # User exists, login
            user = existing_user
            print(f"🔄 Existing Firebase user logging in: {user['email']}")
        else:
            # New user, create account
            # Generate username from email or name
            username = firebase_user['name'].replace(' ', '_').lower()
            
            # Ensure username is unique
            counter = 1
            original_username = username
            while get_user_by_username(username):
                username = f"{original_username}{counter}"
                counter += 1
            
            # Create new user with Firebase data
            user = create_user(
                username=username,
                email=firebase_user['email'],
                password=f"firebase_{firebase_user['uid']}",  # Placeholder, won't be used
                role="free",
                position="guest"
            )
            
            if not user:
                raise HTTPException(status_code=400, detail="Failed to create user")
            
            # Update user profile with Firebase data
            if firebase_user.get('picture'):
                update_user_profile(
                    user["id"],
                    avatar_url=firebase_user['picture'],
                    bio="Signed in with Google"
                )
                user = get_user_by_id(user["id"])
            
            print(f"✅ Created new Firebase user: {user['email']}")
        
        # Ensure profile exists in profiles.json (for both new and existing users)
        existing_profile = get_profile(user["id"])
        if not existing_profile:
            # Create new profile with Google name and avatar
            new_profile = Profile(
                id=user["id"],
                title=firebase_user['name'],  # Use Google name
                bio="Signed in with Google",
                avatar_url=firebase_user.get('picture', ''),  # Use Google avatar
                links=[],
                theme="light"
            )
            save_profile(new_profile)
            print(f"✅ Created profile for user: {user['id']} with name: {firebase_user['name']}")
        else:
            print(f"✅ Profile already exists for user: {user['id']}")
        
        # Create JWT token
        token = create_access_token(user["id"], user["username"])
        
        # Remove password from response
        user.pop("password", None)
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": user
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Firebase login error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Firebase authentication failed: {str(e)}")


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)) -> User:
    """Get current user info"""
    current_user.pop("password", None)
    return current_user


@router.put("/me/profile")
async def update_profile(
    avatar_url: Optional[str] = None,
    bio: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
) -> User:
    """Update current user profile"""
    updated_user = update_user_profile(
        current_user["id"],
        avatar_url=avatar_url,
        bio=bio
    )
    
    if not updated_user:
        raise HTTPException(status_code=400, detail="Failed to update profile")
    
    updated_user.pop("password", None)
    return updated_user


@router.post("/me/apply-position")
async def apply_position(
    application: PositionApplication,
    current_user: dict = Depends(get_current_user)
) -> User:
    """Apply for a position (requires admin approval)"""
    # Validate position
    valid_positions = ["student", "developer", "hr", "admin"]
    if application.position not in valid_positions:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid position. Must be one of: {', '.join(valid_positions)}"
        )
    
    # Don't allow applying for admin position
    if application.position == "admin":
        raise HTTPException(status_code=400, detail="Cannot apply for admin position")
    
    updated_user = apply_for_position(current_user["id"], application.position)
    
    if not updated_user:
        raise HTTPException(status_code=400, detail="Failed to submit application")
    
    updated_user.pop("password", None)
    return updated_user

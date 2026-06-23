from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime


class UserRole(str):
    """User roles"""
    FREE = "free"
    PREMIUM = "premium"
    ADMIN = "admin"


class UserPosition(str):
    """User positions"""
    GUEST = "guest"
    STUDENT = "student"
    DEVELOPER = "developer"
    HR = "hr"
    ADMIN = "admin"


class UserCreate(BaseModel):
    """User creation model"""
    username: str
    email: str
    password: str
    role: Optional[str] = UserRole.FREE
    position: Optional[str] = UserPosition.GUEST


class UserLogin(BaseModel):
    """User login model"""
    username: str
    password: str


class FirebaseLogin(BaseModel):
    """Firebase login model"""
    id_token: str  # Firebase ID token from client


class User(BaseModel):
    """User model"""
    id: str
    username: str
    email: str
    role: str = UserRole.FREE
    position: str = UserPosition.GUEST
    created_at: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    position_application: Optional[str] = None  # Position user applied for
    position_verified: bool = False  # Whether position is verified by admin

    class Config:
        json_schema_extra = {
            "example": {
                "id": "user123",
                "username": "johndoe",
                "email": "john@example.com",
                "role": "free",
                "position": "guest",
                "created_at": "2024-01-24T10:00:00",
                "avatar_url": "https://example.com/avatar.jpg",
                "bio": "My bio",
                "position_application": None,
                "position_verified": False
            }
        }


class PositionApplication(BaseModel):
    """Position application model"""
    position: str  # Position to apply for


class UserUpdate(BaseModel):
    """User update model for admin"""
    role: Optional[str] = None
    position: Optional[str] = None
    position_verified: Optional[bool] = None


class Token(BaseModel):
    """Token response model"""
    access_token: str
    token_type: str
    user: User


class UserProfile(BaseModel):
    """User profile for public view"""
    id: str
    username: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None

from typing import Optional, List
from pydantic import BaseModel
from datetime import time


class LinkRule(BaseModel):
    """Rules for dynamic link highlighting"""
    rule_type: str  # "time", "location", "user_group"
    value: str  # e.g., "9:00-17:00", "US", "premium"
    priority: int = 0  # Higher priority = more important


class Link(BaseModel):
    """Link model"""
    id: Optional[str] = None
    title: str
    url: str
    description: Optional[str] = None
    icon: Optional[str] = None
    is_active: bool = True
    is_highlighted: bool = False
    rules: List[LinkRule] = []
    click_count: int = 0

    class Config:
        json_schema_extra = {
            "example": {
                "id": "1",
                "title": "My Portfolio",
                "url": "https://example.com",
                "description": "Check out my work",
                "icon": "🎨",
                "is_active": True,
                "is_highlighted": True,
                "rules": [
                    {
                        "rule_type": "time",
                        "value": "9:00-17:00",
                        "priority": 1
                    }
                ],
                "click_count": 42
            }
        }


class Profile(BaseModel):
    """Profile model"""
    id: str
    title: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    links: List[Link] = []
    theme: str = "light"

    class Config:
        json_schema_extra = {
            "example": {
                "id": "user123",
                "title": "John Doe",
                "bio": "Developer & Creator",
                "avatar_url": "https://example.com/avatar.jpg",
                "links": [],
                "theme": "light"
            }
        }


class VisitorContext(BaseModel):
    """Context about the visitor"""
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    timezone: Optional[str] = None
    user_group: Optional[str] = None  # e.g., "free", "premium"
    device_type: Optional[str] = None  # mobile, tablet, desktop


class Analytics(BaseModel):
    """Analytics data"""
    link_id: str
    visitor_context: VisitorContext
    timestamp: str
    referrer: Optional[str] = None

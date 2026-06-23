from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.models.user import User, UserUpdate
from app.routes.auth import get_current_user
from app.auth import (
    get_all_users, delete_user, update_user,
    approve_position_application, reject_position_application
)
from app.database import get_all_profiles, delete_profile

router = APIRouter(prefix="/api/admin", tags=["admin"])


def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Require admin role"""
    if current_user.get("position") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/users")
async def list_all_users(admin: dict = Depends(require_admin)) -> List[dict]:
    """Get all users (admin only)"""
    users = get_all_users()
    # Remove passwords from response
    for user in users:
        user.pop("password", None)
    return users


@router.delete("/users/{user_id}")
async def delete_user_endpoint(user_id: str, admin: dict = Depends(require_admin)) -> dict:
    """Delete user (admin only)"""
    # Prevent admin from deleting themselves
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    # Delete user
    success = delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Also delete user's profile
    delete_profile(user_id)
    
    return {"message": "User deleted successfully", "user_id": user_id}


@router.put("/users/{user_id}")
async def update_user_endpoint(
    user_id: str, 
    user_update: UserUpdate,
    admin: dict = Depends(require_admin)
) -> dict:
    """Update user (admin only)"""
    updated_user = update_user(
        user_id,
        role=user_update.role,
        position=user_update.position,
        position_verified=user_update.position_verified
    )
    
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated_user.pop("password", None)
    return updated_user


@router.post("/users/{user_id}/approve-position")
async def approve_position(user_id: str, admin: dict = Depends(require_admin)) -> dict:
    """Approve user's position application (admin only)"""
    updated_user = approve_position_application(user_id)
    
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found or no pending application")
    
    updated_user.pop("password", None)
    return updated_user


@router.post("/users/{user_id}/reject-position")
async def reject_position(user_id: str, admin: dict = Depends(require_admin)) -> dict:
    """Reject user's position application (admin only)"""
    updated_user = reject_position_application(user_id)
    
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated_user.pop("password", None)
    return updated_user


@router.get("/links/all")
async def get_all_links(admin: dict = Depends(require_admin)) -> dict:
    """Get all links from all profiles (admin only)"""
    profiles = get_all_profiles()
    
    all_links = []
    for profile in profiles:
        for link in profile.get("links", []):
            all_links.append({
                "profile_id": profile["id"],
                "profile_title": profile.get("title", "Unknown"),
                "link_id": link.get("id"),
                "link_title": link.get("title"),
                "link_url": link.get("url"),
                "link_description": link.get("description"),
                "click_count": link.get("click_count", 0),
                "is_active": link.get("is_active", True),
                "rules": link.get("rules", [])
            })
    
    return {
        "total_profiles": len(profiles),
        "total_links": len(all_links),
        "links": all_links
    }


@router.get("/stats")
async def get_admin_stats(admin: dict = Depends(require_admin)) -> dict:
    """Get admin statistics"""
    users = get_all_users()
    profiles = get_all_profiles()
    
    # Count users by role
    role_counts = {}
    position_counts = {}
    pending_applications = 0
    
    for user in users:
        role = user.get("role", "free")
        position = user.get("position", "guest")
        
        role_counts[role] = role_counts.get(role, 0) + 1
        position_counts[position] = position_counts.get(position, 0) + 1
        
        if user.get("position_application"):
            pending_applications += 1
    
    # Count total links
    total_links = sum(len(p.get("links", [])) for p in profiles)
    total_clicks = sum(
        link.get("click_count", 0) 
        for p in profiles 
        for link in p.get("links", [])
    )
    
    return {
        "total_users": len(users),
        "total_profiles": len(profiles),
        "total_links": total_links,
        "total_clicks": total_clicks,
        "pending_applications": pending_applications,
        "users_by_role": role_counts,
        "users_by_position": position_counts
    }

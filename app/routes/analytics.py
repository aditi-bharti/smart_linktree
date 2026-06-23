from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.models.analytics import LinkEngagement, ProfileAnalytics
from app.engagement_tracker import get_profile_engagement, get_link_engagement, reset_engagement
from app.routes.auth import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/profile/{profile_id}")
async def get_profile_analytics(profile_id: str, current_user: dict = Depends(get_current_user)) -> dict:
    """Get analytics for a profile (only owner can access)"""
    # Only allow users to see their own analytics
    if current_user["id"] != profile_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    analytics = get_profile_engagement(profile_id)
    return analytics


@router.get("/link/{profile_id}/{link_id}")
async def get_link_analytics(
    profile_id: str,
    link_id: str,
    current_user: dict = Depends(get_current_user)
) -> dict:
    """Get analytics for a specific link"""
    # Only allow users to see their own analytics
    if current_user["id"] != profile_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    analytics = get_link_engagement(profile_id, link_id)
    return analytics


@router.delete("/reset/{profile_id}")
async def reset_profile_analytics(
    profile_id: str,
    current_user: dict = Depends(get_current_user)
) -> dict:
    """Reset analytics for a profile"""
    # Only allow users to reset their own analytics
    if current_user["id"] != profile_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    reset_engagement(profile_id)
    return {"message": "Analytics reset successfully"}

import json
import os
from typing import Optional, List
from datetime import datetime

ENGAGEMENT_FILE = os.path.join("data", "engagement.json")


def _load_engagement() -> dict:
    """Load engagement data"""
    if os.path.exists(ENGAGEMENT_FILE):
        with open(ENGAGEMENT_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}


def _save_engagement(data: dict):
    """Save engagement data"""
    os.makedirs(os.path.dirname(ENGAGEMENT_FILE), exist_ok=True)
    with open(ENGAGEMENT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def track_link_click(profile_id: str, link_id: str, visitor_id: Optional[str] = None):
    """Track a link click"""
    engagement = _load_engagement()
    
    if profile_id not in engagement:
        engagement[profile_id] = {}
    
    if link_id not in engagement[profile_id]:
        engagement[profile_id][link_id] = {
            "clicks": 0,
            "unique_visitors": set(),
            "last_clicked": None,
            "daily_clicks": {}
        }
    
    engagement[profile_id][link_id]["clicks"] += 1
    engagement[profile_id][link_id]["last_clicked"] = datetime.utcnow().isoformat()
    
    # Track unique visitors
    if visitor_id:
        if not isinstance(engagement[profile_id][link_id]["unique_visitors"], list):
            engagement[profile_id][link_id]["unique_visitors"] = []
        if visitor_id not in engagement[profile_id][link_id]["unique_visitors"]:
            engagement[profile_id][link_id]["unique_visitors"].append(visitor_id)
    
    # Track daily clicks
    today = datetime.utcnow().strftime("%Y-%m-%d")
    if today not in engagement[profile_id][link_id]["daily_clicks"]:
        engagement[profile_id][link_id]["daily_clicks"][today] = 0
    engagement[profile_id][link_id]["daily_clicks"][today] += 1
    
    _save_engagement(engagement)
    
    # Return profile_id so caller can trigger broadcast
    return profile_id


def get_link_engagement(profile_id: str, link_id: str) -> dict:
    """Get engagement data for a specific link"""
    engagement = _load_engagement()
    
    if profile_id in engagement and link_id in engagement[profile_id]:
        data = engagement[profile_id][link_id]
        return {
            "link_id": link_id,
            "clicks": data.get("clicks", 0),
            "unique_visitors": len(data.get("unique_visitors", [])),
            "last_clicked": data.get("last_clicked"),
            "daily_clicks": data.get("daily_clicks", {})
        }
    
    return {
        "link_id": link_id,
        "clicks": 0,
        "unique_visitors": 0,
        "last_clicked": None,
        "daily_clicks": {}
    }


def get_profile_engagement(profile_id: str) -> dict:
    """Get all engagement data for a profile"""
    engagement = _load_engagement()
    
    if profile_id not in engagement:
        return {
            "profile_id": profile_id,
            "total_clicks": 0,
            "total_unique_visitors": 0,
            "links": [],
            "daily_summary": {}
        }
    
    profile_data = engagement[profile_id]
    
    links = []
    total_clicks = 0
    total_visitors = set()
    daily_summary = {}
    
    for link_id, data in profile_data.items():
        clicks = data.get("clicks", 0)
        unique_visitors = data.get("unique_visitors", [])
        
        total_clicks += clicks
        total_visitors.update(unique_visitors if isinstance(unique_visitors, list) else [])
        
        # Aggregate daily clicks
        for day, count in data.get("daily_clicks", {}).items():
            if day not in daily_summary:
                daily_summary[day] = 0
            daily_summary[day] += count
        
        links.append({
            "link_id": link_id,
            "clicks": clicks,
            "unique_visitors": len(unique_visitors) if isinstance(unique_visitors, list) else len(unique_visitors),
            "last_clicked": data.get("last_clicked"),
            "daily_clicks": data.get("daily_clicks", {})
        })
    
    # Sort links by clicks
    links.sort(key=lambda x: x["clicks"], reverse=True)
    
    return {
        "profile_id": profile_id,
        "total_clicks": total_clicks,
        "total_unique_visitors": len(total_visitors),
        "links": links,
        "daily_summary": daily_summary
    }


def reset_engagement(profile_id: str):
    """Reset engagement data for a profile"""
    engagement = _load_engagement()
    if profile_id in engagement:
        del engagement[profile_id]
        _save_engagement(engagement)

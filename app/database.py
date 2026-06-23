import json
import os
from typing import Optional, List
from app.models.link import Profile, Link, Analytics

# Simple file-based database
DATA_DIR = "data"
PROFILES_FILE = os.path.join(DATA_DIR, "profiles.json")
ANALYTICS_FILE = os.path.join(DATA_DIR, "analytics.json")

os.makedirs(DATA_DIR, exist_ok=True)


def _load_json(filepath: str, default=None):
    """Load JSON file"""
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return default or {}


def _save_json(filepath: str, data):
    """Save JSON file"""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def get_profile(profile_id: str) -> Optional[dict]:
    """Get profile by ID"""
    profiles = _load_json(PROFILES_FILE, {})
    return profiles.get(profile_id)


def save_profile(profile: Profile):
    """Save profile"""
    profiles = _load_json(PROFILES_FILE, {})
    profiles[profile.id] = profile.model_dump()
    _save_json(PROFILES_FILE, profiles)


def get_all_profiles() -> List[dict]:
    """Get all profiles"""
    profiles = _load_json(PROFILES_FILE, {})
    return list(profiles.values())


def delete_profile(profile_id: str):
    """Delete profile"""
    profiles = _load_json(PROFILES_FILE, {})
    if profile_id in profiles:
        del profiles[profile_id]
        _save_json(PROFILES_FILE, profiles)


def add_analytics(analytics: Analytics):
    """Add analytics record"""
    records = _load_json(ANALYTICS_FILE, [])
    records.append(analytics.model_dump())
    _save_json(ANALYTICS_FILE, records)


def get_analytics(profile_id: str) -> List[dict]:
    """Get analytics for a profile"""
    records = _load_json(ANALYTICS_FILE, [])
    return [r for r in records if r.get("profile_id") == profile_id]

from typing import Optional
from pydantic import BaseModel


class LinkEngagement(BaseModel):
    """Link engagement metrics"""
    link_id: str
    link_title: str
    icon: Optional[str] = None
    click_count: int = 0
    click_rate: float = 0.0
    unique_visitors: int = 0
    last_clicked: Optional[str] = None


class ProfileAnalytics(BaseModel):
    """Profile analytics summary"""
    profile_id: str
    total_clicks: int = 0
    total_visitors: int = 0
    top_link: Optional[dict] = None
    link_engagement: list = []
    engagement_data: dict = {}

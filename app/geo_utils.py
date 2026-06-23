import requests
from typing import Optional, Tuple


def get_visitor_location(ip_address: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Get country and city from IP address using ip-api.com
    Returns: (country_code, city)
    """
    try:
        # Using free IP geolocation service
        response = requests.get(
            f"http://ip-api.com/json/{ip_address}",
            timeout=2
        )
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "success":
                return data.get("countryCode"), data.get("city")
    except Exception as e:
        print(f"Error getting location for IP {ip_address}: {e}")

    return None, None


def get_client_ip(request) -> str:
    """Extract client IP from request"""
    # Check X-Forwarded-For header first (for proxies)
    if request.headers.get("x-forwarded-for"):
        return request.headers.get("x-forwarded-for").split(",")[0].strip()

    # Fall back to client host
    return request.client.host if request.client else "127.0.0.1"


def detect_device_type(user_agent: str) -> str:
    """Detect device type from user agent"""
    if not user_agent:
        return "desktop"
    
    ua_lower = user_agent.lower()

    if "mobile" in ua_lower or "android" in ua_lower or "iphone" in ua_lower:
        return "mobile"
    elif "tablet" in ua_lower or "ipad" in ua_lower:
        return "tablet"
    else:
        return "desktop"

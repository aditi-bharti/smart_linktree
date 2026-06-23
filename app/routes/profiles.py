from typing import List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request

from app.database import delete_profile, get_all_profiles, get_profile, save_profile
from app.engagement_tracker import get_profile_engagement, track_link_click
from app.geo_utils import detect_device_type, get_client_ip, get_visitor_location
from app.models.link import Link, LinkRule, Profile, VisitorContext
from app.routes.auth import get_current_user
from app.rules_engine import RulesEngine
from app.websocket_manager import manager

router = APIRouter(prefix="/api/profiles", tags=["profiles"])


@router.get("/")
async def list_profiles() -> List[Profile]:
    """List all profiles"""
    profiles_data = get_all_profiles()
    return [Profile(**p) for p in profiles_data]


# ============ PROTECTED ROUTES FOR AUTHENTICATED USERS (must come BEFORE /{profile_id} routes) ============


@router.get("/me/dashboard")
async def get_my_dashboard(current_user: dict = Depends(get_current_user)) -> dict:
    """Get current user's dashboard with their profile and links"""
    profile_data = get_profile(current_user["id"])

    if not profile_data:
        # Create default profile for new user
        avatar_seed = current_user.get("username", current_user["id"])
        default_avatar_url = (
            f"https://api.dicebear.com/7.x/bottts/svg?seed={avatar_seed}"
        )

        default_profile = Profile(
            id=current_user["id"],
            title=current_user.get("username", ""),
            bio=current_user.get("bio"),
            avatar_url=current_user.get("avatar_url") or default_avatar_url,
            links=[],
        )
        save_profile(default_profile)
        return {"profile": default_profile.model_dump(), "user": current_user}

    profile = Profile(**profile_data)
    return {"profile": profile.model_dump(), "user": current_user}


@router.post("/me/profile")
async def update_my_profile(
    profile: Profile, current_user: dict = Depends(get_current_user)
) -> Profile:
    """Update current user's profile"""
    profile.id = current_user["id"]
    save_profile(profile)
    return profile


@router.post("/me/links")
async def add_my_link(
    link: Link, current_user: dict = Depends(get_current_user)
) -> dict:
    """Add link to current user's profile"""
    try:
        profile_data = get_profile(current_user["id"])

        if not profile_data:
            profile_data = {
                "id": current_user["id"],
                "title": current_user.get("username", ""),
                "bio": None,
                "avatar_url": None,
                "links": [],
                "theme": "light",
            }

        # Convert existing links to Link objects for proper handling
        existing_links = []
        for link_data in profile_data.get("links", []):
            if isinstance(link_data, dict):
                # Convert rules
                rules = [
                    LinkRule(**r) if isinstance(r, dict) else r
                    for r in link_data.get("rules", [])
                ]
                link_data["rules"] = rules
                existing_links.append(Link(**link_data))
            else:
                existing_links.append(link_data)

        # Create profile with existing links
        profile = Profile(
            id=current_user["id"],
            title=profile_data.get("title", ""),
            bio=profile_data.get("bio"),
            avatar_url=profile_data.get("avatar_url"),
            links=existing_links,
            theme=profile_data.get("theme", "light"),
        )

        # Add new link
        if not link.id:
            link.id = f"link_{len(profile.links) + 1}"

        profile.links.append(link)
        save_profile(profile)

        # Return the updated profile
        return profile.model_dump()
    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/me/links/{link_id}")
async def update_my_link(
    link_id: str, link: Link, current_user: dict = Depends(get_current_user)
) -> Profile:
    """Update link in current user's profile"""
    profile_data = get_profile(current_user["id"])

    if not profile_data:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile = Profile(**profile_data)

    link_found = False
    for i, existing_link in enumerate(profile.links):
        if existing_link.id == link_id:
            link.id = link_id
            profile.links[i] = link
            link_found = True
            break

    if not link_found:
        raise HTTPException(status_code=404, detail="Link not found")

    save_profile(profile)
    return profile


@router.delete("/me/links/{link_id}")
async def delete_my_link(
    link_id: str, current_user: dict = Depends(get_current_user)
) -> Profile:
    """Delete link from current user's profile"""
    profile_data = get_profile(current_user["id"])

    if not profile_data:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile = Profile(**profile_data)
    profile.links = [link for link in profile.links if link.id != link_id]
    save_profile(profile)
    return profile


@router.post("/{profile_id}/track-click/{link_id}")
async def track_link_click_endpoint(
    profile_id: str, link_id: str, visitor_id: str = Query(default=None)
) -> dict:
    """Track a link click (public endpoint)"""
    track_link_click(profile_id, link_id, visitor_id or "anonymous")

    # Broadcast real-time update to connected WebSocket clients
    analytics = get_profile_engagement(profile_id)
    await manager.broadcast_to_profile(
        profile_id, {"type": "update", "data": analytics}
    )

    return {"status": "tracked"}


# ============ PUBLIC ROUTES (less specific, come after /me/* routes) ============


@router.get("/{profile_id}")
async def get_profile_public(
    profile_id: str, request: Request, user_group: str = None
) -> dict:
    """Get public profile with dynamic link highlighting"""
    profile_data = get_profile(profile_id)

    if not profile_data:
        raise HTTPException(status_code=404, detail="Profile not found")

    try:
        # Build visitor context
        user_agent = request.headers.get("user-agent", "")
        ip_address = get_client_ip(request)
        country, city = get_visitor_location(ip_address)
        device_type = detect_device_type(user_agent)

        visitor_context = VisitorContext(
            user_agent=user_agent,
            ip_address=ip_address,
            country=country,
            city=city,
            device_type=device_type,
            user_group=user_group,
        )

        # Convert profile data to profile object with proper Link and LinkRule conversion
        profile_data_copy = profile_data.copy()
        links = []
        for link_data in profile_data_copy.get("links", []):
            # Convert rules to LinkRule objects
            rules = [LinkRule(**rule) for rule in link_data.get("rules", [])]
            link_data["rules"] = rules
            links.append(Link(**link_data))

        profile_data_copy["links"] = links
        profile = Profile(**profile_data_copy)

        # Process links with rules
        processed_links = RulesEngine.process_links(profile.links, visitor_context)
        profile.links = processed_links

        return {
            "profile": profile.model_dump(),
            "visitor_context": visitor_context.model_dump(),
        }
    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
async def create_profile(profile: Profile) -> Profile:
    """Create a new profile"""
    if not profile.id:
        raise HTTPException(status_code=400, detail="Profile ID is required")

    if get_profile(profile.id):
        raise HTTPException(status_code=400, detail="Profile ID already exists")

    save_profile(profile)
    return profile


@router.put("/{profile_id}")
async def update_profile(profile_id: str, profile: Profile) -> Profile:
    """Update a profile"""
    existing = get_profile(profile_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile.id = profile_id
    save_profile(profile)
    return profile


@router.delete("/{profile_id}")
async def delete_profile_route(profile_id: str) -> dict:
    """Delete a profile"""
    existing = get_profile(profile_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Profile not found")

    delete_profile(profile_id)
    return {"message": "Profile deleted successfully"}


@router.post("/{profile_id}/links")
async def add_link(profile_id: str, link: Link) -> Profile:
    """Add a link to profile"""
    profile_data = get_profile(profile_id)
    if not profile_data:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile = Profile(**profile_data)

    # Generate link ID if not provided
    if not link.id:
        link.id = f"link_{len(profile.links) + 1}"

    profile.links.append(link)
    save_profile(profile)
    return profile


@router.delete("/{profile_id}/links/{link_id}")
async def remove_link(profile_id: str, link_id: str) -> Profile:
    """Remove a link from profile"""
    profile_data = get_profile(profile_id)
    if not profile_data:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile = Profile(**profile_data)
    profile.links = [link for link in profile.links if link.id != link_id]
    save_profile(profile)
    return profile


@router.put("/{profile_id}/links/{link_id}")
async def update_link(profile_id: str, link_id: str, link: Link) -> Profile:
    """Update a link in profile"""
    profile_data = get_profile(profile_id)
    if not profile_data:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile = Profile(**profile_data)

    # Find and update link
    link_found = False
    for i, existing_link in enumerate(profile.links):
        if existing_link.id == link_id:
            link.id = link_id
            profile.links[i] = link
            link_found = True
            break

    if not link_found:
        raise HTTPException(status_code=404, detail="Link not found")

    save_profile(profile)
    return profile


# ============ ROLE-BASED TESTING AND PREVIEW ENDPOINTS ============


@router.get("/{profile_id}/preview/{role}")
async def preview_profile_as_role(
    profile_id: str,
    role: str,
    request: Request,
    country: Optional[str] = None,
    device: Optional[str] = None,
) -> dict:
    """Preview how a profile looks for a specific role/user group"""
    profile_data = get_profile(profile_id)

    if not profile_data:
        raise HTTPException(status_code=404, detail="Profile not found")

    try:
        # Build visitor context with specified role
        user_agent = request.headers.get("user-agent", "")
        ip_address = get_client_ip(request)

        # Use provided country or detect from IP
        if country:
            visitor_country = country
            visitor_city = None
        else:
            visitor_country, visitor_city = get_visitor_location(ip_address)

        # Use provided device type or detect from user agent
        if device:
            device_type = device
        else:
            device_type = detect_device_type(user_agent)

        visitor_context = VisitorContext(
            user_agent=user_agent,
            ip_address=ip_address,
            country=visitor_country,
            city=visitor_city,
            device_type=device_type,
            user_group=role,
        )

        # Convert profile data to profile object
        profile_data_copy = profile_data.copy()
        links = []
        for link_data in profile_data_copy.get("links", []):
            rules = [LinkRule(**rule) for rule in link_data.get("rules", [])]
            link_data["rules"] = rules
            links.append(Link(**link_data))

        profile_data_copy["links"] = links
        profile = Profile(**profile_data_copy)

        # Process links with rules
        processed_links = RulesEngine.process_links(profile.links, visitor_context)
        profile.links = processed_links

        # Get role-specific links
        role_specific_links = RulesEngine.get_role_based_links(
            profile.links, role, include_fallbacks=True
        )

        # Get role summary
        role_summary = RulesEngine.get_user_role_summary(visitor_context)

        return {
            "profile": profile.model_dump(),
            "visitor_context": visitor_context.model_dump(),
            "role_summary": role_summary,
            "role_specific_links": [link.model_dump() for link in role_specific_links],
            "highlighted_count": len(
                [link for link in processed_links if link.is_highlighted]
            ),
            "total_links": len(profile.links),
        }
    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{profile_id}/roles/summary")
async def get_profile_role_summary(profile_id: str) -> dict:
    """Get summary of how profile appears to different roles"""
    profile_data = get_profile(profile_id)

    if not profile_data:
        raise HTTPException(status_code=404, detail="Profile not found")

    try:
        # Convert profile data
        profile_data_copy = profile_data.copy()
        links = []
        for link_data in profile_data_copy.get("links", []):
            rules = [LinkRule(**rule) for rule in link_data.get("rules", [])]
            link_data["rules"] = rules
            links.append(Link(**link_data))

        profile_data_copy["links"] = links
        profile = Profile(**profile_data_copy)

        # Test different roles
        roles_to_test = [
            "guest",
            "free",
            "premium",
            "admin",
            "student",
            "developer",
            "hr",
        ]
        role_results = {}

        for role in roles_to_test:
            # Create mock visitor context
            mock_context = VisitorContext(
                user_group=role, country="US", device_type="desktop"
            )

            # Process links for this role
            processed_links = RulesEngine.process_links(
                profile.links.copy(), mock_context
            )
            role_specific_links = RulesEngine.get_role_based_links(
                processed_links, role, True
            )

            role_results[role] = {
                "total_links": len(processed_links),
                "highlighted_links": len(
                    [link for link in processed_links if link.is_highlighted]
                ),
                "role_specific_links": len(
                    [
                        link
                        for link in role_specific_links
                        if any(
                            rule.rule_type in ["user_group", "role_hierarchy"]
                            and RulesEngine.evaluate_rule(rule, mock_context)
                            for rule in link.rules
                        )
                    ]
                ),
                "accessible_links": [
                    {
                        "id": link.id,
                        "title": link.title,
                        "is_highlighted": link.is_highlighted,
                        "applicable_rules": [
                            rule.rule_type
                            for rule in link.rules
                            if RulesEngine.evaluate_rule(rule, mock_context)
                        ],
                    }
                    for link in role_specific_links[:5]  # First 5 for preview
                ],
            }

        return {
            "profile_id": profile_id,
            "profile_title": profile.title,
            "total_links": len(profile.links),
            "role_breakdown": role_results,
            "recommendations": {
                "has_guest_fallbacks": any(
                    not link.rules
                    or any(rule.rule_type != "user_group" for rule in link.rules)
                    for link in profile.links
                ),
                "roles_with_content": [
                    role
                    for role, data in role_results.items()
                    if data["highlighted_links"] > 0 or data["role_specific_links"] > 0
                ],
                "roles_without_content": [
                    role
                    for role, data in role_results.items()
                    if data["highlighted_links"] == 0
                    and data["role_specific_links"] == 0
                ],
            },
        }
    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{profile_id}/test-rules")
async def test_profile_rules(profile_id: str, test_contexts: List[dict]) -> dict:
    """Test profile rules against multiple visitor contexts"""
    profile_data = get_profile(profile_id)

    if not profile_data:
        raise HTTPException(status_code=404, detail="Profile not found")

    try:
        # Convert profile data
        profile_data_copy = profile_data.copy()
        links = []
        for link_data in profile_data_copy.get("links", []):
            rules = [LinkRule(**rule) for rule in link_data.get("rules", [])]
            link_data["rules"] = rules
            links.append(Link(**link_data))

        profile_data_copy["links"] = links
        profile = Profile(**profile_data_copy)

        test_results = []

        for i, context_data in enumerate(test_contexts):
            try:
                # Create visitor context from test data
                visitor_context = VisitorContext(**context_data)

                # Process links
                processed_links = RulesEngine.process_links(
                    profile.links.copy(), visitor_context
                )

                # Get role summary
                role_summary = RulesEngine.get_user_role_summary(visitor_context)

                test_results.append(
                    {
                        "test_case": i + 1,
                        "input_context": context_data,
                        "role_summary": role_summary,
                        "results": {
                            "total_links": len(processed_links),
                            "highlighted_links": len(
                                [
                                    link
                                    for link in processed_links
                                    if link.is_highlighted
                                ]
                            ),
                            "highlighted_link_titles": [
                                link.title
                                for link in processed_links
                                if link.is_highlighted
                            ],
                            "first_5_links": [
                                {
                                    "title": link.title,
                                    "is_highlighted": link.is_highlighted,
                                    "matched_rules": [
                                        f"{rule.rule_type}:{rule.value}"
                                        for rule in link.rules
                                        if RulesEngine.evaluate_rule(
                                            rule, visitor_context
                                        )
                                    ],
                                }
                                for link in processed_links[:5]
                            ],
                        },
                    }
                )
            except Exception as e:
                test_results.append(
                    {"test_case": i + 1, "input_context": context_data, "error": str(e)}
                )

        return {
            "profile_id": profile_id,
            "total_tests": len(test_contexts),
            "successful_tests": len([r for r in test_results if "error" not in r]),
            "test_results": test_results,
        }
    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

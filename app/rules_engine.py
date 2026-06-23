from datetime import datetime
from typing import List, Optional, Dict, Set
from app.models.link import Link, VisitorContext, LinkRule
import re


class RulesEngine:
    """Dynamic rules engine for highlighting links"""

    @staticmethod
    def evaluate_time_rule(rule_value: str) -> bool:
        """
        Evaluate time-based rule
        Format: "HH:MM-HH:MM" (24-hour format)
        """
        try:
            current_time = datetime.now().time()
            start_str, end_str = rule_value.split("-")
            start_time = datetime.strptime(start_str.strip(), "%H:%M").time()
            end_time = datetime.strptime(end_str.strip(), "%H:%M").time()

            if start_time <= end_time:
                return start_time <= current_time <= end_time
            else:
                # Handle overnight ranges (e.g., 22:00-06:00)
                return current_time >= start_time or current_time <= end_time
        except:
            return False

    @staticmethod
    def evaluate_location_rule(rule_value: str, visitor_context: Optional[VisitorContext]) -> bool:
        """
        Evaluate location-based rule
        Format: "country_code" or "country_code,city"
        """
        if not visitor_context or not visitor_context.country:
            return False

        rule_parts = rule_value.split(",")
        country = rule_parts[0].strip().upper()

        if visitor_context.country.upper() != country:
            return False

        if len(rule_parts) > 1 and visitor_context.city:
            city = rule_parts[1].strip()
            return visitor_context.city.lower() == city.lower()

        return True

    @staticmethod
    def evaluate_user_group_rule(rule_value: str, visitor_context: Optional[VisitorContext]) -> bool:
        """
        Evaluate user group rule
        Format: "group_name" or "group1,group2" or "!group_name" (exclusion) or "group_name&premium" (AND logic)
        """
        if not visitor_context or not visitor_context.user_group:
            return False

        # Handle multiple rule types
        return RulesEngine._evaluate_complex_user_rule(rule_value, visitor_context.user_group)

    @staticmethod
    def _evaluate_complex_user_rule(rule_value: str, user_group: str) -> bool:
        """
        Evaluate complex user group rules with AND, OR, and NOT logic
        Examples:
        - "premium" -> user must be premium
        - "premium,admin" -> user must be premium OR admin
        - "!guest" -> user must NOT be guest
        - "developer&premium" -> user must be developer AND premium (requires additional context)
        - "student|developer" -> user must be student OR developer
        """
        user_group_lower = user_group.lower()

        # Handle NOT logic (exclusion)
        if rule_value.startswith("!"):
            excluded_group = rule_value[1:].strip().lower()
            return user_group_lower != excluded_group

        # Handle AND logic
        if "&" in rule_value:
            required_groups = [g.strip().lower() for g in rule_value.split("&")]
            # For now, just check if user_group matches any (can be enhanced with multiple user attributes)
            return user_group_lower in required_groups

        # Handle OR logic (comma or pipe separated)
        if "," in rule_value or "|" in rule_value:
            separator = "," if "," in rule_value else "|"
            allowed_groups = [g.strip().lower() for g in rule_value.split(separator)]
            return user_group_lower in allowed_groups

        # Simple equality check
        return user_group_lower == rule_value.lower()

    @staticmethod
    def evaluate_day_rule(rule_value: str) -> bool:
        """
        Evaluate day of week rule
        Format: "MON", "TUE", "WED", etc. (comma-separated for multiple days)
        """
        days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
        current_day = days[datetime.now().weekday()]

        rule_days = [d.strip().upper() for d in rule_value.split(",")]
        return current_day in rule_days

    @staticmethod
    def evaluate_device_rule(rule_value: str, visitor_context: Optional[VisitorContext]) -> bool:
        """
        Evaluate device type rule
        Format: "mobile", "tablet", "desktop"
        """
        if not visitor_context or not visitor_context.device_type:
            return False

        return visitor_context.device_type.lower() == rule_value.lower()

    @staticmethod
    def evaluate_role_hierarchy_rule(rule_value: str, visitor_context: Optional[VisitorContext]) -> bool:
        """
        Evaluate role hierarchy rules
        Format: "min:role_name" (minimum role required) or "max:role_name" (maximum role allowed)
        Role hierarchy: guest < free < premium < admin
        """
        if not visitor_context or not visitor_context.user_group:
            return False

        role_hierarchy = {"guest": 0, "free": 1, "premium": 2, "admin": 3}
        user_role_level = role_hierarchy.get(visitor_context.user_group.lower(), 0)

        if rule_value.startswith("min:"):
            required_role = rule_value[4:].strip().lower()
            required_level = role_hierarchy.get(required_role, 0)
            return user_role_level >= required_level
        elif rule_value.startswith("max:"):
            max_role = rule_value[4:].strip().lower()
            max_level = role_hierarchy.get(max_role, 3)
            return user_role_level <= max_level

        return False

    @staticmethod
    def evaluate_user_attribute_rule(rule_value: str, visitor_context: Optional[VisitorContext]) -> bool:
        """
        Evaluate user attribute rules (can be extended for custom user properties)
        Format: "attribute:value" or "attribute:regex:pattern"
        """
        if not visitor_context:
            return False

        if ":" not in rule_value:
            return False

        parts = rule_value.split(":", 2)
        attribute = parts[0].lower()

        if len(parts) == 2:
            # Simple equality: "country:US"
            expected_value = parts[1].lower()
            if attribute == "country" and visitor_context.country:
                return visitor_context.country.lower() == expected_value
            elif attribute == "city" and visitor_context.city:
                return visitor_context.city.lower() == expected_value
            elif attribute == "device" and visitor_context.device_type:
                return visitor_context.device_type.lower() == expected_value
        elif len(parts) == 3 and parts[1] == "regex":
            # Regex matching: "user_agent:regex:.*Mobile.*"
            pattern = parts[2]
            if attribute == "user_agent" and visitor_context.user_agent:
                return bool(re.search(pattern, visitor_context.user_agent, re.IGNORECASE))

        return False

    @staticmethod
    def evaluate_rule(
        rule: LinkRule,
        visitor_context: Optional[VisitorContext] = None
    ) -> bool:
        """Evaluate a single rule"""
        if rule.rule_type == "time":
            return RulesEngine.evaluate_time_rule(rule.value)
        elif rule.rule_type == "location":
            return RulesEngine.evaluate_location_rule(rule.value, visitor_context)
        elif rule.rule_type == "user_group":
            return RulesEngine.evaluate_user_group_rule(rule.value, visitor_context)
        elif rule.rule_type == "day":
            return RulesEngine.evaluate_day_rule(rule.value)
        elif rule.rule_type == "device":
            return RulesEngine.evaluate_device_rule(rule.value, visitor_context)
        elif rule.rule_type == "role_hierarchy":
            return RulesEngine.evaluate_role_hierarchy_rule(rule.value, visitor_context)
        elif rule.rule_type == "user_attribute":
            return RulesEngine.evaluate_user_attribute_rule(rule.value, visitor_context)
        return False

    @staticmethod
    def evaluate_link(
        link: Link,
        visitor_context: Optional[VisitorContext] = None
    ) -> bool:
        """
        Evaluate if a link should be highlighted
        Returns True if any rule matches (OR logic)
        If no rules exist, return False
        """
        if not link.rules:
            return False

        for rule in link.rules:
            if RulesEngine.evaluate_rule(rule, visitor_context):
                return True

        return False

    @staticmethod
    def process_links(
        links: List[Link],
        visitor_context: Optional[VisitorContext] = None
    ) -> List[Link]:
        """Process all links and apply highlighting rules"""
        processed_links = []

        for link in links:
            link.is_highlighted = RulesEngine.evaluate_link(link, visitor_context)
            processed_links.append(link)

        # Sort by priority: highlighted first, then by priority if specified
        processed_links.sort(
            key=lambda x: (
                not x.is_highlighted,
                -(max([r.priority for r in x.rules], default=0)) if x.rules else 0
            )
        )

        return processed_links

    @staticmethod
    def get_role_based_links(
        links: List[Link],
        visitor_role: Optional[str] = None,
        include_fallbacks: bool = True
    ) -> List[Link]:
        """
        Get links specifically filtered for a role
        """
        if not visitor_role:
            visitor_role = "guest"

        role_specific_links = []
        fallback_links = []

        for link in links:
            has_role_rule = False
            matches_role = False

            for rule in link.rules:
                if rule.rule_type in ["user_group", "role_hierarchy"]:
                    has_role_rule = True
                    if rule.rule_type == "user_group":
                        matches_role = RulesEngine._evaluate_complex_user_rule(rule.value, visitor_role)
                    elif rule.rule_type == "role_hierarchy":
                        # Create mock visitor context for evaluation
                        mock_context = VisitorContext(user_group=visitor_role)
                        matches_role = RulesEngine.evaluate_role_hierarchy_rule(rule.value, mock_context)

                    if matches_role:
                        break

            if matches_role:
                role_specific_links.append(link)
            elif not has_role_rule and include_fallbacks:
                fallback_links.append(link)

        # Return role-specific links first, then fallbacks
        return role_specific_links + fallback_links

    @staticmethod
    def get_user_role_summary(visitor_context: Optional[VisitorContext]) -> Dict[str, any]:
        """
        Get a summary of the user's role and applicable rules
        """
        if not visitor_context:
            return {
                "role": "guest",
                "role_level": 0,
                "can_access": ["public", "guest"],
                "restricted_from": ["premium", "admin"]
            }

        role_hierarchy = {"guest": 0, "free": 1, "premium": 2, "admin": 3}
        user_role = visitor_context.user_group or "guest"
        role_level = role_hierarchy.get(user_role.lower(), 0)

        # Determine accessible and restricted content
        accessible_roles = []
        restricted_roles = []

        for role, level in role_hierarchy.items():
            if level <= role_level:
                accessible_roles.append(role)
            else:
                restricted_roles.append(role)

        return {
            "role": user_role,
            "role_level": role_level,
            "can_access": accessible_roles,
            "restricted_from": restricted_roles,
            "location": {
                "country": visitor_context.country,
                "city": visitor_context.city
            },
            "device": visitor_context.device_type,
            "detected_attributes": {
                "has_location": bool(visitor_context.country),
                "has_device_info": bool(visitor_context.device_type),
                "is_authenticated": user_role != "guest"
            }
        }

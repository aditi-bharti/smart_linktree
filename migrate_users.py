#!/usr/bin/env python3
"""
Migration script to add position_application and position_verified fields to existing users
"""

import json
import os

USERS_FILE = "data/users.json"

def migrate_users():
    """Add new fields to existing users"""
    if not os.path.exists(USERS_FILE):
        print("❌ Users file not found!")
        return
    
    with open(USERS_FILE, 'r', encoding='utf-8') as f:
        users = json.load(f)
    
    updated_count = 0
    for user_id, user_data in users.items():
        # Add position_application if not exists
        if 'position_application' not in user_data:
            user_data['position_application'] = None
            updated_count += 1
        
        # Add position_verified if not exists
        if 'position_verified' not in user_data:
            # If user has admin position, mark as verified
            if user_data.get('position') == 'admin':
                user_data['position_verified'] = True
            else:
                user_data['position_verified'] = False
            updated_count += 1
    
    # Save updated users
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Migration complete! Updated {updated_count} fields across {len(users)} users.")
    print(f"📊 Total users: {len(users)}")
    
    # Show admin users
    admin_users = [u for u in users.values() if u.get('position') == 'admin']
    print(f"🛡️  Admin users: {len(admin_users)}")
    for admin in admin_users:
        print(f"   - {admin['username']} ({admin['email']})")

if __name__ == "__main__":
    migrate_users()

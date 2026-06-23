# Admin Features & Position Application System

## Overview
The Smart LinkTree platform now includes a comprehensive admin panel and position application system that allows administrators to manage users and approve position requests.

## Features Implemented

### 1. Admin Panel (Admin Users Only)

#### Access
- Only users with `position: "admin"` can access the admin panel
- Admin panel appears as a new tab in the dashboard sidebar (🛡️ Admin Panel)

#### Admin Capabilities

**User Management:**
- ✅ View all users with their details (username, email, role, position)
- ✅ Edit user roles (free, premium, admin)
- ✅ Edit user positions (guest, student, developer, hr, admin)
- ✅ Mark positions as verified/unverified
- ✅ Delete users (except yourself)
- ✅ Search users by username or email

**Position Applications:**
- ✅ View pending position applications
- ✅ Approve position applications (changes user's position and marks as verified)
- ✅ Reject position applications (clears the application)

**Platform Overview:**
- ✅ View all links across all profiles
- ✅ See link statistics (clicks, rules, descriptions)
- ✅ Platform statistics dashboard:
  - Total users
  - Total links
  - Total clicks
  - Pending applications
  - Users by role breakdown
  - Users by position breakdown

### 2. Position Application System (All Users)

#### How It Works

**For Regular Users:**
1. Go to Dashboard → Edit Profile
2. Scroll to "Position Application" section
3. Select desired position (Student, Developer, or HR)
4. Submit application
5. Wait for admin approval

**Position Status Indicators:**
- 👤 **Guest** - Default position, can apply for positions
- ⏳ **Application Pending** - Waiting for admin review
- ✓ **Position Verified** - Position approved by admin
- ⚠️ **Position Not Verified** - Has position but not verified
- 🛡️ **Administrator** - Full admin access

**Available Positions:**
- 🎓 Student
- 💻 Developer
- 👔 HR
- 🛡️ Admin (cannot be applied for, must be assigned by admin)

### 3. Link Visibility Rules

Links can now be configured with position-based rules:
- Links with `user_group` rules will only show to users with matching positions
- Admin users can see ALL links regardless of rules
- Verified positions get access to position-specific content

## API Endpoints

### Admin Endpoints (Require Admin Position)

```
GET    /api/admin/users                    - List all users
DELETE /api/admin/users/{user_id}          - Delete user
PUT    /api/admin/users/{user_id}          - Update user (role, position, verified)
POST   /api/admin/users/{user_id}/approve-position - Approve position application
POST   /api/admin/users/{user_id}/reject-position  - Reject position application
GET    /api/admin/links/all                - Get all links from all profiles
GET    /api/admin/stats                    - Get platform statistics
```

### User Endpoints

```
POST   /api/auth/me/apply-position         - Apply for a position
```

## Database Schema Updates

### User Model
```json
{
  "id": "user_xxx",
  "username": "john_doe",
  "email": "john@example.com",
  "role": "free",
  "position": "guest",
  "position_application": null,        // NEW: Position user applied for
  "position_verified": false,          // NEW: Whether position is verified
  "created_at": "2026-01-27T...",
  "avatar_url": "...",
  "bio": "..."
}
```

## Usage Guide

### For Administrators

1. **Login as Admin:**
   - Use credentials: username=`demo`, password=`demo123`
   - Or any account with `position: "admin"`

2. **Access Admin Panel:**
   - Go to Dashboard
   - Click "🛡️ Admin Panel" in sidebar

3. **Manage Users:**
   - View all users in the User Management section
   - Click "Edit" to change role/position
   - Click "Approve" to approve pending applications
   - Click "Reject" to reject applications
   - Click "Delete" to remove users

4. **View All Links:**
   - Scroll to "All Links Across Platform" section
   - See all links from all users with click statistics

### For Regular Users

1. **Apply for Position:**
   - Go to Dashboard → Edit Profile
   - Scroll to "Position Application" section
   - Select desired position
   - Click "Submit Application"

2. **Check Application Status:**
   - Status will show in the Position Application section
   - Possible statuses:
     - Pending (waiting for admin)
     - Verified (approved)
     - Not Verified (needs verification)

3. **Access Position-Specific Links:**
   - Once verified, you can access links with matching position rules
   - Create links with position-based rules for targeted audiences

## Security Features

- ✅ Admin endpoints protected with position check
- ✅ Users cannot delete themselves
- ✅ Users cannot apply for admin position
- ✅ JWT token authentication required for all protected routes
- ✅ Position verification prevents unauthorized access

## Files Modified/Created

### New Files:
- `app/routes/admin.py` - Admin API endpoints
- `migrate_users.py` - Database migration script
- `ADMIN_FEATURES.md` - This documentation

### Modified Files:
- `app/models/user.py` - Added position_application and position_verified fields
- `app/auth.py` - Added admin helper functions
- `app/routes/auth.py` - Added position application endpoint
- `app/main.py` - Registered admin routes
- `app/static/dashboard.html` - Added admin panel and position application UI
- `app/static/dashboard.js` - Added admin and position application functions
- `app/static/styles.css` - Added admin panel and position application styles
- `data/users.json` - Migrated with new fields

## Testing

### Test Admin Features:
1. Login as demo user (username: `demo`, password: `demo123`)
2. Navigate to Admin Panel
3. Try editing a user's role/position
4. View all links across platform

### Test Position Application:
1. Create a new account or login as non-admin user
2. Go to Edit Profile
3. Apply for a position (e.g., Developer)
4. Login as admin and approve the application
5. Login back as the user to see verified status

## Current Admin Users

After migration, the following users have admin access:
- **demo** (demo@example.com) - Position: admin, Verified: true

## Next Steps

To make more users admins:
1. Login as existing admin
2. Go to Admin Panel
3. Find the user
4. Click "Edit"
5. Change Position to "admin"
6. Check "Position Verified"
7. Save changes

## Server Status

✅ Server running on http://localhost:8000
✅ All features deployed and ready to use

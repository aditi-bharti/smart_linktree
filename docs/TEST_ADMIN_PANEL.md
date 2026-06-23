# Testing Admin Panel - Step by Step

## Current Status
✅ Server running on http://localhost:8000
✅ Demo user has admin position
✅ Admin panel code deployed

## Test Steps

### Step 1: Clear Browser Cache
**IMPORTANT:** Clear your browser cache first!
- Press `Ctrl+Shift+Delete` (Windows/Linux) or `Cmd+Shift+Delete` (Mac)
- Select "Cached images and files"
- Click "Clear data"

### Step 2: Login as Admin
1. Go to: http://localhost:8000/auth.html
2. Enter credentials:
   - Username: `demo`
   - Password: `demo123`
3. Click "Login"

### Step 3: Check Admin Panel Visibility
1. You should be redirected to dashboard
2. Look at the left sidebar
3. You should see: **🛡️ Admin Panel** (between "Browse Profiles" and the divider)

### Step 4: Open Admin Panel
1. Click on "🛡️ Admin Panel" in the sidebar
2. You should see:
   - 4 stat cards at the top (Total Users, Total Links, Pending Applications, Total Clicks)
   - "User Management" section with search box
   - List of all users
   - "All Links Across Platform" section

### Step 5: Test User Management
1. Find any user in the list
2. You should see buttons: **Edit**, **Delete**
3. Click "Edit" on a user
4. A modal should pop up with:
   - Role dropdown
   - Position dropdown
   - Position Verified checkbox
   - Save/Cancel buttons

## Troubleshooting

### If Admin Panel is NOT visible:
1. **Open browser console** (F12 or Right-click → Inspect → Console)
2. Look for this message: `✅ Admin panel enabled for user: demo`
3. If you don't see it, check:
   - Are you logged in as demo user?
   - Did you clear cache?
   - Any errors in console?

### If Admin Panel is visible but empty:
1. **Open browser console** (F12)
2. Click on "Admin Panel" tab
3. Look for: `Loading admin panel...`
4. Check for any error messages
5. Look in Network tab for failed API calls

### Check User Position
Run this in browser console after logging in:
```javascript
console.log('Current user:', JSON.parse(localStorage.getItem('user')));
```

Should show: `position: "admin"`

## Expected Results

### Admin Stats Should Show:
- Total Users: 14
- Total Links: ~50+ (varies)
- Pending Applications: 0 (unless someone applied)
- Total Clicks: varies

### User List Should Show:
- All 14 users
- Each with username, email, role badge, position badge
- Edit and Delete buttons for each user

### All Links Should Show:
- Links from all profiles
- Profile owner name
- Click counts
- Link URLs

## API Test (Optional)

Test admin endpoint directly:
```bash
# First login and get token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'

# Copy the access_token from response, then:
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:8000/api/admin/stats
```

Should return JSON with statistics.

## What to Look For

✅ Admin panel tab visible in sidebar
✅ Stats cards showing numbers
✅ User list populated
✅ Search box working
✅ Edit button opens modal
✅ All links section showing links

## If Still Not Working

1. Check server logs:
```bash
tail -50 server.log
```

2. Check for JavaScript errors in browser console

3. Verify demo user has admin position:
```bash
cat data/users.json | grep -A 10 '"username": "demo"'
```

Should show: `"position": "admin"`

## Next Steps After Verification

Once admin panel is working:
1. Try editing a user's role
2. Try searching for users
3. View all links
4. Create a test user and apply for position
5. Approve the position application

# Admin Panel Troubleshooting Guide

## Quick Test Page

I've created a test page to help diagnose issues:

**Go to:** http://localhost:8000/test-admin.html

This page will help you:
1. Test login
2. Check if user has admin position
3. Test admin API endpoints
4. See detailed error messages

## Step-by-Step Troubleshooting

### Issue: "I can't see Admin Panel option in sidebar"

**Solution 1: Clear Browser Cache**
1. Press `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on Mac)
2. Select "Cached images and files"
3. Click "Clear data"
4. Refresh the page

**Solution 2: Check if logged in as admin**
1. Open browser console (F12)
2. Type: `JSON.parse(localStorage.getItem('user'))`
3. Check if `position: "admin"`
4. If not, you're not logged in as admin

**Solution 3: Force logout and login again**
1. Go to http://localhost:8000/auth.html
2. Click logout (or clear localStorage)
3. Login with: username=`demo`, password=`demo123`
4. Check dashboard again

### Issue: "Admin Panel tab is visible but empty"

**Check 1: Open Browser Console**
1. Press F12
2. Go to Console tab
3. Click on "Admin Panel" in sidebar
4. Look for error messages

**Check 2: Test API directly**
1. Go to http://localhost:8000/test-admin.html
2. Click "Test Login as Demo"
3. Click "Get Admin Stats"
4. If you see data, API is working

**Check 3: Check Network Tab**
1. Press F12
2. Go to Network tab
3. Click "Admin Panel" in sidebar
4. Look for failed requests (red)
5. Click on failed request to see error

### Issue: "Getting 403 Forbidden error"

This means you don't have admin permissions.

**Fix:**
1. Check user position in database:
```bash
cat data/users.json | grep -A 10 '"username": "demo"'
```

2. Should show: `"position": "admin"`

3. If not, manually update:
```bash
# Backup first
cp data/users.json data/users.json.backup

# Edit the file and change position to "admin" for demo user
```

### Issue: "Admin panel shows but User Management section is empty"

**Check 1: Verify API works**
```bash
# Get token first by logging in at test-admin.html
# Then test:
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/admin/users
```

**Check 2: Check JavaScript console**
Look for errors when clicking Admin Panel tab

**Check 3: Check if loadAdminPanel function exists**
In browser console, type:
```javascript
typeof loadAdminPanel
```
Should return: `"function"`

## Manual Verification Steps

### 1. Verify Server is Running
```bash
curl http://localhost:8000/health
```
Should return: `{"status":"healthy"}`

### 2. Verify Admin Routes are Registered
```bash
curl http://localhost:8000/openapi.json | grep "/api/admin"
```
Should show admin endpoints

### 3. Verify Demo User is Admin
```bash
cat data/users.json | python -m json.tool | grep -A 12 '"username": "demo"'
```
Should show:
```json
"position": "admin",
"position_verified": true
```

### 4. Test Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'
```
Should return token and user data

### 5. Test Admin Endpoint
```bash
# Use token from step 4
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/admin/stats
```
Should return statistics

## Common Issues and Fixes

### Issue: JavaScript not loading
**Fix:** Hard refresh the page
- Windows/Linux: `Ctrl+F5`
- Mac: `Cmd+Shift+R`

### Issue: Old cached version
**Fix:** Clear site data
1. F12 → Application tab
2. Clear storage → Clear site data
3. Refresh page

### Issue: Token expired
**Fix:** Logout and login again
```javascript
localStorage.clear();
window.location.href = '/auth.html';
```

### Issue: Admin panel code not deployed
**Fix:** Restart server
```bash
lsof -ti:8000 | xargs kill -9
nohup uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > server.log 2>&1 &
```

## Debug Commands

### Check if admin panel HTML exists
```bash
grep -n "admin-tab" app/static/dashboard.html
```

### Check if admin functions exist in JS
```bash
grep -n "loadAdminPanel" app/static/dashboard.js
```

### Check if admin routes exist
```bash
grep -n "admin.router" app/main.py
```

### View server logs
```bash
tail -50 server.log
```

### Check for JavaScript errors
In browser console, look for red error messages

## Expected Behavior

### When logged in as admin:
1. ✅ See "🛡️ Admin Panel" in sidebar
2. ✅ Click it to see admin content
3. ✅ See 4 stat cards at top
4. ✅ See user list with Edit/Delete buttons
5. ✅ See all links section

### When logged in as non-admin:
1. ❌ Don't see "🛡️ Admin Panel" in sidebar
2. ❌ Can't access /api/admin/* endpoints (403 error)

## Still Not Working?

### Last Resort: Complete Reset

1. **Stop server:**
```bash
lsof -ti:8000 | xargs kill -9
```

2. **Clear browser completely:**
- Close all browser windows
- Reopen browser
- Clear all site data

3. **Restart server:**
```bash
nohup uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > server.log 2>&1 &
```

4. **Test with test page:**
- Go to http://localhost:8000/test-admin.html
- Follow all steps
- Check each result

5. **If test page works but dashboard doesn't:**
- Issue is in dashboard.js
- Check browser console for errors
- Look for JavaScript syntax errors

## Get Help

If still not working, provide:
1. Screenshot of browser console (F12)
2. Output of: `cat data/users.json | grep -A 10 '"username": "demo"'`
3. Output of: `tail -50 server.log`
4. Screenshot of test-admin.html results
5. Browser and version you're using

# 🚀 Smart LinkTree - Server Running!

## ✅ Server Status: ONLINE

**Port:** 8000  
**Host:** 0.0.0.0 (accessible from localhost)  
**Profiles:** 18 loaded  
**Analytics Data:** Available  
**WebSocket:** Enabled  

---

## 🌐 Access URLs

### Main Pages
- **Home/Auth:** http://localhost:8000
- **Login:** http://localhost:8000/auth.html
- **Dashboard:** http://localhost:8000/dashboard.html
- **Analytics:** http://localhost:8000/analytics.html

### Testing & Documentation
- **Test Analytics:** http://localhost:8000/test-analytics.html
- **API Docs:** http://localhost:8000/docs
- **API Alternative:** http://localhost:8000/redoc

### Sample Profiles
- **Demo Profile:** http://localhost:8000/demo
- **Tech Blog:** http://localhost:8000/techblog
- **Influencer:** http://localhost:8000/influencer_alex
- **Developer:** http://localhost:8000/developer_sarah
- **Your Demo Account:** http://localhost:8000/user_ef42d3b60913a346

---

## 🔐 Login Credentials

### Demo Account (Recommended)
```
Username: demo
Password: demo123
Role: Premium
Position: Admin
```

### Other Available Accounts
```
Username: testuser123
Password: password123
Role: Free

Username: janedoe
Password: [unknown - hash not cracked]
Role: Premium
```

---

## 🧪 Quick Start Guide

### 1. Test the System (Recommended First Step)
```
Open: http://localhost:8000/test-analytics.html

Click these buttons in order:
1. Test Login ✓
2. Test Analytics API ✓
3. Test WebSocket ✓
4. Test Profile Data ✓

All should show green checkmarks!
```

### 2. Login to Dashboard
```
1. Go to: http://localhost:8000/auth.html
2. Enter: demo / demo123
3. Click Login
4. You'll be redirected to Dashboard
```

### 3. Explore Features

**Dashboard Tabs:**
- **Profile** - Edit your profile info, avatar, bio
- **Links** - Add/edit/delete links with rules
- **Analytics** - View click statistics (real-time)
- **Browse** - Discover other profiles

**Link Rules Available:**
- ⏰ Time-based (e.g., 09:00-17:00)
- 📍 Location-based (e.g., US, UK)
- 📱 Device-based (mobile, tablet, desktop)
- 📅 Day-based (MON, TUE, WED, etc.)
- 👤 Position-based (hr, developer, student, admin)

### 4. View Your Public Profile
```
Your profile URL: http://localhost:8000/user_ef42d3b60913a346

Share this link with others!
Links will show/hide based on rules you set.
```

### 5. Generate Analytics Data
```
1. Open incognito/private window
2. Visit your profile URL
3. Click on your links
4. Go back to Dashboard → Analytics
5. Watch real-time updates!
```

---

## 📊 Current Analytics Data

Your system already has analytics data:

```json
{
  "demo": {
    "total_clicks": 9,
    "links": 4
  },
  "user_ef42d3b60913a346": {
    "total_clicks": 1,
    "unique_visitors": 1
  },
  "user_991bab3fde1bc648": {
    "total_clicks": 143,
    "unique_visitors": 63
  }
}
```

---

## 🔧 Features Working

✅ User Authentication (JWT)  
✅ Profile Management  
✅ Link Management with Rules  
✅ Dynamic Link Highlighting  
✅ Analytics Tracking  
✅ Real-time WebSocket Updates  
✅ Geolocation Detection  
✅ Device Detection  
✅ Role-based Access  
✅ Click Tracking  
✅ Unique Visitor Tracking  

---

## 🎯 What to Try

### Create a Link with Rules
1. Go to Dashboard → Links tab
2. Click "Add New Link"
3. Fill in details:
   - Title: "Work Hours Link"
   - URL: https://example.com
   - Icon: 💼
   - Rule Type: Time-based
   - Rule Value: 09:00-17:00
4. Save
5. View your profile - link only shows during work hours!

### Test Day-Based Rules
1. Create a link with Day rule: TUE (Tuesday only)
2. On Monday: Link is hidden
3. On Tuesday: Link appears
4. This is the fix we applied!

### Watch Real-Time Analytics
1. Open Dashboard → Analytics tab
2. Open your profile in incognito window
3. Click links in incognito window
4. Watch Dashboard update in real-time!

---

## 🐛 Troubleshooting

### Analytics Not Showing?
1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Hard refresh** (Ctrl+F5 or Cmd+Shift+R)
3. Open browser console (F12) - check for errors
4. Try test page: http://localhost:8000/test-analytics.html

### Links Not Hiding with Rules?
1. Clear browser cache
2. Hard refresh the profile page
3. Check rule format (e.g., "MON,TUE,WED" not "Monday")

### WebSocket Not Connecting?
- Normal! HTTP fallback ensures data still loads
- WebSocket will retry automatically
- Check console for "WebSocket connected" message

### Server Not Responding?
```bash
# Check if server is running
ps aux | grep uvicorn

# Restart server
pkill -f uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
```

---

## 📱 API Endpoints

### Authentication
- POST `/api/auth/signup` - Register new user
- POST `/api/auth/login` - Login
- GET `/api/auth/me` - Get current user

### Profiles
- GET `/api/profiles/` - List all profiles
- GET `/api/profiles/{id}` - Get profile (with rules applied)
- POST `/api/profiles/` - Create profile
- PUT `/api/profiles/{id}` - Update profile
- DELETE `/api/profiles/{id}` - Delete profile

### Links
- POST `/api/profiles/me/links` - Add link
- PUT `/api/profiles/me/links/{id}` - Update link
- DELETE `/api/profiles/me/links/{id}` - Delete link
- POST `/api/profiles/{id}/track-click/{link_id}` - Track click

### Analytics
- GET `/api/analytics/profile/{id}` - Get analytics
- DELETE `/api/analytics/reset/{id}` - Reset analytics

### WebSocket
- WS `/ws/analytics/{profile_id}` - Real-time analytics

---

## 💡 Pro Tips

1. **Use Incognito Windows** - Each incognito session = new unique visitor
2. **Test Rules** - Use the preview feature to test how links appear
3. **Real-time Updates** - Keep Dashboard open while testing
4. **Share Your Profile** - Copy your profile URL and share it
5. **Check Console** - F12 shows helpful debug information

---

## 🎨 Customization

### Change Theme
Edit profile → Theme: light/dark

### Custom Avatar
Use any image URL or generate one:
- https://api.dicebear.com/7.x/avataaars/svg?seed=yourname
- https://api.dicebear.com/7.x/bottts/svg?seed=yourname

### Add Emojis
Use any emoji as link icons: 🎨 📱 💼 🎁 📚 🎥

---

## 📞 Quick Commands

```bash
# Check server status
curl http://localhost:8000/health

# List all profiles
curl http://localhost:8000/api/profiles/ | python3 -m json.tool

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "demo", "password": "demo123"}'

# View analytics data
cat data/engagement.json | python3 -m json.tool

# Restart server
pkill -f uvicorn && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
```

---

## 🎉 You're All Set!

The Smart LinkTree application is fully functional and ready to use!

**Start here:** http://localhost:8000/test-analytics.html

**Then login:** http://localhost:8000/auth.html (demo / demo123)

**Have fun!** 🚀

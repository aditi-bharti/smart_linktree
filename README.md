# Smart LinkTree

A smart linktree-like software built with FastAPI that shows multiple links on a webpage with dynamic link highlighting based on user context, time, and visitor location.

## Features

✨ **Dynamic Link Highlighting** - Links are intelligently highlighted based on:
- **Time-based rules** - Show specific links during business hours
- **Location-based rules** - Highlight links for visitors from specific countries/cities
- **User group rules** - Different highlights for free/premium users
- **Day-based rules** - Target specific days of the week
- **Device-based rules** - Different highlights for mobile/tablet/desktop users

📊 **Analytics Tracking** - Track which links get clicked and by whom

🎨 **Beautiful UI** - Modern, responsive design with smooth animations

🔄 **Easy Setup** - Simple file-based database for quick deployment

## Project Structure

```
Fast/
├── app/
│   ├── models/
│   │   └── link.py           # Data models
│   ├── routes/
│   │   ├── profiles.py       # Profile management endpoints
│   │   └── analytics.py      # Analytics endpoints
│   ├── static/
│   │   ├── index.html        # Frontend page
│   │   ├── styles.css        # Styling
│   │   └── script.js         # Frontend logic
│   ├── database.py           # Database operations
│   ├── rules_engine.py       # Dynamic rules evaluation
│   ├── geo_utils.py          # Geolocation utilities
│   └── main.py               # Main FastAPI app
├── requirements.txt          # Python dependencies
└── README.md                 # This file
```

## Installation

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the Application

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The application will be available at `http://localhost:8000`

## Quick Start

### 1. Create a Profile

```bash
curl -X POST http://localhost:8000/api/profiles/ \
  -H "Content-Type: application/json" \
  -d '{
    "id": "myprofile",
    "title": "John Doe",
    "bio": "Developer & Creator",
    "links": []
  }'
```

### 2. Add Links with Rules

```bash
curl -X POST http://localhost:8000/api/profiles/myprofile/links \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Portfolio",
    "url": "https://example.com",
    "description": "Check out my work",
    "icon": "🎨",
    "rules": [
      {
        "rule_type": "time",
        "value": "09:00-17:00",
        "priority": 1
      }
    ]
  }'
```

### 3. View Your Profile

Open browser and go to: `http://localhost:8000/{profile_id}`

Replace `{profile_id}` with your profile ID (e.g., `myprofile`)

## Rule Types

### Time Rule
Show link during specific hours (24-hour format)
```json
{
  "rule_type": "time",
  "value": "09:00-17:00"
}
```

### Location Rule
Show link for specific country or city
```json
{
  "rule_type": "location",
  "value": "US,New York"
}
```
or just country:
```json
{
  "rule_type": "location",
  "value": "US"
}
```

### User Group Rule
Show link for specific user groups
```json
{
  "rule_type": "user_group",
  "value": "premium"
}
```

### Day Rule
Show link on specific days
```json
{
  "rule_type": "day",
  "value": "MON,WED,FRI"
}
```

### Device Rule
Show link for specific device types
```json
{
  "rule_type": "device",
  "value": "mobile"
}
```

## API Endpoints

### Profiles
- `GET /api/profiles/` - List all profiles
- `GET /api/profiles/{profile_id}` - Get profile (with visitor context and link highlighting)
- `POST /api/profiles/` - Create profile
- `PUT /api/profiles/{profile_id}` - Update profile
- `DELETE /api/profiles/{profile_id}` - Delete profile

### Links
- `POST /api/profiles/{profile_id}/links` - Add link to profile
- `PUT /api/profiles/{profile_id}/links/{link_id}` - Update link
- `DELETE /api/profiles/{profile_id}/links/{link_id}` - Delete link

### Analytics
- `POST /api/analytics/` - Track link click
- `GET /api/analytics/{profile_id}` - Get profile analytics

## Data Models

### Profile
```json
{
  "id": "string",
  "title": "string",
  "bio": "string (optional)",
  "avatar_url": "string (optional)",
  "links": [],
  "theme": "light|dark"
}
```

### Link
```json
{
  "id": "string (auto-generated if empty)",
  "title": "string",
  "url": "string",
  "description": "string (optional)",
  "icon": "string (emoji)",
  "is_active": true,
  "is_highlighted": false,
  "rules": [],
  "click_count": 0
}
```

### LinkRule
```json
{
  "rule_type": "time|location|user_group|day|device",
  "value": "string",
  "priority": 0
}
```

## Visitor Context Detection

The system automatically detects:
- **IP Address** - From client request
- **Country & City** - Using IP geolocation (ip-api.com)
- **Device Type** - From user agent string (mobile, tablet, desktop)
- **User Agent** - Browser/device information

## Example Use Cases

### 1. E-commerce Site
- Highlight "Sale" link during working hours
- Show location-specific products for different countries
- Feature mobile app link for mobile users

### 2. SaaS Product
- Highlight "Free Trial" link for new visitors
- Show pricing page for premium users
- Display blog post during business hours

### 3. Creator Profile
- Highlight current availability slot based on time
- Show different links based on visitor location
- Feature premium content for subscribers

## Database

By default, the application uses file-based storage in the `data/` directory:
- `data/profiles.json` - Stores all profiles and links
- `data/analytics.json` - Stores click analytics

You can easily migrate to a real database by modifying `app/database.py`

## Performance Tips

1. **Caching** - Add caching for frequently accessed profiles
2. **Database** - Switch to PostgreSQL/MongoDB for production
3. **CDN** - Serve static files through a CDN
4. **Analytics** - Use a dedicated analytics service for high volume


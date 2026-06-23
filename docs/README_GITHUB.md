# Smart LinkTree - Dynamic Link Management Platform

A powerful, feature-rich LinkTree alternative with dynamic link highlighting, admin panel, position-based access control, and real-time analytics.

## 🌟 Features

### Core Features
- 🔗 **Dynamic Link Management** - Create and manage multiple links with custom icons and descriptions
- 🎯 **Smart Link Rules** - Show/hide links based on:
  - Time of day
  - Day of week
  - User location (country/city)
  - Device type (mobile/tablet/desktop)
  - User position/role
- 📊 **Real-time Analytics** - Track clicks, unique visitors, and link performance via WebSocket
- 🎨 **Customizable Profiles** - Personalize with avatars, bios, and themes
- 📱 **QR Code Generation** - Generate QR codes for easy profile sharing
- 🔐 **JWT Authentication** - Secure user authentication with JWT tokens

### Admin Features
- 🛡️ **Admin Panel** - Comprehensive dashboard for platform management
- 👥 **User Management** - Edit roles, positions, and permissions
- 📋 **Position Application System** - Users can apply for positions (Student, Developer, HR)
- ✅ **Application Approval** - Admins approve/reject position applications
- 🔍 **Platform Overview** - View all links, users, and statistics
- 📈 **Platform Analytics** - Monitor total users, links, clicks, and pending applications
- 🗑️ **Profile Management** - Manage all profiles including demo profiles

### Authentication
- 🔑 **Traditional Login** - Username/password authentication
- 🔥 **Firebase Google Sign-In** - One-click login with Google account
- 🔒 **Position Verification** - Admin-verified positions for access control

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- pip (Python package manager)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/codecraftersmca-hash/smart-linktree.git
cd smart-linktree
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Set up data files:**
```bash
# Copy example files to create actual data files
cp data/users.json.example data/users.json
cp data/profiles.json.example data/profiles.json
cp data/engagement.json.example data/engagement.json
```

4. **Run the server:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

5. **Access the application:**
- Open your browser and go to: http://localhost:8000
- Default admin credentials: username=`demo`, password=`demo123`

## 📖 Documentation

### Setup Guides
- [Firebase Setup Guide](FIREBASE_SETUP_GUIDE.md) - Configure Firebase Google Sign-In
- [Admin Features](ADMIN_FEATURES.md) - Complete admin panel documentation
- [Quick Start Admin](QUICK_START_ADMIN.md) - Quick reference for admin features

### Feature Documentation
- [Admin Panel Ready](ADMIN_PANEL_READY.md) - Admin panel overview
- [Profile Management](PROFILE_MANAGEMENT_ADDED.md) - Managing profiles
- [Position Application System](IMPLEMENTATION_SUMMARY.md) - How position applications work

### Troubleshooting
- [Admin Troubleshooting](ADMIN_TROUBLESHOOTING.md) - Fix common admin panel issues
- [Test Admin Panel](TEST_ADMIN_PANEL.md) - Step-by-step testing guide

## 🏗️ Project Structure

```
smart-linktree/
├── app/
│   ├── main.py                 # FastAPI application entry point
│   ├── auth.py                 # Authentication logic
│   ├── database.py             # File-based database operations
│   ├── firebase_config.py      # Firebase configuration
│   ├── models/                 # Pydantic models
│   │   ├── user.py            # User models
│   │   ├── link.py            # Link and profile models
│   │   └── analytics.py       # Analytics models
│   ├── routes/                 # API routes
│   │   ├── auth.py            # Authentication endpoints
│   │   ├── profiles.py        # Profile management endpoints
│   │   ├── analytics.py       # Analytics endpoints
│   │   └── admin.py           # Admin panel endpoints
│   └── static/                 # Frontend files
│       ├── index.html         # Public profile view
│       ├── auth.html          # Login/signup page
│       ├── dashboard.html     # User dashboard
│       ├── analytics.html     # Analytics page
│       ├── styles.css         # Styles
│       ├── script.js          # Profile page logic
│       ├── dashboard.js       # Dashboard logic
│       └── analytics.js       # Analytics logic
├── data/                       # JSON database files
│   ├── users.json             # User accounts (gitignored)
│   ├── profiles.json          # User profiles (gitignored)
│   └── engagement.json        # Analytics data (gitignored)
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

## 🎯 Usage

### For Regular Users

1. **Sign Up:**
   - Go to http://localhost:8000/auth.html
   - Create an account or sign in with Google

2. **Create Your Profile:**
   - Add your name, bio, and avatar
   - Create links with custom icons and descriptions

3. **Add Smart Rules:**
   - Set time-based rules (show link only during business hours)
   - Set day-based rules (show link only on weekends)
   - Set location-based rules (show link only to US visitors)
   - Set device-based rules (show different links for mobile/desktop)
   - Set position-based rules (show link only to verified developers)

4. **Apply for Position:**
   - Go to Edit Profile → Position Application
   - Select desired position (Student, Developer, HR)
   - Wait for admin approval

5. **Share Your Profile:**
   - Generate QR code
   - Share your profile URL: `http://localhost:8000/your-username`

### For Administrators

1. **Access Admin Panel:**
   - Login with admin account
   - Click "🛡️ Admin Panel" in sidebar

2. **Manage Users:**
   - View all users
   - Edit roles and positions
   - Delete users
   - Search users

3. **Approve Applications:**
   - View pending position applications
   - Approve or reject applications
   - Mark positions as verified

4. **Monitor Platform:**
   - View platform statistics
   - See all links across platform
   - Manage all profiles

## 🔐 Security Features

- JWT token-based authentication
- Password hashing with SHA-256
- Admin-only endpoints with position verification
- Firebase token verification for Google Sign-In
- Protected routes with authentication middleware
- Self-deletion protection for admins

## 🛠️ Technologies Used

- **Backend:** FastAPI (Python)
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Database:** JSON file-based storage
- **Authentication:** JWT, Firebase Auth
- **Real-time:** WebSockets
- **QR Codes:** QRCode.js
- **Avatars:** DiceBear API

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/firebase-login` - Login with Google
- `GET /api/auth/me` - Get current user
- `POST /api/auth/me/apply-position` - Apply for position

### Profiles
- `GET /api/profiles/` - List all profiles
- `GET /api/profiles/{id}` - Get profile by ID
- `GET /api/profiles/me/dashboard` - Get user's dashboard
- `POST /api/profiles/me/profile` - Update profile
- `POST /api/profiles/me/links` - Add link
- `PUT /api/profiles/me/links/{id}` - Update link
- `DELETE /api/profiles/me/links/{id}` - Delete link

### Admin (Requires Admin Position)
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/{id}` - Update user
- `DELETE /api/admin/users/{id}` - Delete user
- `POST /api/admin/users/{id}/approve-position` - Approve application
- `POST /api/admin/users/{id}/reject-position` - Reject application
- `GET /api/admin/links/all` - Get all links
- `GET /api/admin/stats` - Get platform statistics

### Analytics
- `GET /api/analytics/profile/{id}` - Get profile analytics
- `WS /ws/analytics/{id}` - Real-time analytics WebSocket

## 🎨 Customization

### Adding New Positions
Edit `app/models/user.py`:
```python
class UserPosition(str):
    GUEST = "guest"
    STUDENT = "student"
    DEVELOPER = "developer"
    HR = "hr"
    ADMIN = "admin"
    YOUR_NEW_POSITION = "your_position"  # Add here
```

### Adding New Link Rules
Edit `app/rules_engine.py` to add custom rule types.

### Customizing Themes
Edit `app/static/styles.css` to modify colors and styles.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

**codecraftersmca-hash**
- GitHub: [@codecraftersmca-hash](https://github.com/codecraftersmca-hash)

## 🙏 Acknowledgments

- FastAPI for the amazing web framework
- Firebase for authentication services
- DiceBear for avatar generation
- QRCode.js for QR code generation

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check the documentation files in the repository

---

**Made with ❤️ by codecraftersmca-hash**

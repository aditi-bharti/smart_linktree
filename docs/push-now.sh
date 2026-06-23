#!/bin/bash

echo "🚀 Pushing Smart LinkTree to GitHub"
echo "===================================="
echo ""

# Configure git user (update with your email)
echo "📝 Configuring git..."
git config user.name "codecraftersmca-hash"
git config user.email "codecraftersmca@gmail.com"

# Add all files
echo "📦 Adding files..."
git add .

# Create commit
echo "💾 Creating commit..."
git commit -m "Initial commit: Smart LinkTree with admin panel, Firebase auth, and analytics

Features:
- Dynamic link management with smart rules (time, day, location, device, position)
- Admin panel with user management
- Position application system with approval workflow
- Firebase Google Sign-In integration
- Real-time analytics with WebSocket
- Profile management for all users
- QR code generation
- JWT authentication
- Responsive design

Tech Stack:
- FastAPI (Python)
- Vanilla JavaScript
- Firebase Auth
- WebSockets
- JWT tokens"

# Remove old remote if exists
echo "🔗 Setting up remote..."
git remote remove origin 2>/dev/null

# Add remote
git remote add origin https://github.com/codecraftersmca-hash/smart-linktree.git

# Push to GitHub
echo "📤 Pushing to GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "✅ Done!"
echo ""
echo "🎉 Your project is now at:"
echo "   https://github.com/codecraftersmca-hash/smart-linktree"
echo ""

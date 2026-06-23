#!/bin/bash

echo "🚀 Vercel Deployment Setup"
echo "=========================="
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "✅ Vercel CLI is ready"
echo ""

echo "⚠️  IMPORTANT NOTES:"
echo "   1. Vercel doesn't support WebSockets (real-time analytics won't work)"
echo "   2. File-based database won't persist between deployments"
echo "   3. Consider using Render.com instead for full feature support"
echo ""

read -p "Continue with Vercel deployment? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "❌ Cancelled"
    echo ""
    echo "💡 To deploy to Render instead:"
    echo "   1. Go to https://render.com"
    echo "   2. Sign up with GitHub"
    echo "   3. Import your repository"
    echo "   4. Use these settings:"
    echo "      Build: pip install -r requirements.txt"
    echo "      Start: uvicorn app.main:app --host 0.0.0.0 --port \$PORT"
    exit 0
fi

echo ""
echo "🔐 Logging in to Vercel..."
vercel login

echo ""
echo "📤 Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Go to your Vercel dashboard"
echo "   2. Add environment variables if needed"
echo "   3. Test your deployment"
echo ""
echo "⚠️  Remember: WebSockets and file storage won't work on Vercel"
echo ""

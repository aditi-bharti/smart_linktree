#!/bin/bash

echo "📤 Update GitHub Repository"
echo "============================"
echo ""
echo "⚠️  You need to authenticate as 'codecraftersmca-hash'"
echo ""
echo "Choose authentication method:"
echo ""
echo "1. Personal Access Token (Recommended)"
echo "2. SSH Key"
echo "3. GitHub CLI"
echo ""
read -p "Enter choice (1-3): " CHOICE

case $CHOICE in
    1)
        echo ""
        echo "📝 Using Personal Access Token"
        echo ""
        echo "Steps:"
        echo "1. Go to: https://github.com/settings/tokens"
        echo "2. Click 'Generate new token (classic)'"
        echo "3. Select scope: 'repo' (full control)"
        echo "4. Generate and copy the token"
        echo ""
        read -p "Paste your token here: " TOKEN
        
        if [ -z "$TOKEN" ]; then
            echo "❌ No token provided"
            exit 1
        fi
        
        echo ""
        echo "📤 Pushing to GitHub..."
        git push https://$TOKEN@github.com/codecraftersmca-hash/smart-linktree.git main
        ;;
        
    2)
        echo ""
        echo "🔑 Using SSH"
        echo ""
        git remote set-url origin git@github.com:codecraftersmca-hash/smart-linktree.git
        git push origin main
        ;;
        
    3)
        echo ""
        echo "🔧 Using GitHub CLI"
        echo ""
        if ! command -v gh &> /dev/null; then
            echo "❌ GitHub CLI not installed"
            echo "Install from: https://cli.github.com/"
            exit 1
        fi
        
        gh auth login
        git push origin main
        ;;
        
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Repository updated successfully!"
    echo ""
    echo "🌐 View at: https://github.com/codecraftersmca-hash/smart-linktree"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Deploy to Vercel: ./deploy-vercel.sh"
    echo "   2. Or deploy to Render: https://render.com"
    echo ""
else
    echo ""
    echo "❌ Push failed"
    echo ""
    echo "💡 Try these alternatives:"
    echo ""
    echo "Manual push with token:"
    echo "  git push https://YOUR_TOKEN@github.com/codecraftersmca-hash/smart-linktree.git main"
    echo ""
    echo "Or clear credentials and try again:"
    echo "  git credential-osxkeychain erase"
    echo "  host=github.com"
    echo "  protocol=https"
    echo "  [Press Enter twice]"
    echo "  git push origin main"
    echo ""
fi

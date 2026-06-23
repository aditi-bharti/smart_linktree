#!/bin/bash
# Smart LinkTree — push this project to GitHub.
# Usage: ./push-to-github.sh <github-repo-url>
# Example: ./push-to-github.sh https://github.com/your-username/smart-linktree.git

set -e

if [ -z "$1" ]; then
    echo "Usage: ./push-to-github.sh <github-repo-url>"
    echo "Example: ./push-to-github.sh https://github.com/your-username/smart-linktree.git"
    exit 1
fi

REPO_URL="$1"

if ! command -v git &> /dev/null; then
    echo "Git is not installed. Please install git first."
    exit 1
fi

if [ ! -d .git ]; then
    git init
    git branch -M main
fi

git add .
git commit -m "Initial commit: Smart LinkTree"

if git remote get-url origin &> /dev/null; then
    git remote set-url origin "$REPO_URL"
else
    git remote add origin "$REPO_URL"
fi

git push -u origin main

echo ""
echo "Pushed to $REPO_URL"

#!/bin/bash
# GitHub Push Script for Kericho AI
# Usage: ./push-to-github.sh <personal-access-token>

if [ -z "$1" ]; then
    echo "Usage: ./push-to-github.sh <github-personal-access-token>"
    echo ""
    echo "To generate a token:"
    echo "1. Go to: https://github.com/settings/tokens"
    echo "2. Click 'Generate new token (Classic)'"
    echo "3. Select 'repo' scope"
    echo "4. Copy the token and run this script"
    exit 1
fi

PAT=$1
USERNAME="ARNOLDACHIKI"
REPO="kericho-ai"

echo "📦 Pushing to GitHub..."
echo "Repository: https://github.com/$USERNAME/$REPO"
echo ""

# Update remote with token
git remote set-url origin "https://$USERNAME:$PAT@github.com/$USERNAME/$REPO.git"

# Attempt push
git push -u origin main

# Check result
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Push successful!"
    echo "📍 View your repository: https://github.com/$USERNAME/$REPO"
    
    # Clear token from config for security
    git remote set-url origin "https://github.com/$USERNAME/$REPO.git"
    echo "🔒 Remote URL cleared of credentials"
else
    echo ""
    echo "❌ Push failed. Possible reasons:"
    echo "  1. Invalid personal access token"
    echo "  2. Repository doesn't exist yet (create at https://github.com/new)"
    echo "  3. Network connectivity issue"
    echo ""
    echo "Please ensure:"
    echo "  - Repository 'kericho-ai' exists under your account"
    echo "  - Your PAT has 'repo' scope enabled"
    exit 1
fi

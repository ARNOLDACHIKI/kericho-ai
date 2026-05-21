#!/bin/bash
# QUICK PUSH - Copy paste this entire block into terminal
# After you have your GitHub Personal Access Token

# Step 1: Get your token from https://github.com/settings/tokens
#         - Generate new token (Classic)
#         - Select 'repo' scope
#         - Copy the token

# Step 2: Replace TOKEN_HERE with your actual token and run:

GITHUB_TOKEN="TOKEN_HERE"
cd /home/lod/Documents/kericho_ai

# Configure Git with token
git remote set-url origin "https://ARNOLDACHIKI:${GITHUB_TOKEN}@github.com/ARNOLDACHIKI/kericho-ai.git"

# Push to GitHub
git push -u origin main

# If successful, you'll see:
# Branch 'main' set up to track remote branch 'main' from 'origin'.
# Access your repo: https://github.com/ARNOLDACHIKI/kericho-ai

# Clean up: Remove token from config (for security)
git remote set-url origin "https://github.com/ARNOLDACHIKI/kericho-ai.git"

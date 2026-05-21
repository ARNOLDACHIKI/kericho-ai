#!/bin/bash

# WhatsApp Access Token Refresh Helper
# This script guides you through refreshing your token

echo "🔄 WhatsApp Access Token Refresh Helper"
echo "=========================================="
echo ""
echo "Your current access token has expired."
echo "Error: Session has expired on Wednesday, 20-May-26 17:00:00 PDT"
echo ""
echo "Follow these steps to get a new token:"
echo ""
echo "1. Open browser and login to:"
echo "   https://developers.facebook.com/apps/"
echo ""
echo "2. Select your WhatsApp Business App"
echo ""
echo "3. Navigate to:"
echo "   WhatsApp > API Setup > Temporary Access Token"
echo ""
echo "4. Click 'Generate Token'"
echo ""
echo "5. Copy the new token (starts with 'EAAc')"
echo ""
echo "6. Paste below when ready:"
echo ""
read -p "Enter your NEW access token: " NEW_TOKEN

if [ -z "$NEW_TOKEN" ]; then
    echo "❌ No token provided. Exiting."
    exit 1
fi

if [[ ! "$NEW_TOKEN" =~ ^EAAc ]]; then
    echo "⚠️  Warning: Token should start with 'EAAc'"
    read -p "Continue anyway? (y/n): " confirm
    if [ "$confirm" != "y" ]; then
        exit 1
    fi
fi

# Prompt for Phone Number ID
read -p "Enter your WhatsApp Phone Number ID (from Meta dashboard): " PHONE_ID

if [ -z "$PHONE_ID" ]; then
    echo "❌ Phone Number ID is required. Exiting."
    exit 1
fi

# Backup .env
echo "📦 Backing up .env to .env.backup"
cp /home/lod/Documents/kericho_ai/.env /home/lod/Documents/kericho_ai/.env.backup

# Update token in .env
echo "✏️  Updating .env with new token and phone number ID..."
sed -i "s/^WHATSAPP_TOKEN=.*/WHATSAPP_TOKEN=$NEW_TOKEN/" /home/lod/Documents/kericho_ai/.env
sed -i "s/^META_ACCESS_TOKEN=.*/META_ACCESS_TOKEN=$NEW_TOKEN/" /home/lod/Documents/kericho_ai/.env

# Add or update Phone Number ID
if grep -q "^WHATSAPP_PHONE_NUMBER_ID=" /home/lod/Documents/kericho_ai/.env; then
    sed -i "s/^WHATSAPP_PHONE_NUMBER_ID=.*/WHATSAPP_PHONE_NUMBER_ID=$PHONE_ID/" /home/lod/Documents/kericho_ai/.env
else
    sed -i "/^META_ACCESS_TOKEN=/a WHATSAPP_PHONE_NUMBER_ID=$PHONE_ID" /home/lod/Documents/kericho_ai/.env
fi

# Verify
if grep -q "WHATSAPP_TOKEN=$NEW_TOKEN" /home/lod/Documents/kericho_ai/.env && grep -q "WHATSAPP_PHONE_NUMBER_ID=$PHONE_ID" /home/lod/Documents/kericho_ai/.env; then
    echo "✅ Token and Phone Number ID updated successfully"
else
    echo "❌ Failed to update credentials. Check .env manually."
    exit 1
fi

echo ""
echo "🚀 Next: Restart the server"
echo "   1. Stop current server: pkill -f 'node src/index.js'"
echo "   2. Start fresh: node src/index.js"
echo "   3. Send a WhatsApp message to your bot"
echo "   4. Check for AI-generated response"
echo ""
echo "📋 .env backup saved to: /home/lod/Documents/kericho_ai/.env.backup"

#!/bin/bash

echo "============================================"
echo "WEBHOOK DIAGNOSTIC TEST"
echo "============================================"
echo ""

# Get ngrok URL
NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null | python3 -c "import sys, json; print(json.load(sys.stdin)['tunnels'][0]['public_url'])" 2>/dev/null)
LOCALHOST_URL="http://localhost:3000"
VERIFY_TOKEN="healthcare_ai_verify_token"
CHALLENGE="test_challenge_$(date +%s)"

echo "[1] Testing LOCALHOST with VALID token (10 times)"
for i in {1..10}; do
   STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
     "${LOCALHOST_URL}/webhook?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=${CHALLENGE}_${i}")
   echo "  Attempt $i: HTTP $STATUS"
done

echo ""
echo "[2] Testing LOCALHOST with INVALID token (10 times)"
for i in {1..10}; do
   STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
     "${LOCALHOST_URL}/webhook?hub.mode=subscribe&hub.verify_token=WRONG_TOKEN&hub.challenge=${CHALLENGE}_${i}")
   echo "  Attempt $i: HTTP $STATUS"
done

echo ""
echo "[3] Testing NGROK with VALID token (10 times)"
if [ ! -z "$NGROK_URL" ]; then
   for i in {1..10}; do
      STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        "${NGROK_URL}/webhook?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=${CHALLENGE}_${i}")
      echo "  Attempt $i: HTTP $STATUS"
   done
else
   echo "  ERROR: Could not get ngrok URL"
fi

echo ""
echo "[4] Check current process and token"
PID=$(pgrep -f "node src/index.js" | head -1)
if [ ! -z "$PID" ]; then
   echo "  Server PID: $PID"
   echo "  Node version: $(node --version)"
   echo "  .env VERIFY_TOKEN: $(grep WHATSAPP_VERIFY_TOKEN /home/lod/Documents/kericho_ai/.env 2>/dev/null)"
else
   echo "  ERROR: No node process found"
fi

echo ""
echo "============================================"
echo "END DIAGNOSTIC"
echo "============================================"

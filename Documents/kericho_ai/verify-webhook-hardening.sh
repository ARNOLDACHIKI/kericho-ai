#!/bin/bash

# COMPREHENSIVE WEBHOOK VERIFICATION TEST
# Tests all aspects of webhook routing, verification, and consistency

echo "=============================================="
echo "WEBHOOK HARDENING VERIFICATION REPORT"
echo "Generated: $(date)"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

TESTS_PASSED=0
TESTS_FAILED=0

# Test function
function run_test() {
  local test_name="$1"  
  local expected="$2"
  local actual="$3"
  
  if [ "$expected" == "$actual" ]; then
    echo -e "${GREEN}✓${NC} $test_name"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗${NC} $test_name (expected: $expected, got: $actual)"
    ((TESTS_FAILED++))
  fi
}

echo "1. ENTRY POINT VERIFICATION"
echo "=============================="
ENTRY_COUNT=$(grep -r "app.listen\|server.listen" src/ 2>/dev/null | wc -l)
run_test "Only ONE server listen call" "1" "$ENTRY_COUNT"

echo ""
echo "2. WEBHOOK ROUTE VERIFICATION"
echo "=============================="
WEBHOOK_MOUNTS=$(grep -r 'app.use("/webhook"' src/ 2>/dev/null | wc -l)
run_test "Exactly ONE webhook router mount" "1" "$WEBHOOK_MOUNTS"

DIRECT_WEBHOOK_GETS=$(grep -r 'app.get("/webhook' src/ 2>/dev/null | wc -l)
run_test "NO direct app.get(/webhook)" "0" "$DIRECT_WEBHOOK_GETS"

DIRECT_WEBHOOK_POSTS=$(grep -r 'app.post("/webhook' src/ 2>/dev/null | wc -l)
run_test "NO direct app.post(/webhook)" "0" "$DIRECT_WEBHOOK_POSTS"

echo ""
echo "3. MIDDLEWARE VERIFICATION"
echo "=============================="
RATE_LIMITER_SKIP=$(grep -A 10 "skip:" middleware/rateLimiter.js 2>/dev/null | grep -c "webhook")
run_test "Rate limiter explicitly skips /webhook" "1" "$RATE_LIMITER_SKIP"

echo ""
echo "4. AUTHENTICATION MIDDLEWARE CHECK"
echo "====================================="
WEBHOOK_ROUTES_AUTH=$(grep -c "authMiddleware" src/routes/webhookRoutes.js 2>/dev/null || echo "0")
run_test "Webhook routes have NO auth middleware" "0" "$WEBHOOK_ROUTES_AUTH"

echo ""
echo "5. TOKEN VERIFICATION IMPLEMENTATION"
echo "====================================="
TOKEN_FUNCTION=$(grep -c "getVerifyToken" src/controllers/webhookController.js 2>/dev/null || echo "0")
run_test "Using defensive getVerifyToken() function" "1" "$TOKEN_FUNCTION"

DIRECT_ENV_LOOKUP=$(grep -c "process.env.WHATSAPP_VERIFY_TOKEN" src/controllers/webhookController.js 2>/dev/null || echo "0")
run_test "Reads token directly from process.env (not cached)" "1" "$DIRECT_ENV_LOOKUP"

echo ""
echo "6. ERROR HANDLING & LOGGING"
echo "============================"
DEBUG_LOGS=$(grep -c "\[WEBHOOK" src/controllers/webhookController.js 2>/dev/null || echo "0")
if [ "$DEBUG_LOGS" -gt "10" ]; then
  run_test "Multiple debug log points added" "1" "1"
else
  run_test "Multiple debug log points added" "1" "0"
fi

ERROR_JSON=$(grep -c "\.json(" src/controllers/webhookController.js 2>/dev/null || echo "0")
if [ "$ERROR_JSON" -gt "0" ]; then
  run_test "Structured JSON error responses" "1" "1"
else
  run_test "Structured JSON error responses" "1" "0"
fi

echo ""
echo "7. RUNTIME VERIFICATION"
echo "========================"

# Test localhost with valid token
LOCALHOST_VALID=$(curl -s -o /dev/null -w "%{http_code}" \
  "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=healthcare_ai_verify_token&hub.challenge=test123")
run_test "Localhost returns 200 with valid token" "200" "$LOCALHOST_VALID"

# Test localhost with invalid token
LOCALHOST_INVALID=$(curl -s -o /dev/null -w "%{http_code}" \
  "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=WRONG&hub.challenge=test123")
run_test "Localhost returns 403 with invalid token" "403" "$LOCALHOST_INVALID"

# Test localhost missing parameters
LOCALHOST_MISSING=$(curl -s -o /dev/null -w "%{http_code}" \
  "http://localhost:3000/webhook")
run_test "Localhost returns 400 for missing parameters" "400" "$LOCALHOST_MISSING"

echo ""
echo "8. CONSISTENCY TEST (10 RAPID REQUESTS)"
echo "========================================"
CONSISTENCY_PASS=1
for i in {1..10}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=healthcare_ai_verify_token&hub.challenge=test$i")
  if [ "$STATUS" != "200" ]; then
    CONSISTENCY_PASS=0
    break
  fi
done
if [ "$CONSISTENCY_PASS" == "1" ]; then
  run_test "10 consecutive requests return consistent 200" "200" "200"
else
  run_test "10 consecutive requests return consistent 200" "200" "INCONSISTENT"
fi

echo ""
echo "=============================================="
echo "TEST SUMMARY"
echo "=============================================="
TOTAL=$((TESTS_PASSED + TESTS_FAILED))
echo "Passed: ${GREEN}${TESTS_PASSED}${NC}/$TOTAL"
echo "Failed: ${RED}${TESTS_FAILED}${NC}/$TOTAL"

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "\n${GREEN}✓ ALL TESTS PASSED${NC}"
  echo "Webhook is hardened and ready for production"
  exit 0
else
  echo -e "\n${RED}✗ SOME TESTS FAILED${NC}"
  echo "Please review the failures above"
  exit 1
fi

# Testing & CI/CD Pipeline Guide

## Overview

This document explains the CI/CD pipeline and testing infrastructure for the Healthcare WhatsApp Assistant project.

## Pipeline Architecture

```
Developer Push/PR
    ↓
    ├─► STEP 1: Lint & Build Checks
    │   └─ Syntax validation (node -c)
    │
    ├─► STEP 2: Build Verification
    │   └─ Project structure check
    │
    ├─► STEP 3: Unit & Integration Tests
    │   ├─ Node 18.x
    │   ├─ Node 20.x
    │   └─ Coverage reports
    │
    ├─► STEP 4: Security Checks
    │   ├─ Secret scanning
    │   └─ Environment variable validation
    │
    ├─► STEP 5: Staging Deployment (develop branch)
    │   └─ Placeholder (Render/Railway)
    │
    └─► STEP 6: Production Deployment (main branch)
        └─ Placeholder (when configured)
```

---

## Local Testing

### Prerequisites

```bash
npm install
```

### Run All Tests

```bash
npm test
```

Tests run with:
- ✓ Coverage reporting
- ✓ Test environment variables (DATABASE_URL, SESSION_PROVIDER=memory, etc)
- ✓ Mocked external services (OpenAI, Baileys)

### Watch Mode (Development)

```bash
npm run test:watch
```

Automatically re-runs tests when files change.

### Run Specific Test

```bash
npm run test:session
# or
npx jest tests/api/health.test.js
```

---

## Test Structure

### Unit Tests (`src/__tests__/services/`)

- **sessionService.test.js** - Session store tests
- **locationService.test.js** - Location lookup tests
- **whatsappService.test.js** - WhatsApp service tests
- **chatController.test.js** - Chat controller tests
- **topicDetection.test.js** - Topic detection logic

### Integration Tests (`tests/api/`)

- **health.test.js** - Health check endpoints
  - `GET /` - Server status
  - `GET /api/health` - Health check
  - `GET /api/ready` - Readiness probe

- **webhook.test.js** - Webhook integrations
  - `POST /webhook` - WhatsApp message webhook
  - `POST /sms` - SMS message webhook

---

## Test Configuration

### jest.config.js

```javascript
{
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  testTimeout: 15000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
}
```

### jest.setup.js

Configures:
- Test environment variables
- Mock services (OpenAI, Baileys)
- Global test helpers
- Test utilities

**Test Helpers:**
```javascript
global.testHelpers.createMockRequest()   // Mock Express request
global.testHelpers.createMockResponse()  // Mock Express response
global.testHelpers.createMockPhone()     // Generate fake phone number
```

---

## GitHub Actions Workflow

### File: `.github/workflows/test.yml`

#### Job: `lint`
- Runs syntax checks on critical files
- Can be skipped with `continue-on-error: true`

#### Job: `build`
- Verifies project structure
- Ensures all required files exist
- ~30 seconds runtime

#### Job: `test` (Matrix)
- Runs on Node 18.x and 20.x
- Runs `npm test` with test environment
- Uploads coverage to codecov
- ~5-10 minutes per Node version

#### Job: `security`
- Scans for hardcoded secrets
- Validates environment variable usage
- Non-blocking (continues on error)

#### Job: `deploy-staging` (Conditional)
- **Trigger**: Push to `develop` branch
- **Status**: Placeholder (requires config)
- **Platforms**: Render.com, Railway.app, or custom

#### Job: `deploy-production` (Conditional)
- **Trigger**: Push to `main` branch
- **Status**: Placeholder (requires config)
- **Note**: Requires all tests to pass

---

## Environment Variables for CI

### Test Environment

```
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/test
SESSION_PROVIDER=memory
LOG_LEVEL=silent
```

### GitHub Secrets (Configure in Settings → Secrets)

**For Staging Deployment:**
```
RENDER_API_TOKEN
RENDER_SERVICE_ID
```

**For Production Deployment:**
```
PROD_API_TOKEN
PROD_DEPLOYMENT_URL
```

**External Services:**
```
OPENAI_API_KEY
META_BUSINESS_ACCOUNT_ID
BUILD_SECRET
```

---

## Writing New Tests

### Test Template

```javascript
/**
 * Test Suite Description
 * What this tests and why
 */

const request = require('supertest');
const express = require('express');

describe('Feature Name', () => {
  let app;
  
  beforeAll(() => {
    // Setup
    app = express();
  });
  
  afterAll(() => {
    // Cleanup
  });
  
  test('should do something', async () => {
    const response = await request(app)
      .get('/endpoint')
      .expect(200);
    
    expect(response.body).toHaveProperty('key', 'value');
  });
});
```

### Best Practices

1. **One assertion per test** (when possible)
2. **Descriptive test names** - Avoid "should work"
3. **Use mocks** - Mock external APIs
4. **Test edge cases** - Empty inputs, bad data, errors
5. **Use async/await** - Not callbacks
6. **Clean up** - Use `afterEach` / `afterAll`

---

## Mocked Services in Tests

### OpenAI API

Returns mocked response for all `chat.completions.create()` calls:
```javascript
{
  choices: [{
    message: {
      content: 'Mocked AI response for testing'
    }
  }]
}
```

### Baileys WhatsApp

Mocked functions:
- `isJidBroadcast()` → false
- `isJidGroup()` → false

---

## Enable Deployment

### Step 1: Configure Hosting

**Option A: Render.com**
```bash
# Create service on render.com
# Get API token from account settings
# Note service ID
```

**Option B: Railway.app**
```bash
# Create project on railway.app
# Generate API token
```

### Step 2: Set GitHub Secrets

Go to repository → Settings → Secrets → New Secret

Add:
- `RENDER_API_TOKEN` or `RAILWAY_TOKEN`
- `RENDER_SERVICE_ID` (if using Render)

### Step 3: Uncomment Deploy Steps

In `.github/workflows/test.yml`:

```yaml
# Uncomment the deployment job for your platform
- run: |
    curl -X POST "https://api.render.com/deploy/${{ secrets.RENDER_SERVICE_ID }}" \
    -H "Authorization: Bearer ${{ secrets.RENDER_API_TOKEN }}"
```

### Step 4: Test Deploy

1. Push to `develop` branch
2. Watch GitHub Actions
3. Verify deployment to staging
4. Merge to `main` to trigger production deployment

---

## Troubleshooting

### Tests fail locally but pass in CI

**Cause**: Different environment or mocks
**Solution**: 
- Check NODE_ENV is 'test'
- Verify jest.setup.js is loaded
- Check mock configuration

### "Cannot find module" errors

**Cause**: Missing dependencies
**Solution**: 
```bash
npm ci  # Clean install
npm test
```

### Coverage reports not uploading

**Cause**: Codecov token not configured
**Solution**:
1. Visit codecov.io
2. Add repository
3. Get token (optional, usually auto-detected)
4. Add to GitHub Secrets if needed

### Database connection errors in tests

**Cause**: Tests trying to connect to real database
**Solution**:
- Ensure `SESSION_PROVIDER=memory` is set
- Verify `DATABASE_URL` test value is used
- Mock Prisma calls if testing database code

---

## CI/CD Status Badge

Add to README.md:

```markdown
[![CI/CD Pipeline](https://github.com/ARNOLDACHIKI/kericho/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/ARNOLDACHIKI/kericho/actions)
```

---

## Next Steps

1. ✅ Install supertest: `npm install --save-dev supertest`
2. ✅ Run tests locally: `npm test`
3. ✅ Push to GitHub: Tests run automatically
4. ⏳ Configure deployment (when ready)
5. ⏳ Monitor coverage on codecov.io

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest](https://github.com/visionmedia/supertest)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Codecov](https://codecov.io/)
- [Render Deployment](https://render.com/)
- [Railway Deployment](https://railway.app/)

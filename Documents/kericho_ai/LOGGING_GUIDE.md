# Logging and Log Rotation Guide

## Overview

The Kericho AI Healthcare Assistant now includes a comprehensive centralized logging system with automatic log rotation, structured logging across all services, and a monitoring endpoint for validating logging activity.

## Features

### 1. Centralized Winston Logger
- **Location**: `utils/logger.js`
- **Transport**:
  - **Console**: Colorized output for development (debug level) / production (info level)
  - **Daily Rotation (Error Logs)**: `logs/error-%DATE%.log`
    - Max file size: 20MB
    - Retention: 14 days
  - **Daily Rotation (Combined Logs)**: `logs/combined-%DATE%.log`
    - Max file size: 20MB
    - Retention: 30 days

### 2. Log Rotation with `winston-daily-rotate-file`
- Automatic daily file rotation based on date (YYYY-MM-DD pattern)
- Files automatically deleted after retention period expires
- Audit files track rotation metadata (`.audit-error.json`, `.audit-combined.json`)
- No manual intervention required

### 3. Request Logging Middleware
- **Location**: `middleware/requestLogger.js`
- Logs HTTP method, URL, status code, and response duration
- Activated via `app.use(requestLogger)` in `src/index.js`

### 4. Global Error Handler
- **Location**: `middleware/errorHandler.js`
- Catches and logs uncaught errors with full stack traces
- Returns safe response to client: "Something went wrong. Please try again later."
- Placeholder for external error tracking (Sentry, etc.)

### 5. Service-Level Instrumentation
All key services include structured logging:
- **WhatsApp Service** (`src/services/whatsappService.js`): Baileys initialization, message sends/receives
- **AI Service** (`src/services/aiService.js`): Request language, response generation metrics
- **Database Service** (`services/dbService.js`): User upsert, feedback saves
- **SMS Service** (`services/smsService.js`): Incoming SMS, provider sends
- **Chat Controller** (`controllers/chatController.js`): Intent detection, feedback parsing

### 6. Monitoring Endpoint: `/health/logs`
- **Location**: `src/routes/healthRoutes.js` → `GET /health/logs`
- **Purpose**: Verify logging is active and inspect recent log entries
- **Response**:
  ```json
  {
    "ok": true,
    "logging": {
      "active": true,
      "filesCount": 2,
      "files": [
        {
          "filename": "combined-2026-05-01.log",
          "size": 15360,
          "sizeKB": 15,
          "modified": "2026-05-01T12:34:56.000Z"
        }
      ],
      "errorStats": {
        "totalErrors": 5,
        "files": 2,
        "errorFileSizeKB": 8
      },
      "recentErrors": ["2026-05-01 12:34:56 error: Database connection failed {...}"],
      "recentCombined": ["2026-05-01 12:30:00 info: WhatsApp message received {...}"]
    }
  }
  ```

## Usage Examples

### Check Logs Are Active
```bash
curl http://localhost:3000/health/logs | jq '.logging.active'
# Returns: true
```

### View Recent Errors
```bash
curl http://localhost:3000/health/logs | jq '.logging.recentErrors[-5:]'
```

### View Log Files
```bash
ls -lh logs/
# combined-2026-05-01.log
# error-2026-05-01.log
# .audit-error.json
# .audit-combined.json
```

### Monitor in Real-Time
```bash
tail -f logs/combined-*.log
tail -f logs/error-*.log
```

## Configuration

### Environment Variables
- `LOG_LEVEL`: Set log level (default: `info`)
  - Options: `error`, `warn`, `info`, `debug`
  - Example: `LOG_LEVEL=debug npm start`
- `NODE_ENV`: Controls console output verbosity
  - `production`: Info level only
  - Development: Debug level

### Retention Policies
- **Error logs**: 14 days (industry standard for critical issues)
- **Combined logs**: 30 days (longer retention for audit trails)
- **Max file size**: 20MB per file (triggers rotation on size OR date)

## Implementation Details

### Log Service Helper (`services/logService.js`)
Utility functions for reading and analyzing logs:
- `readLogFile(filename, maxLines)`: Read recent log lines
- `getLogFiles()`: List all log files with metadata
- `getLogSummary(limit)`: Get summary with recent errors and combined entries
- `getErrorStats()`: Count errors and file sizes

### Directory Structure
```
logs/
  combined-2026-05-01.log      # Today's combined logs
  combined-2026-04-30.log      # Previous day
  error-2026-05-01.log         # Today's errors
  error-2026-04-30.log         # Previous day
  .audit-error.json            # Rotation metadata
  .audit-combined.json         # Rotation metadata
```

### Log Format
All logs include:
- **Timestamp**: `YYYY-MM-DD HH:mm:ss`
- **Level**: `error`, `warn`, `info`, `debug`
- **Message**: Core log text
- **Metadata**: JSON object with additional context (optional)

Example:
```
2026-05-01 12:34:56 info: WhatsApp message received {"from": "+254712345678", "messageId": "msg_123"}
2026-05-01 12:35:10 error: AI service failed {"error": "API timeout", "service": "openai"}
```

## Troubleshooting

### Logs Not Appearing in Files
1. Check directory permissions: `ls -ld logs/`
2. Verify Winston initialized: `grep "winston" utils/logger.js`
3. Check LOG_LEVEL env var: `echo $LOG_LEVEL`
4. Restart server after env changes

### Log Files Growing Too Fast
- Reduce retention period in `utils/logger.js` (`maxDays` property)
- Increase `maxSize` if files rotating too frequently
- Check for verbose logging: `grep "logger.debug" src/**/*.js | wc -l`

### `/health/logs` Returns Empty
- Ensure at least one request has been logged
- Wait a few seconds for first log rotation to complete
- Check `logs/` directory exists: `ls -la logs/`

### Rotation Not Working
- Verify `winston-daily-rotate-file` installed: `npm list winston-daily-rotate-file`
- Check audit files created: `ls -la logs/.audit-*.json`
- Restart server after upgrading package

## Best Practices

1. **Structured Logging**: Always include context in log metadata
   ```javascript
   logger.info({ userId, messageCount, duration }, "Processing complete");
   ```

2. **Error Logging**: Include full stack traces and request context
   ```javascript
   logger.error({ error, route, method }, "Request failed");
   ```

3. **Avoid Logging Sensitive Data**: Never log passwords, API keys, or PII
   ```javascript
   // ❌ Bad
   logger.info({ password, apiKey }, "User auth");
   // ✅ Good
   logger.info({ userId, provider }, "User authenticated");
   ```

4. **Monitor Low-Volume Timestamps**: Use daily rotation to sync with operational schedules
   - Rotate at 00:00 UTC (configurable via `datePattern`)

5. **Archive Old Logs**: Manually back up logs before retention period expires
   ```bash
   tar -czf logs-archive-2026-04.tar.gz logs/combined-2026-04-*.log
   ```

## Integration with External Trackers

Update `utils/logger.js` to send critical errors to Sentry, Datadog, etc.:

```javascript
logger.captureException = function captureException(error, context = {}) {
  // Replace with real Sentry integration:
  // Sentry.captureException(error, { contexts: context });
  logger.error({ error, ...context }, "External error tracker placeholder");
};
```

## Monitoring and Alerts

### Suggested Alerts
- **High Error Rate**: `totalErrors > 50` in past hour
- **Large Error Log**: `errorFileSizeKB > 100`
- **Missing Log Activity**: No entries in `combined.log` for 5+ minutes

### Query Examples
```bash
# Count errors in past log
grep "error:" logs/combined-*.log | wc -l

# Find slowest requests
grep "duration:" logs/combined-*.log | sort -t':' -k3 -rn | head -10

# Find all WhatsApp failures
grep -i "whatsapp.*error" logs/error-*.log
```

## Next Steps

1. Deploy with automatic log rotation activated
2. Monitor `/health/logs` endpoint during first 24 hours
3. Set up log aggregation (ELK stack, Splunk, etc.) for centralized analysis
4. Configure alerts based on error thresholds
5. Implement log viewer dashboard for admin panel


# Troubleshooting Guide

This guide helps resolve common issues with the Google Calendar MCP Server.

## Authentication Issues

### "OAuth credentials not found"

**Error:**
```
Error loading OAuth keys: OAuth credentials not found
```

**Solutions:**
1. Verify credentials file exists at the specified path
2. Check environment variable:
   ```bash
   echo $GOOGLE_OAUTH_CREDENTIALS
   ```
3. Ensure file has correct permissions:
   ```bash
   chmod 600 /path/to/gcp-oauth.keys.json
   ```
4. Validate JSON format:
   ```bash
   cat /path/to/gcp-oauth.keys.json | jq .
   ```

### "Invalid credentials format"

**Error:**
```
Invalid credentials file format. Expected either "installed" object or direct client_id/client_secret fields.
```

**Solution:**
Ensure your credentials file has the correct structure:
```json
{
  "installed": {
    "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "client_secret": "YOUR_CLIENT_SECRET",
    "redirect_uris": ["http://localhost"]
  }
}
```

### "Access blocked: This app is blocked"

**Error:**
```
Access blocked: YourApp has not completed the Google verification process
```

**Solutions:**
1. Add your email as a test user in Google Cloud Console
2. Go to OAuth consent screen → Test users → Add users
3. Wait 2-3 minutes for changes to propagate
4. Try authenticating again

### "Token has been expired or revoked"

**Error:**
```
Error refreshing auth token: Invalid grant. Token likely expired or revoked.
```

**Solutions:**
1. Re-authenticate:
   ```bash
   npm run auth
   ```
2. For test mode apps, tokens expire after 7 days
3. Clear old tokens first if needed:
   ```bash
   npm run account:clear:normal
   npm run auth
   ```

## Connection Issues

### "Connection refused" in Claude Desktop

**Error:**
```
MCP error -32000: Connection closed
```

**Solutions:**
1. Check if server is running
2. Verify Claude Desktop config path is correct
3. Restart Claude Desktop
4. Check for multiple server instances:
   ```bash
   ps aux | grep google-calendar-mcp
   ```

### "Server initialization failed"

**Solutions:**
1. Check Node.js version (requires 18+):
   ```bash
   node --version
   ```
2. Rebuild the project:
   ```bash
   npm run build
   ```
3. Check for missing dependencies:
   ```bash
   npm install
   ```

## API Errors

### "Calendar API has not been used in project"

**Error:**
```
Google Calendar API has not been used in project 123456 before or it is disabled
```

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Enable Google Calendar API
4. Wait a few minutes for activation

### "Insufficient Permission"

**Error:**
```
Request had insufficient authentication scopes
```

**Solutions:**
1. Check OAuth consent screen scopes include:
   - `https://www.googleapis.com/auth/calendar.events`
   - Or broader: `https://www.googleapis.com/auth/calendar`
2. Re-authenticate after adding scopes:
   ```bash
   npm run account:clear:normal
   npm run auth
   ```

### "Rate Limit Exceeded"

**Error:**
```
User Rate Limit Exceeded
```

**Solutions:**
1. Wait a few minutes before retrying
2. Implement exponential backoff
3. Check for loops or excessive requests
4. Consider batch operations

## Date/Time Issues

### "Invalid date format"

**Error:**
```
Invalid datetime format. Must be RFC3339 with timezone
```

**Solution:**
Always include timezone in datetime strings:
- ✅ Correct: `2024-03-15T10:00:00-07:00`
- ❌ Wrong: `2024-03-15T10:00:00`

### "Timezone required"

**Solution:**
Specify timezone in one of these ways:
1. In the datetime string: `2024-03-15T10:00:00-07:00`
2. As a separate parameter: `timeZone: "America/Los_Angeles"`
3. Using UTC: `2024-03-15T17:00:00Z`

## Tool-Specific Issues

### list-events returns empty

**Possible causes:**
1. Wrong calendar ID - use `list-calendars` to verify
2. Time range too narrow
3. No events in specified range
4. Wrong timezone causing date mismatch

**Debug:**
```bash
# List all calendars first
npm run dev -- list-calendars

# Check with broader time range
npm run dev -- list-events --calendarId primary --days 30
```

### create-event fails silently

**Common issues:**
1. Missing required fields (summary, start, end, timeZone)
2. End time before start time
3. Invalid attendee email format
4. Calendar ID doesn't exist

### update-event "Event not found"

**Solutions:**
1. Verify event ID is correct
2. Check if event was deleted
3. Ensure you have edit permissions
4. For recurring events, use correct instance ID

## Performance Issues

### Slow response times

**Solutions:**
1. Check network connectivity
2. Enable caching for repeated queries
3. Use batch operations for multiple calendars
4. Reduce the time range for event queries

### High memory usage

**Solutions:**
1. Limit concurrent operations
2. Reduce event fetch page size
3. Clear token cache periodically
4. Monitor for memory leaks

## Development Issues

### "Cannot find module" after git pull

**Solution:**
```bash
npm install
npm run build
```

### Tests failing locally

**Solutions:**
1. Set up test account:
   ```bash
   npm run auth:test
   ```
2. Check environment variables:
   ```bash
   cp .env.example .env.test
   # Edit .env.test with your values
   ```
3. Run specific test suites:
   ```bash
   npm test  # Unit tests only
   npm run test:integration:direct  # Core integration
   ```

### Schema validation fails

**Solution:**
```bash
# Rebuild and validate
npm run build
NODE_ENV=test npm run dev validate-schemas
```

## Debug Mode

Enable detailed logging:

```bash
# Debug all MCP communication
DEBUG=mcp:* npm start

# Debug specific components
DEBUG=mcp:calendar:* npm start

# Maximum verbosity
DEBUG=* npm start
```

## Getting Help

If these solutions don't resolve your issue:

1. Check [GitHub Issues](https://github.com/nspady/google-calendar-mcp/issues)
2. Enable debug logging and capture output
3. Include:
   - Error message
   - Node.js version
   - Operating system
   - Steps to reproduce
4. Create a new issue with details

## Common Fixes Summary

```bash
# Reset everything and start fresh
npm run account:clear:normal
npm run account:clear:test
rm -rf node_modules package-lock.json
npm install
npm run build
npm run auth
```
# Testing Guide

This guide covers testing strategies and commands for the Google Calendar MCP Server.

## Test Structure

The project uses Vitest for testing with the following categories:

1. **Unit Tests**: Fast, isolated component tests
2. **Integration Tests**: Full end-to-end tests with real Google Calendar API
3. **Schema Tests**: MCP protocol compliance validation

## Quick Start

```bash
# Run unit tests only (no credentials needed)
npm test

# Run all tests including integration
npm run test:all

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run coverage
```

## Unit Tests

Unit tests run without external dependencies:

```bash
npm test                    # Run once
npm run test:watch         # Watch mode
```

### What's Tested
- Request validation
- Error handling
- Date/time parsing
- Schema compliance
- Utility functions

### Writing Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { validateDateTimeFormat } from '../validators';

describe('DateTime Validation', () => {
  it('should accept RFC3339 format with timezone', () => {
    const result = validateDateTimeFormat('2024-03-15T10:00:00-07:00');
    expect(result).toBe(true);
  });
  
  it('should reject missing timezone', () => {
    const result = validateDateTimeFormat('2024-03-15T10:00:00');
    expect(result).toBe(false);
  });
});
```

## Integration Tests

Integration tests require a test Google account and real API access.

### Setup Test Account

1. Create a dedicated test Google account
2. Set up OAuth credentials for the test account
3. Authenticate the test account:

```bash
npm run auth:test
```

### Environment Variables

Create a `.env.test` file:

```bash
# Required
TEST_CALENDAR_ID=primary

# Optional attendees for event tests
INVITEE_1=friend@example.com
INVITEE_2=colleague@example.com

# AI API Keys (for AI integration tests)
ANTHROPIC_API_KEY=your-key
OPENAI_API_KEY=your-key
```

### Running Integration Tests

```bash
# Core integration tests (recommended for development)
npm run test:integration:direct

# All integration tests
npm run test:integration:all

# Specific test suites
npm run test:integration:claude-mcp   # Claude + MCP tests
npm run test:integration:openai-mcp   # OpenAI + MCP tests
```

### Test Data Management

Integration tests automatically:
- Create test events with unique IDs
- Clean up after each test
- Handle rate limiting
- Retry on transient failures

## Schema Validation Tests

Ensure MCP compatibility:

```bash
npm run dev validate-schemas
```

This checks:
- Tool parameter schemas
- Response formats
- OpenAI function calling compatibility
- Required vs optional fields

## Performance Testing

Monitor operation performance:

```typescript
// Tests track performance metrics
const startTime = Date.now();
await mcpClient.callTool('list-events', params);
const duration = Date.now() - startTime;
expect(duration).toBeLessThan(5000); // 5 second timeout
```

## CI/CD Testing

GitHub Actions runs tests automatically:

1. **Code Quality**: Linting and console statement checks
2. **Build Validation**: TypeScript compilation
3. **Unit Tests**: On Node.js 18 and 20
4. **Schema Validation**: MCP compliance
5. **Coverage Report**: Code coverage metrics

### Local CI Simulation

```bash
# Run all CI checks locally
npm run ci:local

# Individual CI steps
npm run lint
npm run typecheck
npm run build
npm test
npm run dev validate-schemas
```

## Test Configuration

### Vitest Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000, // 30s for API calls
    exclude: ['**/node_modules/**', 'src/integration/**'],
  },
});
```

### Debugging Tests

```bash
# Run specific test file
npm test src/handlers/core/UpdateEventHandler.test.ts

# Run tests matching pattern
npm test -- --grep "date validation"

# Debug with Node inspector
node --inspect-brk ./node_modules/.bin/vitest run
```

## Best Practices

### 1. Test Isolation

Each test should:
- Create its own test data
- Clean up after completion
- Not depend on other tests
- Use unique identifiers

### 2. Mocking

For unit tests, mock external dependencies:

```typescript
import { vi } from 'vitest';

// Mock Google Calendar API
vi.mock('googleapis', () => ({
  google: {
    calendar: () => ({
      events: {
        list: vi.fn().mockResolvedValue({ data: { items: [] } })
      }
    })
  }
}));
```

### 3. Error Scenarios

Test error handling:

```typescript
it('should handle API errors gracefully', async () => {
  const result = await callTool('create-event', invalidParams);
  expect(result.isError).toBe(true);
  expect(result.content[0].text).toContain('Invalid date format');
});
```

### 4. Async Testing

Use proper async/await:

```typescript
it('should list events', async () => {
  const result = await mcpClient.callTool('list-events', {
    calendarId: 'primary',
    timeMin: '2024-01-01T00:00:00Z',
    timeMax: '2024-01-31T23:59:59Z'
  });
  
  expect(result.isError).toBe(false);
  expect(result.content).toBeDefined();
});
```

## Troubleshooting Tests

### Common Issues

1. **"No credentials found"**
   - Run `npm run auth:test` for integration tests
   - Check `GOOGLE_OAUTH_CREDENTIALS` environment variable

2. **"Rate limit exceeded"**
   - Tests include automatic retry logic
   - Reduce parallel test execution
   - Use `--max-workers=1` for sequential runs

3. **"Token expired"**
   - Re-authenticate: `npm run auth:test`
   - Check if app is in test mode (7-day expiration)

4. **Flaky Tests**
   - Add retry logic for network operations
   - Increase timeouts for slow operations
   - Check for race conditions

### Debug Output

Enable detailed logging:

```bash
# Debug MCP communication
DEBUG=mcp:* npm test

# Verbose test output
npm test -- --reporter=verbose

# Test coverage details
npm run coverage -- --reporter=text-summary
```

## Contributing Tests

When adding new features:

1. Write unit tests first (TDD approach)
2. Add integration tests for API interactions
3. Ensure schema validation passes
4. Check coverage doesn't decrease
5. Run full test suite before submitting PR

See [Development Guide](development.md) for more details.
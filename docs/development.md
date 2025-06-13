# Development Guide

This guide covers development setup, contribution guidelines, and project architecture for the Google Calendar MCP Server.

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- A Google Cloud project with Calendar API enabled
- Git for version control
- A test Google account (recommended)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/nspady/google-calendar-mcp.git
cd google-calendar-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Set up authentication
npm run auth        # For main account
npm run auth:test   # For test account
```

## Development Workflow

### Available Scripts

```bash
npm run dev            # Interactive development menu
npm run dev:watch      # Auto-rebuild on changes
npm run lint           # Run ESLint
npm run typecheck      # TypeScript type checking
npm run test:watch     # Run tests in watch mode
```

### Using the Dev Menu

The project includes an interactive development menu:

```bash
npm run dev
```

This provides organized access to all development commands:
- Building and validation
- Testing (unit, integration, coverage)
- Authentication management
- Server operations

See [Development Scripts Documentation](development-scripts.md) for details.

## Project Architecture

### Directory Structure

```
google-calendar-mcp/
├── src/
│   ├── auth/          # OAuth authentication
│   ├── handlers/      # MCP tool implementations
│   │   └── core/      # Core calendar operations
│   ├── schemas/       # JSON Schema definitions
│   ├── transports/    # Transport implementations
│   ├── integration/   # Integration tests
│   └── server.ts      # Main server class
├── docs/              # Documentation
├── scripts/           # Build and utility scripts
└── examples/          # Usage examples
```

### Key Components

1. **Authentication Layer** (`src/auth/`)
   - OAuth2 client management
   - Token storage and refresh
   - Multi-account support

2. **Handler System** (`src/handlers/`)
   - Each tool has a dedicated handler
   - Consistent error handling
   - Input validation

3. **Transport Layer** (`src/transports/`)
   - stdio: Local communication
   - HTTP: Remote access with SSE

4. **Schema System** (`src/schemas/`)
   - Runtime validation
   - OpenAI compatibility
   - Type generation

## Contributing

### Code Style

The project uses ESLint and Prettier:

```bash
# Format code
npm run format

# Check linting
npm run lint

# Fix linting issues
npm run lint:fix
```

### TypeScript Guidelines

- Use strict mode
- Define explicit types for parameters
- Avoid `any` type
- Use interfaces for complex objects

### Error Handling

Follow the established pattern:

```typescript
try {
  // Operation
  const result = await calendar.events.list(params);
  return success(result);
} catch (error) {
  // Specific error handling
  if (isAuthError(error)) {
    throw new McpError(ErrorCode.Unauthorized, "Authentication required");
  }
  // Generic fallback
  throw toMcpError(error);
}
```

## Adding New Features

### 1. Adding a New Tool

Create a new handler in `src/handlers/core/`:

```typescript
// src/handlers/core/NewToolHandler.ts
export class NewToolHandler extends BaseHandler {
  async handle(params: NewToolParams): Promise<ToolResponse> {
    // Validate inputs
    this.validateParams(params);
    
    // Execute operation
    const result = await this.googleCalendar.newOperation(params);
    
    // Format response
    return this.formatResponse(result);
  }
}
```

Register the tool in `src/tools/definitions.ts`:

```typescript
{
  name: "new-tool",
  description: "Description of what the tool does",
  inputSchema: newToolSchema,
  handler: NewToolHandler
}
```

### 2. Adding Tests

Create corresponding test file:

```typescript
// src/handlers/core/NewToolHandler.test.ts
describe('NewToolHandler', () => {
  it('should handle valid input', async () => {
    const handler = new NewToolHandler();
    const result = await handler.handle(validParams);
    expect(result.isError).toBe(false);
  });
});
```

### 3. Updating Schemas

Add schema definition in `src/schemas/`:

```typescript
export const newToolSchema = {
  type: "object",
  properties: {
    // Define parameters
  },
  required: ["requiredField"],
  additionalProperties: false
};
```

## Testing

### Running Tests

```bash
# Unit tests only
npm test

# Specific test file
npm test UpdateEventHandler.test.ts

# Integration tests (requires auth)
npm run test:integration:direct

# Coverage report
npm run coverage
```

### Writing Tests

Follow the existing patterns:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('Component', () => {
  beforeEach(() => {
    // Setup
  });

  it('should handle success case', async () => {
    // Test implementation
  });

  it('should handle error case', async () => {
    // Test error handling
  });
});
```

## Debugging

### Local Debugging

```bash
# Enable debug output
DEBUG=mcp:* npm start

# Use Node inspector
node --inspect-brk build/index.js
```

### VS Code Configuration

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug MCP Server",
  "program": "${workspaceFolder}/build/index.js",
  "env": {
    "DEBUG": "mcp:*"
  }
}
```

## Release Process

1. **Update version**
   ```bash
   npm version patch  # or minor/major
   ```

2. **Run all tests**
   ```bash
   npm run test:all
   npm run lint
   npm run typecheck
   ```

3. **Build and validate**
   ```bash
   npm run build
   npm run dev validate-schemas
   ```

4. **Create PR**
   - Write clear description
   - Reference any issues
   - Ensure CI passes

5. **After merge**
   - Tag release
   - Update changelog
   - Publish to npm (if applicable)

## Best Practices

### Security

- Never commit credentials
- Use environment variables
- Validate all inputs
- Sanitize error messages
- Follow OAuth best practices

### Performance

- Batch API requests when possible
- Implement caching strategically
- Use pagination for large datasets
- Handle rate limits gracefully

### Code Quality

- Write self-documenting code
- Add JSDoc comments for public APIs
- Keep functions focused and small
- Use meaningful variable names
- Follow DRY principles

## Resources

- [MCP Documentation](https://modelcontextprotocol.io/docs)
- [Google Calendar API Reference](https://developers.google.com/calendar/api/v3/reference)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Vitest Documentation](https://vitest.dev/guide/)

## Getting Help

- Check existing issues on GitHub
- Review test files for examples
- Enable debug logging
- Ask in discussions
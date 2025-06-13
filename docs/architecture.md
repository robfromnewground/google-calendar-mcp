# Architecture Overview

This document describes the architectural design of the Google Calendar MCP Server.

## Core Architecture

### Transport Layer

The server supports two transport modes:

1. **stdio Transport** (Default)
   - Direct process communication
   - Used by Claude Desktop
   - Synchronous authentication flow
   - Single-user mode

2. **HTTP Transport**
   - RESTful API with Server-Sent Events (SSE)
   - Remote deployment capable
   - Session-based multi-user support
   - Async authentication flow

### Authentication System

```
src/auth/
├── client.ts       # OAuth2Client initialization
├── server.ts       # OAuth flow server
├── tokenManager.ts # Token storage and refresh
└── utils.ts        # Auth utilities
```

**Key Features:**
- OAuth 2.0 with refresh token support
- Multi-account management (normal/test)
- Secure token storage using system directories
- Automatic token refresh
- Test mode with mock credentials

### Handler Architecture

```
src/handlers/
├── core/
│   ├── BaseToolHandler.ts      # Abstract base class
│   ├── ListEventsHandler.ts    # Event listing
│   ├── CreateEventHandler.ts   # Event creation
│   ├── UpdateEventHandler.ts   # Event updates
│   └── ...                     # Other handlers
└── utils.ts                    # Shared utilities
```

**Handler Pattern:**
1. Each MCP tool has a dedicated handler
2. Handlers extend common base functionality
3. Input validation using schemas
4. Consistent error handling
5. Response formatting

### Schema System

```
src/schemas/
├── types.ts        # TypeScript type definitions
└── validators.ts   # Runtime validation schemas
```

**Validation Flow:**
1. MCP receives tool request
2. Schema validates input parameters
3. Handler processes validated data
4. Response formatted to MCP spec

## Key Components

### Server Class (`src/server.ts`)

The main orchestrator that:
- Initializes transport layer
- Manages authentication
- Registers tool handlers
- Handles graceful shutdown

### Tool Registration (`src/tools/definitions.ts`)

Centralized tool registry that maps:
- Tool names to handlers
- Input schemas to tools
- Descriptions for MCP discovery

### Batch Operations

The `BatchListEvents` handler implements efficient multi-calendar queries:
- Parallel calendar fetching
- Result aggregation
- Unified response formatting

### Recurring Event Support

Advanced recurring event handling in `UpdateEventHandler`:
- **Single Instance**: Modify one occurrence
- **Future Events**: Split series at date
- **All Events**: Update entire series

## Data Flow

### Request Flow

```
Client Request
    ↓
Transport Layer (stdio/HTTP)
    ↓
MCP Protocol Handler
    ↓
Schema Validation
    ↓
Tool Handler
    ↓
Google Calendar API
    ↓
Response Formatting
    ↓
Client Response
```

### Authentication Flow

```
First Run
    ↓
Check Stored Tokens
    ↓ (if invalid)
Launch Auth Server
    ↓
Open Browser
    ↓
Google OAuth Consent
    ↓
Receive Authorization Code
    ↓
Exchange for Tokens
    ↓
Store Tokens Securely
    ↓
Ready for API Calls
```

## Security Architecture

### Token Security
- Tokens stored in user config directory
- File permissions set to 600 (user-only)
- Never logged or exposed
- Automatic cleanup on errors

### HTTP Security
- Session-based authentication
- CORS protection
- Rate limiting (100 req/15min)
- Origin validation
- HTTPS enforcement in production

### Input Validation
- All inputs validated before processing
- Schema-based type checking
- SQL injection prevention
- XSS protection in responses

## Performance Considerations

### Caching Strategy
- Calendar list cached (5 min)
- Color definitions cached (session)
- No event caching (real-time data)

### Rate Limiting
- Respect Google Calendar quotas
- Exponential backoff on 429s
- Request batching where possible

### Resource Management
- Connection pooling for HTTP
- Graceful shutdown handling
- Memory-efficient streaming

## Extension Points

### Adding New Tools

1. Create handler in `src/handlers/core/`
2. Define schema in `src/schemas/`
3. Register in `src/tools/definitions.ts`
4. Add tests
5. Update documentation

### Custom Transports

Implement the transport interface:
```typescript
interface Transport {
  start(): Promise<void>;
  stop(): Promise<void>;
  onMessage(handler: MessageHandler): void;
  sendMessage(message: any): void;
}
```

### Authentication Providers

The auth system can be extended for:
- Service account support
- Alternative OAuth providers
- API key authentication

## Testing Architecture

### Unit Tests
- Handler logic isolation
- Schema validation tests
- Utility function tests
- Mock Google API responses

### Integration Tests
- Real Google Calendar API
- End-to-end tool testing
- Multi-account scenarios
- Error condition handling

### Schema Tests
- MCP compliance validation
- OpenAI compatibility checks
- Breaking change detection

## Deployment Architecture

### Local Deployment
- Single-user mode
- Direct file system access
- Synchronous operations

### Cloud Deployment
- Multi-user sessions
- Environment-based config
- Health monitoring
- Horizontal scaling ready

See [Deployment Guide](deployment.md) for detailed deployment instructions.
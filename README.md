# Google Calendar MCP Server

A Model Context Protocol (MCP) server that provides Google Calendar integration for AI assistants like Claude.

## Features

- **Multi-Calendar Support**: List events from multiple calendars simultaneously
- **Event Management**: Create, update, delete, and search calendar events
- **Recurring Events**: Advanced modification scopes for recurring events
- **Free/Busy Queries**: Check availability across calendars
- **Smart Scheduling**: Natural language understanding for dates and times

## Quick Start

### Prerequisites

1. A Google Cloud project with the Calendar API enabled
2. OAuth 2.0 credentials (Desktop app type)

> **Need help?** See [Authentication Setup Guide](docs/authentication.md) for detailed Google Cloud configuration.

### Installation

**Option 1: Use with npx (Recommended)**

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "google-calendar": {
      "command": "npx",
      "args": ["@cocal/google-calendar-mcp"],
      "env": {
        "GOOGLE_OAUTH_CREDENTIALS": "/path/to/your/gcp-oauth.keys.json"
      }
    }
  }
}
```

**Option 2: Local Installation**

```bash
git clone https://github.com/nspady/google-calendar-mcp.git
cd google-calendar-mcp
npm install
npm run build
```

Then add to Claude Desktop config using the local path.

### First Run

1. Start Claude Desktop
2. The server will prompt for authentication on first use
3. Complete the OAuth flow in your browser
4. You're ready to use calendar features!

## Example Usage

- "What's on my calendar tomorrow?"
- "Schedule a meeting with John next Tuesday at 2pm"
- "Find a free 30-minute slot this week for a quick sync"
- "Move my 3pm meeting to Friday"
- "Show me all events with Sarah this month"

## Available Tools

| Tool | Description |
|------|-------------|
| `list-calendars` | List all available calendars |
| `list-events` | List events with date filtering |
| `search-events` | Search events by text query |
| `create-event` | Create new calendar events |
| `update-event` | Update existing events |
| `delete-event` | Delete events |
| `get-freebusy` | Check availability across calendars |
| `list-colors` | List available event colors |

## Documentation

- [Authentication Setup](docs/authentication.md) - Detailed Google Cloud setup
- [Advanced Usage](docs/advanced-usage.md) - Multi-account, batch operations
- [Deployment Guide](docs/deployment.md) - HTTP transport, Docker, remote access
- [Development](docs/development.md) - Contributing and testing
- [Troubleshooting](docs/troubleshooting.md) - Common issues and solutions

## Configuration

**Environment Variables:**
- `GOOGLE_OAUTH_CREDENTIALS` - Path to OAuth credentials file
- `GOOGLE_CALENDAR_MCP_TOKEN_PATH` - Custom token storage location (optional)

**Claude Desktop Config Location:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

## Development

```bash
npm run build          # Build the project
npm run dev           # Development mode with auto-rebuild
npm test              # Run unit tests
npm run auth          # Re-authenticate
```

See [Development Guide](docs/development.md) for more commands and contribution guidelines.

## Security

- OAuth tokens are stored securely in your system's config directory
- Credentials never leave your local machine
- All calendar operations require explicit user consent

## License

MIT

## Support

- [GitHub Issues](https://github.com/nspady/google-calendar-mcp/issues)
- [Documentation](docs/)
# Google Calendar MCP - Railway Deployment

This is a Railway-optimized fork of the Google Calendar MCP Server that provides Google Calendar integration for AI assistants like Claude through the Model Context Protocol (MCP).

## 🚀 Quick Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/new)

## Features

- ✅ **Railway Optimized**: Pre-configured for seamless Railway deployment
- ✅ **HTTP Transport**: Runs in HTTP mode suitable for web deployment
- ✅ **Health Checks**: Built-in health endpoint for Railway monitoring
- ✅ **Auto-scaling**: Compatible with Railway's auto-scaling features
- ✅ **Persistent Storage**: Optional token persistence with Railway volumes
- ✅ **Environment Variables**: Production-ready configuration

## Deployment Options

### Option 1: One-Click Deploy (Recommended)

1. Click the "Deploy on Railway" button above
2. Connect your GitHub account
3. Set required environment variables
4. Deploy!

### Option 2: Manual Deployment

1. **Clone this repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/google-calendar-mcp.git
   cd google-calendar-mcp
   ```

2. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

3. **Deploy**
   ```bash
   ./deploy-railway.sh
   ```

## Required Environment Variables

Set these in your Railway dashboard:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `TRANSPORT` | Transport mode | `http` |
| `HOST` | Server host | `0.0.0.0` |
| `DEBUG` | Debug mode | `false` |
| `GOOGLE_OAUTH_CREDENTIALS_BASE64` | Base64 encoded OAuth credentials | `eyJ3ZWIiOnsiY2x...` |

## Setting Up Google OAuth

1. **Go to Google Cloud Console**
   - Create a new project or select existing
   - Enable Google Calendar API

2. **Create OAuth 2.0 Credentials**
   - Go to Credentials → Create Credentials → OAuth client ID
   - Choose "Desktop application" type
   - Download the JSON file

3. **Encode Credentials for Railway**
   ```bash
   base64 -i gcp-oauth.keys.json
   ```
   
4. **Set in Railway**
   ```bash
   railway variables set GOOGLE_OAUTH_CREDENTIALS_BASE64="YOUR_BASE64_STRING"
   ```

## Authentication Flow

1. Visit your Railway app URL
2. Follow OAuth authentication prompts
3. Grant calendar permissions
4. Tokens are automatically managed

## API Endpoints

- `GET /health` - Health check endpoint
- `POST /mcp` - MCP protocol endpoint
- `GET /` - Authentication and status page

## Available Tools

- `list-calendars` - List all available calendars
- `list-events` - List events with date filtering
- `search-events` - Search events by text query
- `create-event` - Create new calendar events
- `update-event` - Update existing events
- `delete-event` - Delete events
- `get-freebusy` - Check availability across calendars

## Configuration

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GOOGLE_CALENDAR_MCP_TOKEN_PATH` | Token storage path | `/app/data/tokens` |
| `KEEP_ALIVE_TIMEOUT` | Keep-alive timeout | `65000` |
| `HEADER_TIMEOUT` | Header timeout | `66000` |

### Persistent Storage

For token persistence across deployments:

1. Add a Railway volume
2. Mount to `/app/data`
3. Set `GOOGLE_CALENDAR_MCP_TOKEN_PATH=/app/data/tokens`

## Monitoring & Debugging

### Health Checks
```bash
curl https://your-app.railway.app/health
```

### View Logs
```bash
railway logs
```

### Check Status
```bash
railway status
```

## Usage with AI Assistants

### Claude Desktop Integration

Add to your Claude Desktop config:
```json
{
  "mcpServers": {
    "google-calendar": {
      "command": "curl",
      "args": ["-X", "POST", "https://your-app.railway.app/mcp"],
      "env": {}
    }
  }
}
```

### Direct API Usage

```bash
# List calendars
curl -X POST https://your-app.railway.app/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "list-calendars"}'

# Create event
curl -X POST https://your-app.railway.app/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "create-event",
    "params": {
      "summary": "Meeting with team",
      "start": "2024-01-15T10:00:00Z",
      "end": "2024-01-15T11:00:00Z"
    }
  }'
```

## Security

- 🔒 OAuth tokens stored securely
- 🔒 HTTPS enforced in production
- 🔒 Environment variables for sensitive data
- 🔒 No credentials in source code
- 🔒 Health checks don't expose sensitive data

## Troubleshooting

### Common Issues

**Authentication Errors**
- Verify OAuth credentials are base64 encoded correctly
- Check Google Cloud Console API quotas
- Ensure correct OAuth application type (Desktop)

**Connection Issues**
- Verify Railway app is running: `railway ps`
- Check health endpoint: `curl https://your-app.railway.app/health`
- Review logs: `railway logs`

**Token Issues**
- Tokens expire after 7 days in test mode
- Publish OAuth app to production mode for persistent tokens
- Use persistent storage for token management

### Support

- Railway deployment issues: Check Railway docs
- Google Calendar API issues: Check Google Cloud Console
- MCP protocol issues: Check original repository

## Contributing

1. Fork this repository
2. Create a feature branch
3. Test your changes locally
4. Deploy to Railway for testing
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Original project by [nspady](https://github.com/nspady/google-calendar-mcp)
- Railway platform for hosting
- Google Calendar API
- Model Context Protocol (MCP) specification
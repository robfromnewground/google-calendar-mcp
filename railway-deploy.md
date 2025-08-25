# Railway Deployment Guide for Google Calendar MCP

This guide explains how to deploy the Google Calendar MCP server to Railway.

## Prerequisites

1. Railway account (sign up at https://railway.app)
2. Railway CLI installed (`npm install -g @railway/cli`)
3. Google Cloud Project with Calendar API enabled
4. OAuth 2.0 credentials (Desktop application type)

## Deployment Steps

### 1. Prepare Your Google OAuth Credentials

1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials (Desktop application type)
3. Download the credentials JSON file
4. Convert to base64 for Railway storage:
   ```bash
   base64 -i gcp-oauth.keys.json
   ```

### 2. Deploy to Railway

#### Option A: Using Railway CLI

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Create a new Railway project:
   ```bash
   railway new
   ```

4. Deploy the project:
   ```bash
   railway up
   ```

#### Option B: Using Git Integration

1. Push this repository to GitHub
2. Connect your GitHub repository to Railway
3. Railway will automatically detect the Dockerfile and deploy

### 3. Set Environment Variables

Set these environment variables in Railway:

#### Required Variables:
- `NODE_ENV`: `production`
- `TRANSPORT`: `http`
- `HOST`: `0.0.0.0`
- `DEBUG`: `false`
- `GOOGLE_OAUTH_CREDENTIALS_BASE64`: (your base64 encoded credentials)

#### Optional Variables:
- `GOOGLE_CALENDAR_MCP_TOKEN_PATH`: `/app/data/tokens` (if using persistent storage)
- `KEEP_ALIVE_TIMEOUT`: `65000`
- `HEADER_TIMEOUT`: `66000`

### 4. Configure Persistent Storage (Optional)

If you want to persist OAuth tokens between deployments:

1. Add a volume in Railway dashboard
2. Mount it to `/app/data`
3. Set `GOOGLE_CALENDAR_MCP_TOKEN_PATH=/app/data/tokens`

### 5. Set Up Domain (Optional)

1. Go to Railway dashboard
2. Go to your service settings
3. Generate a domain or add a custom domain

## Authentication Flow

Since this is deployed as a web service, the OAuth flow will work differently:

1. The server will start in HTTP mode
2. Visit your Railway app URL
3. Follow the OAuth authentication prompts
4. Tokens will be stored persistently (if you configured volumes)

## Health Checks

The deployment includes automatic health checks at `/health` endpoint.

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Node environment | `production` | Yes |
| `TRANSPORT` | Transport mode | `http` | Yes |
| `HOST` | Server host | `0.0.0.0` | Yes |
| `PORT` | Server port | Set by Railway | No |
| `DEBUG` | Debug mode | `false` | No |
| `GOOGLE_OAUTH_CREDENTIALS_BASE64` | Base64 encoded OAuth credentials | - | Yes |
| `GOOGLE_CALENDAR_MCP_TOKEN_PATH` | Token storage path | `/app/data/tokens` | No |

## Troubleshooting

### Common Issues:

1. **Authentication Errors**: Ensure your OAuth credentials are properly base64 encoded
2. **Port Issues**: Railway automatically sets the PORT variable
3. **Permissions**: Make sure your OAuth app has the correct scopes
4. **Token Storage**: Use persistent volumes for token storage in production

### Logs:

Check Railway logs in the dashboard or via CLI:
```bash
railway logs
```

### Health Check:

Test the health endpoint:
```bash
curl https://your-app.railway.app/health
```

## Security Considerations

1. Never commit OAuth credentials to version control
2. Use Railway's environment variables for sensitive data
3. Consider using Railway's private networking for internal services
4. Regularly rotate OAuth credentials
5. Monitor access logs and usage

## Scaling

Railway automatically handles scaling based on traffic. For high-volume usage:

1. Consider using Railway's auto-scaling features
2. Monitor memory and CPU usage
3. Implement rate limiting if needed
4. Use persistent storage for token management
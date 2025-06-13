# Deployment Guide

This guide covers deploying the Google Calendar MCP Server for remote access via HTTP transport.

## Transport Modes

### stdio Transport (Default)
- Local use only
- Direct communication with Claude Desktop
- No network exposure
- Automatic authentication handling

### HTTP Transport
- Remote deployment capable
- Server-Sent Events (SSE) for real-time communication
- Built-in security features
- Suitable for cloud deployment

## HTTP Server Features

- ✅ **Session Management**: Secure session-based connections
- ✅ **CORS Support**: Configurable cross-origin access
- ✅ **Rate Limiting**: Protection against abuse (100 requests per IP per 15 minutes)
- ✅ **Health Monitoring**: Health check endpoints
- ✅ **Graceful Shutdown**: Proper resource cleanup
- ✅ **Origin Validation**: DNS rebinding protection

## Local HTTP Deployment

### Basic HTTP Server

```bash
# Start on localhost only (default port 3000)
npm run start:http

# Custom port
PORT=8080 npm run start:http
```

### Public HTTP Server

```bash
# Listen on all interfaces (0.0.0.0)
npm run start:http:public

# With custom port
PORT=8080 npm run start:http:public
```

### Environment Variables

```bash
PORT=3000                    # Server port
HOST=localhost              # Bind address
SESSION_SECRET=your-secret  # Session encryption key
ALLOWED_ORIGINS=http://localhost:3000,https://myapp.com
```

## Docker Deployment

### Using Pre-built Image

```bash
docker pull ghcr.io/nspady/google-calendar-mcp:latest

docker run -d \
  -p 3000:3000 \
  -v /path/to/credentials:/app/credentials \
  -e GOOGLE_OAUTH_CREDENTIALS=/app/credentials/gcp-oauth.keys.json \
  -e SESSION_SECRET=your-secure-secret \
  --name calendar-mcp \
  ghcr.io/nspady/google-calendar-mcp:latest
```

### Building Custom Image

```dockerfile
FROM node:22-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy built application
COPY build/ ./build/
COPY gcp-oauth.keys.json ./

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000
CMD ["node", "build/index.js", "--transport", "http", "--http-host", "0.0.0.0"]
```

Build and run:
```bash
docker build -t calendar-mcp .
docker run -d -p 3000:3000 --name calendar-mcp calendar-mcp
```

## Cloud Deployment

### Google Cloud Run

```bash
# Build and push image
gcloud builds submit --tag gcr.io/PROJECT-ID/calendar-mcp

# Deploy
gcloud run deploy calendar-mcp \
  --image gcr.io/PROJECT-ID/calendar-mcp \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="SESSION_SECRET=your-secret"
```

### AWS ECS

1. Push image to ECR
2. Create task definition with environment variables
3. Deploy service with ALB

### Heroku

```bash
# Create app
heroku create your-calendar-mcp

# Set buildpack
heroku buildpacks:set heroku/nodejs

# Configure
heroku config:set SESSION_SECRET=your-secret
heroku config:set GOOGLE_OAUTH_CREDENTIALS=./gcp-oauth.keys.json

# Deploy
git push heroku main
```

## Security Configuration

### HTTPS/TLS

Always use HTTPS in production:

1. **Behind a Reverse Proxy** (Recommended)
   ```nginx
   server {
       listen 443 ssl;
       server_name calendar-mcp.example.com;
       
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection '';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

2. **Direct TLS** (Built-in)
   ```bash
   # Provide cert and key
   TLS_CERT=/path/to/cert.pem \
   TLS_KEY=/path/to/key.pem \
   npm run start:http:public
   ```

### CORS Configuration

```bash
# Single origin
ALLOWED_ORIGINS=https://myapp.com

# Multiple origins
ALLOWED_ORIGINS=https://app1.com,https://app2.com

# Development (be careful!)
ALLOWED_ORIGINS=*
```

### Authentication Flow

1. Client connects to HTTP endpoint
2. Server redirects to Google OAuth
3. User authenticates with Google
4. Server stores tokens securely
5. Client receives session token
6. All requests use session token

## Monitoring

### Health Checks

```bash
# Liveness probe
curl http://localhost:3000/health

# Readiness probe
curl http://localhost:3000/health/ready

# Server info
curl http://localhost:3000/info
```

### Logging

```bash
# Enable debug logging
DEBUG=mcp:* npm run start:http

# JSON logging for production
NODE_ENV=production npm run start:http
```

### Metrics

The server exposes basic metrics:
- Request count
- Error rate
- Response time
- Active sessions

## Production Checklist

- [ ] Use HTTPS/TLS encryption
- [ ] Set strong SESSION_SECRET
- [ ] Configure CORS appropriately
- [ ] Enable rate limiting
- [ ] Set up monitoring/alerting
- [ ] Configure log aggregation
- [ ] Implement backup strategy
- [ ] Test disaster recovery
- [ ] Review security headers
- [ ] Enable graceful shutdown

## Troubleshooting

### Connection Issues
- Check firewall rules
- Verify CORS configuration
- Test with curl first

### Authentication Failures
- Ensure credentials are accessible
- Check token permissions
- Verify redirect URIs

### Performance Problems
- Enable caching headers
- Use CDN for static assets
- Monitor memory usage

See [Troubleshooting Guide](troubleshooting.md) for more solutions.
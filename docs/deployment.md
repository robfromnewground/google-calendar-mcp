# Deployment Guide - Google Calendar MCP Server

This guide covers deploying the Google Calendar MCP Server in HTTP transport mode for remote access.

## Prerequisites

1. **Google Cloud Setup**: Complete the OAuth setup as described in the main README
2. **Authentication Tokens**: Run `npm run auth` locally to generate tokens
3. **Docker** (for containerized deployment)

## Local HTTP Deployment

### Quick Start

```bash
# 1. Build the project
npm run build

# 2. Start in HTTP mode
npm run start:http

# 3. Test the server
curl http://localhost:3000/health
```

The server will be available at:
- **SSE Endpoint**: `http://localhost:3000/sse`
- **Health Check**: `http://localhost:3000/health`
- **Server Info**: `http://localhost:3000/info`

### Custom Configuration

```bash
# Custom port and host
node build/index.js --transport http --port 8080 --host 0.0.0.0

# With custom allowed origins
node build/index.js --transport http --allowed-origins "https://myapp.com,https://anotherapp.com"

# Debug mode
node build/index.js --transport http --debug
```

## Docker Deployment

### Using Docker Compose (Recommended)

```bash
# 1. Ensure you have the required files
ls gcp-oauth.keys.json .gcp-saved-tokens.json

# 2. Start with Docker Compose
docker-compose up -d

# 3. Check status
docker-compose ps
docker-compose logs google-calendar-mcp

# 4. Test
curl http://localhost:3000/health
```

### Manual Docker Deployment

```bash
# 1. Build the image
docker build -f Dockerfile.http -t google-calendar-mcp:http .

# 2. Run the container
docker run -d \
  --name google-calendar-mcp \
  -p 3000:3000 \
  -v $(pwd)/gcp-oauth.keys.json:/app/gcp-oauth.keys.json:ro \
  -v $(pwd)/.gcp-saved-tokens.json:/app/.gcp-saved-tokens.json \
  google-calendar-mcp:http

# 3. Check logs
docker logs google-calendar-mcp

# 4. Test
curl http://localhost:3000/health
```

## Cloud Platform Deployment

### AWS ECS/Fargate

1. **Build and push image to ECR**:
```bash
# Create ECR repository
aws ecr create-repository --repository-name google-calendar-mcp

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and tag
docker build -f Dockerfile.http -t google-calendar-mcp:http .
docker tag google-calendar-mcp:http <account-id>.dkr.ecr.us-east-1.amazonaws.com/google-calendar-mcp:latest

# Push
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/google-calendar-mcp:latest
```

2. **Create ECS Task Definition**:
```json
{
  "family": "google-calendar-mcp",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "google-calendar-mcp",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/google-calendar-mcp:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "GCP_OAUTH_KEYS",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:google-calendar-mcp/oauth-keys"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/google-calendar-mcp",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Google Cloud Run

```bash
# 1. Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/PROJECT-ID/google-calendar-mcp

# 2. Deploy to Cloud Run
gcloud run deploy google-calendar-mcp \
  --image gcr.io/PROJECT-ID/google-calendar-mcp \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10
```

### Azure Container Instances

```bash
# 1. Create resource group
az group create --name google-calendar-mcp-rg --location eastus

# 2. Create container registry
az acr create --resource-group google-calendar-mcp-rg --name gcmcpregistry --sku Basic

# 3. Build and push
az acr build --registry gcmcpregistry --image google-calendar-mcp:latest .

# 4. Deploy container instance
az container create \
  --resource-group google-calendar-mcp-rg \
  --name google-calendar-mcp \
  --image gcmcpregistry.azurecr.io/google-calendar-mcp:latest \
  --dns-name-label google-calendar-mcp \
  --ports 3000 \
  --cpu 1 \
  --memory 1
```

## Security Configuration

### Environment Variables

Set these environment variables for production deployment:

```bash
# Required
TRANSPORT=http
PORT=3000
HOST=0.0.0.0

# Security
ALLOWED_ORIGINS=https://your-client-domain.com,https://another-domain.com
NODE_ENV=production

# Optional
DEBUG=false
SESSION_TIMEOUT=1800000  # 30 minutes in milliseconds
```

### Secrets Management

**AWS Secrets Manager**:
```bash
# Store OAuth keys
aws secretsmanager create-secret \
  --name google-calendar-mcp/oauth-keys \
  --secret-string file://gcp-oauth.keys.json

# Store tokens
aws secretsmanager create-secret \
  --name google-calendar-mcp/tokens \
  --secret-string file://.gcp-saved-tokens.json
```

**Google Secret Manager**:
```bash
# Store OAuth keys
gcloud secrets create google-calendar-mcp-oauth-keys \
  --data-file=gcp-oauth.keys.json

# Store tokens
gcloud secrets create google-calendar-mcp-tokens \
  --data-file=.gcp-saved-tokens.json
```

### Network Security

1. **Use HTTPS**: Always deploy behind a load balancer with SSL/TLS
2. **Firewall Rules**: Restrict access to necessary ports only
3. **VPC/Subnet**: Deploy in private subnets when possible
4. **Security Groups**: Configure minimal required access

### Load Balancer Configuration

**AWS Application Load Balancer**:
```yaml
# ALB Target Group Health Check
HealthCheckPath: /health
HealthCheckProtocol: HTTP
HealthCheckPort: 3000
HealthyThresholdCount: 2
UnhealthyThresholdCount: 3
HealthCheckTimeoutSeconds: 5
HealthCheckIntervalSeconds: 30
```

**NGINX Reverse Proxy**:
```nginx
upstream google_calendar_mcp {
    server localhost:3000;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://google_calendar_mcp;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # SSE specific settings
        proxy_buffering off;
        proxy_cache off;
    }
}
```

## Monitoring and Logging

### Health Checks

The server provides built-in health check endpoints:

```bash
# Basic health check
curl http://localhost:3000/health

# Server information
curl http://localhost:3000/info
```

### Logging

Configure structured logging for production:

```javascript
// Add to your deployment configuration
{
  "logging": {
    "level": "info",
    "format": "json",
    "destination": "stdout"
  }
}
```

### Metrics

Monitor these key metrics:
- **Response Time**: SSE connection establishment time
- **Active Sessions**: Number of concurrent MCP sessions
- **Error Rate**: Failed authentication or tool calls
- **Memory Usage**: Container memory consumption
- **CPU Usage**: Container CPU utilization

## Troubleshooting

### Common Issues

1. **Connection Refused**:
   - Check if the server is running: `curl http://localhost:3000/health`
   - Verify port binding: `netstat -tlnp | grep 3000`
   - Check firewall rules

2. **CORS Errors**:
   - Verify `--allowed-origins` configuration
   - Check browser developer tools for specific CORS errors
   - Ensure proper preflight handling

3. **Authentication Failures**:
   - Verify OAuth credentials are mounted correctly
   - Check token file permissions
   - Ensure tokens haven't expired

4. **SSE Connection Issues**:
   - Check proxy configuration for SSE support
   - Verify `proxy_buffering off` in NGINX
   - Test direct connection without proxy

### Debug Mode

Enable debug logging:

```bash
node build/index.js --transport http --debug
```

### Container Debugging

```bash
# Check container logs
docker logs google-calendar-mcp

# Execute shell in container
docker exec -it google-calendar-mcp sh

# Check mounted files
docker exec google-calendar-mcp ls -la /app/
```

## Performance Tuning

### Container Resources

Recommended resource allocation:
- **CPU**: 0.5-1 vCPU for light usage, 1-2 vCPU for heavy usage
- **Memory**: 512MB-1GB depending on concurrent sessions
- **Storage**: Minimal (< 100MB for application)

### Scaling

For high availability:
1. **Horizontal Scaling**: Deploy multiple instances behind a load balancer
2. **Session Affinity**: Configure sticky sessions if needed
3. **Health Checks**: Implement proper health check endpoints
4. **Graceful Shutdown**: Ensure proper cleanup on container stop

### Connection Limits

Configure appropriate limits:
```javascript
// In your deployment configuration
{
  "maxConnections": 100,
  "sessionTimeout": 1800000,  // 30 minutes
  "rateLimitWindow": 60000,   // 1 minute
  "rateLimitMax": 100         // requests per window
}
``` 
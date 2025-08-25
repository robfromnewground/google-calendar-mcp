# Google Calendar MCP Server - Railway Optimized Dockerfile
# syntax=docker/dockerfile:1

FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs nodejs

# Set working directory
WORKDIR /app

# Copy package files for dependency caching
COPY package*.json ./

# Copy build scripts and source files needed for build
COPY scripts ./scripts
COPY src ./src
COPY tsconfig.json .

# Install all dependencies (including dev dependencies for build)
RUN npm ci --no-audit --no-fund --silent

# Build the project
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production --silent

# Create config directory and set permissions
RUN mkdir -p /home/nodejs/.config/google-calendar-mcp && \
    chown -R nodejs:nodejs /home/nodejs/.config && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port for Railway (Railway will provide $PORT)
EXPOSE $PORT

# Health check for Railway
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

# Railway compatible command - use environment variables
CMD ["sh", "-c", "node build/index.js --transport http --port ${PORT:-3000} --host 0.0.0.0"]
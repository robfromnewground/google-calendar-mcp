#!/bin/bash

# Railway Deployment Script for Google Calendar MCP
# Usage: ./deploy-railway.sh

set -e

echo "🚀 Starting Railway deployment for Google Calendar MCP..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check if user is logged in to Railway
if ! railway whoami &> /dev/null; then
    echo "🔐 Please log in to Railway..."
    railway login
fi

# Check if we're in a Railway project
if ! railway status &> /dev/null; then
    echo "📁 Creating new Railway project..."
    railway new --name "google-calendar-mcp"
fi

# Build the project locally first to ensure it compiles
echo "🔨 Building project locally..."
npm install
npm run build

# Set essential environment variables
echo "⚙️  Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set TRANSPORT=http
railway variables set HOST=0.0.0.0
railway variables set DEBUG=false

# Check if OAuth credentials file exists
if [ ! -f "gcp-oauth.keys.json" ]; then
    echo "⚠️  OAuth credentials file not found!"
    echo "Please add your gcp-oauth.keys.json file and run:"
    echo "railway variables set GOOGLE_OAUTH_CREDENTIALS_BASE64=\$(base64 -i gcp-oauth.keys.json)"
    echo ""
fi

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Set your Google OAuth credentials:"
echo "   railway variables set GOOGLE_OAUTH_CREDENTIALS_BASE64=\$(base64 -i gcp-oauth.keys.json)"
echo ""
echo "2. Visit your app:"
railway domain
echo ""
echo "3. Check deployment status:"
echo "   railway status"
echo ""
echo "4. View logs:"
echo "   railway logs"
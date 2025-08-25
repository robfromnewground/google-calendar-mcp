import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import http from "http";

export interface HttpTransportConfig {
  port?: number;
  host?: string;
}

export class HttpTransportHandler {
  private server: McpServer;
  private config: HttpTransportConfig;

  constructor(server: McpServer, config: HttpTransportConfig = {}) {
    this.server = server;
    this.config = config;
  }

  async connect(): Promise<void> {
    const port = this.config.port || 3000;
    const host = this.config.host || '127.0.0.1';
    
    // Configure transport for stateless mode to allow multiple initialization cycles
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined // Stateless mode - allows multiple initializations
    });

    await this.server.connect(transport);
    
    // Create HTTP server to handle the StreamableHTTP transport
    const httpServer = http.createServer(async (req, res) => {
      // Validate Origin header to prevent DNS rebinding attacks (MCP spec requirement)
      const origin = req.headers.origin;
      const allowedOrigins = [
        'http://localhost',
        'http://127.0.0.1',
        'https://localhost', 
        'https://127.0.0.1'
      ];
      
      // For requests with Origin header, validate it
      if (origin && !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Forbidden: Invalid origin',
          message: 'Origin header validation failed'
        }));
        return;
      }

      // Basic request size limiting (prevent DoS)
      const contentLength = parseInt(req.headers['content-length'] || '0', 10);
      const maxRequestSize = 10 * 1024 * 1024; // 10MB limit
      if (contentLength > maxRequestSize) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Payload Too Large',
          message: 'Request size exceeds maximum allowed size'
        }));
        return;
      }

      // Handle CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');
      
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // Validate Accept header for MCP requests (spec requirement)
      if (req.method === 'POST' || req.method === 'GET') {
        const acceptHeader = req.headers.accept;
        if (acceptHeader && !acceptHeader.includes('application/json') && !acceptHeader.includes('text/event-stream') && !acceptHeader.includes('*/*')) {
          res.writeHead(406, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Not Acceptable',
            message: 'Accept header must include application/json or text/event-stream'
          }));
          return;
        }
      }

      // Handle health check endpoint
      if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'healthy',
          server: 'google-calendar-mcp',
          version: '1.3.0',
          timestamp: new Date().toISOString()
        }));
        return;
      }

      // Handle auth endpoint for OAuth flow
      if (req.method === 'GET' && req.url === '/auth') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
<!DOCTYPE html>
<html>
<head>
  <title>Google Calendar Authentication</title>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; line-height: 1.6; }
    .header { text-align: center; margin-bottom: 40px; }
    .auth-section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .warning { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .auth-button { display: inline-block; background: #4285f4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 10px; }
    .auth-button:hover { background: #3367d6; }
    h1 { color: #2c3e50; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔐 Google Calendar Authentication</h1>
    <p>Authenticate with your Google account to access your calendar</p>
  </div>

  <div class="warning">
    <strong>⚠️ OAuth Configuration Needed:</strong> The OAuth authentication server is not currently running. 
    This requires the service to be configured with Google OAuth credentials and start the authentication server.
  </div>

  <div class="auth-section">
    <h3>Individual User Authentication</h3>
    <p>Each user authenticates with their own Google account to access their personal calendar data.</p>
    <p><strong>Coming Soon:</strong> OAuth authentication flow will be available once the service is properly configured.</p>
    <a href="/" class="auth-button">← Back to Service Info</a>
  </div>

  <div style="margin-top: 40px; padding: 20px; background: #e8f5e8; border-radius: 8px;">
    <h3>For Administrators:</h3>
    <p>To enable OAuth authentication:</p>
    <ol>
      <li>Ensure GOOGLE_OAUTH_CREDENTIALS environment variable is set</li>
      <li>Ensure OAUTH_BASE_URL environment variable is set</li>
      <li>The service will automatically start the OAuth server when properly configured</li>
    </ol>
  </div>
</body>
</html>
        `);
        return;
      }

      // Handle root endpoint for browser visits
      if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
<!DOCTYPE html>
<html>
<head>
  <title>Google Calendar MCP Server</title>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
    .header { text-align: center; margin-bottom: 40px; }
    .status { background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .warning { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .code { background: #f5f5f5; padding: 10px; border-radius: 4px; font-family: 'Monaco', monospace; overflow-x: auto; }
    .section { margin: 30px 0; }
    h1 { color: #2c3e50; }
    h2 { color: #34495e; border-bottom: 2px solid #ecf0f1; padding-bottom: 10px; }
    a { color: #3498db; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🗓️ Google Calendar MCP Server</h1>
    <p>Model Context Protocol server for Google Calendar integration</p>
  </div>

  <div class="status">
    <strong>✅ Service Status:</strong> Running and healthy<br>
    <strong>🔗 Version:</strong> 1.3.0<br>
    <strong>📡 Transport:</strong> HTTP Mode<br>
    <strong>⏰ Started:</strong> ${new Date().toISOString()}
  </div>

  <div class="warning">
    <strong>⚠️ OAuth Setup Required:</strong> This service needs Google OAuth credentials to access calendar data. 
    Until configured, calendar operations will return authentication errors.
  </div>

  <div class="section">
    <h2>🔧 How to Use This Service</h2>
    
    <h3>For MCP Clients (Claude Desktop, etc.)</h3>
    <p>Add this configuration to your MCP client:</p>
    <div class="code">
{
  "mcpServers": {
    "google-calendar": {
      "command": "node",
      "args": ["--input", "json"],
      "env": {
        "MCP_SERVER_URL": "${req.headers.host}"
      }
    }
  }
}
    </div>

    <h3>🔐 OAuth Authentication Setup</h3>
    <p>To enable calendar access, you need to:</p>
    <ol>
      <li>Create Google OAuth credentials in <a href="https://console.cloud.google.com" target="_blank">Google Cloud Console</a></li>
      <li>Enable the Google Calendar API</li>
      <li>Set environment variables in Railway deployment</li>
      <li>Users will authenticate via web interface</li>
    </ol>
  </div>

  <div class="section">
    <h2>🚀 Available Endpoints</h2>
    <ul>
      <li><strong>GET /</strong> - This information page</li>
      <li><strong>GET /health</strong> - Service health check</li>
      <li><strong>POST /</strong> - MCP protocol endpoint</li>
      <li><strong>GET /auth</strong> - <a href="/auth">OAuth authentication flow</a></li>
    </ul>
  </div>

  <div class="section">
    <h2>📚 Documentation</h2>
    <p>For more information:</p>
    <ul>
      <li><a href="https://github.com/robfromnewground/google-calendar-mcp" target="_blank">GitHub Repository</a></li>
      <li><a href="https://modelcontextprotocol.io" target="_blank">Model Context Protocol</a></li>
      <li><a href="https://developers.google.com/calendar" target="_blank">Google Calendar API</a></li>
    </ul>
  </div>
</body>
</html>
        `);
        return;
      }

      try {
        await transport.handleRequest(req, res);
      } catch (error) {
        process.stderr.write(`Error handling request: ${error instanceof Error ? error.message : error}\n`);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Internal server error',
            },
            id: null,
          }));
        }
      }
    });

    httpServer.listen(port, host, () => {
      process.stderr.write(`Google Calendar MCP Server listening on http://${host}:${port}\n`);
    });
  }
} 
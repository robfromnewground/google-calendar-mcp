import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { OAuth2Client } from "google-auth-library";
import { fileURLToPath } from "url";
import { randomUUID } from "node:crypto";
import http from "http";

// Import authentication components
import { initializeOAuth2Client } from './auth/client.js';
import { AuthServer } from './auth/server.js';
import { TokenManager } from './auth/tokenManager.js';

// Import tool definitions
import { registerAllTools } from './tools/definitions.js';

// Import config
import { parseArgs, ServerConfig } from './config/TransportConfig.js';


// --- Global Variables ---

let oauth2Client: OAuth2Client;
let tokenManager: TokenManager;
let authServer: AuthServer;
let config: ServerConfig;

// Create the modern MCP server
const server = new McpServer({
  name: "google-calendar",
  version: "1.2.0"
});

// --- Helper Functions ---

async function ensureAuthenticated() {
  // Check if we already have valid tokens
  if (await tokenManager.validateTokens()) {
    return;
  }

  // If no valid tokens, try to start auth server if not already running
  try {
    const openBrowser = config.transport.type === 'stdio';
    const authSuccess = await authServer.start(openBrowser);
    
    if (!authSuccess) {
      const mode = config.transport.type === 'http' ? 'HTTP' : 'stdio';
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Authentication required. Please run 'npm run auth' to authenticate, or visit the auth URL shown in the logs for ${mode} mode.`
      );
    }

    // Give some time for user to complete authentication if browser was opened
    if (openBrowser) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        "Authentication flow started. Please complete authentication in your browser, then retry this operation."
      );
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    if (error instanceof Error) {
      throw new McpError(ErrorCode.InvalidRequest, error.message);
    }
    throw new McpError(ErrorCode.InvalidRequest, "Authentication required. Please run 'npm run auth' to authenticate.");
  }
}

async function executeWithHandler(handler: any, args: any): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  await ensureAuthenticated();
  const result = await handler.runTool(args, oauth2Client);
  return result;
}

// --- Main Application Logic --- 
async function main() {
  try {
    // 1. Parse command line arguments
    config = parseArgs(process.argv.slice(2));
    
    // 2. Initialize Authentication (but don't block on it)
    oauth2Client = await initializeOAuth2Client();
    tokenManager = new TokenManager(oauth2Client);
    authServer = new AuthServer(oauth2Client);

    // 3. Set up Modern Tool Definitions
    registerAllTools(server, executeWithHandler);

    // 4. Create and Connect Transport (don't wait for auth)
    await createAndConnectTransport();

    // 5. Set up Graceful Shutdown
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);

  } catch (error: unknown) {
    process.stderr.write(`Failed to start server: ${error instanceof Error ? error.message : error}\n`);
    process.exit(1);
  }
}


// --- Modern Transport Setup ---

async function createAndConnectTransport() {
  switch (config.transport.type) {
    case 'stdio':
      const stdioTransport = new StdioServerTransport();
      await server.connect(stdioTransport);
      break;
      
    case 'http':
      const port = config.transport.port || 3000;
      const host = config.transport.host || '127.0.0.1';
      
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID()
      });

      await server.connect(transport);
      
      // Create HTTP server to handle the StreamableHTTP transport
      const httpServer = http.createServer(async (req, res) => {
        // Handle CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');
        
        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }

        // Handle health check endpoint
        if (req.method === 'GET' && req.url === '/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'healthy',
            server: 'google-calendar-mcp',
            version: '1.2.0',
            timestamp: new Date().toISOString()
          }));
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
      
      break;
      
    default:
      throw new Error(`Unsupported transport type: ${config.transport.type}`);
  }
}

// --- Cleanup Logic --- 
async function cleanup() {
  try {
    if (authServer) {
      await authServer.stop();
    }
    
    // McpServer handles transport cleanup automatically
    server.close();
    
    process.exit(0);
  } catch (error: unknown) {
    process.stderr.write(`Error during cleanup: ${error instanceof Error ? error.message : error}\n`);
    process.exit(1);
  }
}

// --- Exports & Execution Guard --- 
// Export server and main for testing or potential programmatic use
export { main, server };

// Run main() only when this script is executed directly
const isDirectRun = import.meta.url.startsWith('file://') && process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((error) => {
    process.stderr.write(`Unhandled error: ${error instanceof Error ? error.message : error}\n`);
    process.exit(1);
  });
}

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { OAuth2Client } from "google-auth-library";
import { fileURLToPath } from "url";

// Import modular components
import { initializeOAuth2Client } from './auth/client.js';
import { AuthServer } from './auth/server.js';
import { TokenManager } from './auth/tokenManager.js';
import { getToolDefinitions } from './handlers/listTools.js';
import { handleCallTool } from './handlers/callTool.js';

// Import transport system
import { parseArgs, ServerConfig } from './config/TransportConfig.js';
import { TransportFactory, Transport } from './transport/TransportFactory.js';

// --- Global Variables --- 
// Create server instance (global for export)
const server = new Server(
  {
    name: "google-calendar",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

let oauth2Client: OAuth2Client;
let tokenManager: TokenManager;
let authServer: AuthServer;
let transport: Transport;
let config: ServerConfig;

// --- Main Application Logic --- 
async function main() {
  try {
    // 1. Parse command line arguments
    config = parseArgs(process.argv.slice(2));
    
    if (config.debug) {
      console.log('Configuration:', JSON.stringify(config, null, 2));
    }

    // 2. Initialize Authentication based on transport type
    if (config.transport.type === 'stdio' || config.transport.authMode === 'local') {
      // Local authentication flow (current behavior)
      oauth2Client = await initializeOAuth2Client();
      tokenManager = new TokenManager(oauth2Client);
      authServer = new AuthServer(oauth2Client);

      // Start auth server if authentication is required
      const authSuccess = await authServer.start();
      if (!authSuccess) {
        console.error('Authentication failed');
        process.exit(1);
      }
    } else {
      // For HTTP transport with remote auth, we'll need to handle authentication differently
      // For now, we'll require local auth setup even for HTTP transport
      console.log('Note: HTTP transport currently requires local OAuth setup');
      oauth2Client = await initializeOAuth2Client();
      tokenManager = new TokenManager(oauth2Client);
      authServer = new AuthServer(oauth2Client);

      const authSuccess = await authServer.start(false); // Don't open browser for HTTP mode
      if (!authSuccess) {
        console.error('Authentication failed. Please run "npm run auth" first for HTTP mode.');
        process.exit(1);
      }
    }

    // 3. Set up MCP Handlers
    
    // List Tools Handler
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return getToolDefinitions();
    });

    // Call Tool Handler
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      // Check if tokens are valid before handling the request
      if (!(await tokenManager.validateTokens())) {
        throw new Error("Authentication required. Please run 'npm run auth' to authenticate.");
      }
      
      // Delegate the actual tool execution to the specialized handler
      return handleCallTool(request, oauth2Client);
    });

    // 4. Create and Connect Transport
    transport = await TransportFactory.create(config.transport);
    await transport.connect(server);

    // 5. Set up Graceful Shutdown
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);

    if (config.transport.type === 'stdio') {
      console.log('Google Calendar MCP Server started (stdio mode)');
    }

  } catch (error: unknown) {
    console.error('Failed to start server:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// --- Cleanup Logic --- 
async function cleanup() {
  try {
    console.log('\nShutting down gracefully...');
    
    if (transport) {
      await transport.close();
    }
    
    if (authServer) {
      await authServer.stop();
    }
    
    process.exit(0);
  } catch (error: unknown) {
    console.error('Error during cleanup:', error instanceof Error ? error.message : error);
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
    console.error('Unhandled error:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

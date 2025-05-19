import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  CallToolResult
} from "@modelcontextprotocol/sdk/types.js";
import { OAuth2Client } from "google-auth-library";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import express from "express";
import http from 'http';

// Import modular components
import { initializeOAuth2Client } from './auth/client.js';
import { AuthServer } from './auth/server.js';
import { TokenManager } from './auth/tokenManager.js';
import { getToolDefinitions } from './handlers/listTools.js';
import { handleCallTool } from './handlers/callTool.js';
import { StreamCallback, StreamingChunk } from "./schemas/types.js";

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
      // Add streaming capability flag
      streaming: {}
    },
  }
);

let oauth2Client: OAuth2Client;
let tokenManager: TokenManager;
let authServer: AuthServer;

const MAX_PORT_RETRIES = 10;
const DEFAULT_PORT = 3000;

async function tryStartServer(app: express.Express, port: number, retriesLeft: number): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    if (retriesLeft < 0) {
      reject(new Error(`Failed to bind to a port after ${MAX_PORT_RETRIES} retries.`));
      return;
    }

    const httpServer = app.listen(port, () => {
      console.log(`Server is now running on port ${port}`);
      resolve(httpServer);
    });

    httpServer.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`Port ${port} is in use, trying port ${port + 1}...`);
        httpServer.close(); // Ensure the problematic server is closed before retrying
        tryStartServer(app, port + 1, retriesLeft - 1).then(resolve).catch(reject);
      } else {
        process.stderr.write(`[ERROR] HTTP server error: ${error}\n`);
        reject(error);
      }
    });
  });
}

// --- Main Application Logic --- 
async function main() {
  try {
    // 1. Initialize Authentication
    oauth2Client = await initializeOAuth2Client();
    tokenManager = new TokenManager(oauth2Client);
    authServer = new AuthServer(oauth2Client);

    // 2. Start auth server if authentication is required
    // The start method internally validates tokens first
    const authSuccess = await authServer.start();
    if (!authSuccess) {
      process.exit(1);
    }

    // 3. Set up MCP Handlers
    
    // List Tools Handler
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      // Directly return the definitions from the handler module
      return getToolDefinitions();
    });

    // Call Tool Handler - with streaming support
    server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
      // Check if tokens are valid before handling the request
      if (!(await tokenManager.validateTokens())) {
        throw new Error("Authentication required. Please run 'npm run auth' to authenticate.");
      }
      
      const streamingSupported = !!(extra as any)?.streamingSupported;
      const transportStreamCallback = (extra as any)?.streamCallback;
      
      if (streamingSupported && transportStreamCallback) {
        const progressToken = randomUUID();

        const wrappedCallback: StreamCallback = (chunk: StreamingChunk) => {
          if ((extra as any)?.streamCallback) {
            const partialResultParams = {
              progressToken: progressToken,
              content: chunk.content,
              _meta: chunk.meta
            };
            (extra as any).streamCallback(partialResultParams);
          }
        };
        
        const initialResult: CallToolResult = await handleCallTool(
          request, 
          oauth2Client, 
          true, 
          wrappedCallback, 
          progressToken
        );
        return initialResult;
      } else {
        // Use traditional non-streaming mode
        return handleCallTool(request, oauth2Client);
      }
    });

    // 4. Connect Server Transport - now using Express with StreamableHTTPServerTransport
    const initialPort = process.env.PORT ? parseInt(process.env.PORT) : DEFAULT_PORT;
    
    // Redirect console logs to avoid interfering with JSON communication
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      process.stderr.write(`[INFO] ${args.join(' ')}\n`);
    };
    
    console.log(`Attempting to start server on port ${initialPort}...`);
    
    // Create Express app
    const app = express();
    app.use(express.json());
    
    // Create transport with session management
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        process.stderr.write(`[INFO] New session initialized: ${sessionId}\n`);
      }
    });
    
    // Set up MCP endpoint at /mcp
    app.post('/mcp', (req, res) => {
      transport.handleRequest(req, res, req.body);
    });
    
    app.get('/mcp', (req, res) => {
      transport.handleRequest(req, res);
    });
    
    // Add a documentation endpoint
    app.get('/', (req, res) => {
      res.send(`
        <h1>Google Calendar MCP Server</h1>
        <p>This is a Model Context Protocol (MCP) server for Google Calendar integration.</p>
        <p>Endpoint: POST to /mcp with JSON-RPC 2.0 formatted requests.</p>
        <p>Supports streaming with Server-Sent Events.</p>
      `);
    });
    
    // Connect the MCP server to the transport
    await server.connect(transport);
    
    // Start the Express server with retry logic for port conflicts
    const httpServerInstance = await tryStartServer(app, initialPort, MAX_PORT_RETRIES);
    // httpServerInstance is now the successfully started server.
    // No need for the old httpServer.on('error') here as tryStartServer handles it.

    // 5. Set up Graceful Shutdown
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);

  } catch (error: unknown) {
    process.stderr.write(`[ERROR] Server error: ${error}\n`);
    process.exit(1);
  }
}

// --- Cleanup Logic --- 
async function cleanup() {
  try {
    if (authServer) {
      // Attempt to stop the auth server if it exists and might be running
      await authServer.stop();
    }
    process.exit(0);
  } catch (error: unknown) {
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
    process.stderr.write(`[ERROR] Failed to start server: ${error}\n`);
    process.exit(1);
  });
}

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  CallToolResult,
  isInitializeRequest,
  isJSONRPCRequest
} from "@modelcontextprotocol/sdk/types.js";
import { OAuth2Client } from "google-auth-library";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import express from "express";
import http from 'http';
import cookieParser from 'cookie-parser';

// Import modular components
import { initializeOAuth2Client } from './auth/client.js';
import { AuthServer } from './auth/server.js';
import { TokenManager } from './auth/tokenManager.js';
import { getToolDefinitions } from './handlers/listTools.js';
import { handleCallTool } from './handlers/callTool.js';

// --- MCP Server Configuration --- 
/**
 * Main MCP server instance with streaming capability enabled
 * 
 * The server advertises both tools and streaming capabilities to clients.
 * Streaming allows for progressive response delivery during long-running operations.
 */
const server = new Server(
  {
    name: "google-calendar",
    version: "1.0.0", // Ensure this matches package.json version
  },
  {
    capabilities: {
      tools: {}, // Tool capability enabled (required for all MCP servers)
      streaming: {} // Progressive response streaming capability
    },
  }
);

// Global variables for auth and session management
let oauth2Client: OAuth2Client;
let tokenManager: TokenManager;
let authServer: AuthServer;

// Session management for multiple client connections
const activeSessions: Record<string, { 
  transport: StreamableHTTPServerTransport, 
  lastActivity: number,
  created: number
}> = {};

// Session cleanup interval reference
let cleanupInterval: NodeJS.Timeout | undefined;

// Session management configuration
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const SESSION_CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const MAX_PORT_RETRIES = 10;
const DEFAULT_PORT = 3000;

// Define allowed origins for Origin header validation
// TODO: Configure this list appropriately for your environments
const ALLOWED_ORIGINS = [
  'http://localhost:3000', // Example: Local development frontend
  'http://127.0.0.1:3000', // Example: Local development frontend
  // Add other allowed origins for development, staging, and production
];

process.on('unhandledRejection', (reason, promise) => {
  process.stderr.write(`[FATAL] Unhandled Rejection at: Promise ${promise}, reason: ${reason}\n`);
  // It's often helpful to log the stack trace for the reason
  if (reason instanceof Error && reason.stack) {
    process.stderr.write(reason.stack + '\n');
  }
  process.exit(1); // Exit because the application is in an undefined state
});

async function tryStartServer(app: express.Express, port: number, retriesLeft: number): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    if (retriesLeft < 0) {
      reject(new Error(`Failed to bind to a port after ${MAX_PORT_RETRIES} retries.`));
      return;
    }

    const httpServer = app.listen(port, '127.0.0.1', () => {
      console.error(`Server is now running on http://127.0.0.1:${port}`);
      resolve(httpServer);
    });

    httpServer.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is in use, trying port ${port + 1}...`);
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

    // Call Tool Handler - Supports both synchronous and streaming execution
    server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
      // Verify authentication before handling any requests
      if (!(await tokenManager.validateTokens())) {
        throw new Error("Authentication required. Please run 'npm run auth' to authenticate.");
      }

      // Extract streaming-related capabilities and parameters
      const transportStreamCallback = (extra as any)?.streamCallback;
      const streamingSupportedByClient = !!(extra as any)?.streamingSupported;
      const progressTokenForStreaming = (request.params as any)?._meta?.progressToken;

      // Determine whether to use streaming mode based on:
      // 1. Client support for streaming (advertised via capability)
      // 2. Transport providing a streaming callback mechanism
      // 3. Request including a progress token for tracking streaming status
      if (streamingSupportedByClient && transportStreamCallback && progressTokenForStreaming) {
        // Execute in streaming mode with progressive updates
        return handleCallTool(
          request,
          oauth2Client,
          extra,                    // Complete context for control messages
          transportStreamCallback,  // Data streaming callback
          progressTokenForStreaming // Progress tracking token
        );
      } else {
        // Execute in standard synchronous mode
        return handleCallTool(request, oauth2Client, extra);
      }
    });

    // 4. Connect Server Transport - now using Express with StreamableHTTPServerTransport
    const initialPort = process.env.PORT ? parseInt(process.env.PORT) : DEFAULT_PORT;
    
    // Redirect console logs to avoid interfering with JSON communication
    const originalConsoleLog = console.error;
    console.error = (...args) => {
      process.stderr.write(`[INFO] ${args.join(' ')}\n`);
    };
    
    console.error(`Attempting to start server on port ${initialPort}...`);
    
    // Create Express app
    const app = express();
    app.use(express.json());
    app.use(cookieParser()); // Parse cookies for session management
    
    // Security middleware: Origin validation to prevent cross-site request forgery
    // This follows MCP server security best practices
    app.use((req, res, next) => {
      const origin = req.headers.origin;
      if (origin && !ALLOWED_ORIGINS.includes(origin)) {
        process.stderr.write(`[WARN] Denied request from invalid origin: ${origin}\n`);
        return res.status(403).send('Forbidden: Invalid Origin');
      }
      next();
    });
    
    // Set security headers
    app.use((req, res, next) => {
      // Prevent browsers from interpreting files as a different MIME type
      res.setHeader('X-Content-Type-Options', 'nosniff');
      // Disallow embedding in iframes on other domains
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      // Enable browser XSS filtering
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });
    
    // Set up session management helper functions for multiple client connections
    
    // Helper function to create a new transport for a session
    function createTransportForSession(sessionId: string): StreamableHTTPServerTransport {
      // Check if we already have a transport for this session
      if (activeSessions[sessionId]?.transport) {
        if (DEBUG) {
          process.stderr.write(`[DEBUG] Using existing transport for session: ${sessionId}\n`);
        }
        return activeSessions[sessionId].transport;
      }
      
      // Create a new transport with the provided session ID
      const transport = new StreamableHTTPServerTransport({
        // The sessionId is pre-determined, so we just return it
        sessionIdGenerator: () => sessionId,
        // Called when the session is initialized
        onsessioninitialized: (sid) => {
          process.stderr.write(`[INFO] Session initialized: ${sid}\n`);
          // Store the session information when initialized
          activeSessions[sid] = {
            transport,
            lastActivity: Date.now(),
            created: Date.now()
          };
        }
      });
      
      // Configure and connect the transport to the server
      // This must happen before the transport is used to handle requests
      server.connect(transport).catch(error => {
        process.stderr.write(`[ERROR] Failed to connect transport for session ${sessionId}: ${error}\n`);
      });
      
      if (DEBUG) {
        process.stderr.write(`[DEBUG] Created new transport for session: ${sessionId}\n`);
      }
      
      return transport;
    }
    
    // Helper function to update session activity
    function updateSessionActivity(sessionId: string) {
      if (activeSessions[sessionId]) {
        activeSessions[sessionId].lastActivity = Date.now();
        if (DEBUG) {
          process.stderr.write(`[DEBUG] Updated activity timestamp for session: ${sessionId}\n`);
        }
      } else if (DEBUG) {
        process.stderr.write(`[DEBUG] Unable to update activity, session not found: ${sessionId}\n`);
      }
      
      // Print active sessions count for debugging
      if (DEBUG) {
        const sessionCount = Object.keys(activeSessions).length;
        process.stderr.write(`[DEBUG] Current active sessions: ${sessionCount}\n`);
        Object.keys(activeSessions).forEach(sid => {
          const info = activeSessions[sid];
          const idleTime = (Date.now() - info.lastActivity) / 1000;
          process.stderr.write(`[DEBUG]   - Session ${sid}: idle for ${idleTime.toFixed(1)}s\n`);
        });
      }
    }
    
    // Helper function to clean up inactive sessions
    function cleanupInactiveSessions() {
      const now = Date.now();
      const expiredSessionIds = Object.entries(activeSessions)
        .filter(([_, info]) => now - info.lastActivity > SESSION_TIMEOUT_MS)
        .map(([id, _]) => id);
      
      expiredSessionIds.forEach(sessionId => {
        process.stderr.write(`[INFO] Cleaning up inactive session: ${sessionId}\n`);
        const sessionInfo = activeSessions[sessionId];
        if (sessionInfo) {
          sessionInfo.transport.close();
          delete activeSessions[sessionId];
        }
      });
    }
    
    // Start periodic cleanup of inactive sessions
    const cleanupInterval = setInterval(cleanupInactiveSessions, SESSION_CLEANUP_INTERVAL_MS);
    
    // Ensure cleanup interval is cleared on server shutdown
    process.on("beforeExit", () => {
      clearInterval(cleanupInterval);
    });
    
    // Enable debug mode for development
    const DEBUG = true;
    
    // Set up MCP endpoint at /mcp with session management
    app.all('/mcp', async (req, res, next) => {
      try {
        const isGet = req.method === 'GET';
        
        // Debug request information
        if (DEBUG) {
          if (!isGet) {
            process.stderr.write(`[DEBUG] Request body: ${JSON.stringify(req.body, null, 2)}\n`);
            process.stderr.write(`[DEBUG] Request headers: ${JSON.stringify(req.headers, null, 2)}\n`);
          }
          process.stderr.write(`[DEBUG] Request query params: ${JSON.stringify(req.query, null, 2)}\n`);
        }
        
        // Check for proper JSON-RPC request in POST requests
        if (!isGet && !isJSONRPCRequest(req.body)) {
          return res.status(400).json({
            jsonrpc: "2.0",
            error: {
              code: -32600,
              message: "Invalid Request",
              data: { reason: "Not a valid JSON-RPC 2.0 request" }
            },
            id: null
          });
        }
        
        // Extract session ID from various sources - cookie, header, body, or query param
        let sessionId = req.cookies?.mcp_session_id ||
                       req.query.sessionId as string ||
                       req.headers['x-mcp-session-id'] as string ||
                       (req.body?._meta?.sessionId as string);
        
        // Log session resolution attempts
        if (DEBUG) {
            process.stderr.write(`[DEBUG] Session ID from cookies: ${req.cookies?.mcp_session_id}\n`);
            process.stderr.write(`[DEBUG] Session ID from query: ${req.query.sessionId as string}\n`);
            process.stderr.write(`[DEBUG] Session ID from headers: ${req.headers['x-mcp-session-id'] as string}\n`);
            process.stderr.write(`[DEBUG] Session ID from body meta: ${req.body?._meta?.sessionId as string}\n`);
            process.stderr.write(`[DEBUG] Final resolved sessionId: ${sessionId}\n`);
        }
                       
        // Determine if this is an initialize request or a list-tools request
        const isInitialize = !isGet && req.body && req.body.method === 'initialize';
        const isListTools = !isGet && req.body && req.body.method === 'list-tools';
        
        // For initialize, list-tools requests, or missing session ID, create a new session
        if (isInitialize || isListTools || !sessionId) {
          sessionId = randomUUID();
          process.stderr.write(`[INFO] Creating new session: ${sessionId}\n`);
          
          // Set a cookie with the session ID for browsers
          res.cookie('mcp_session_id', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: SESSION_TIMEOUT_MS
          });
        } else {
          process.stderr.write(`[INFO] Using existing session: ${sessionId}\n`);
        }
        
        // Get or create transport for this session
        let transport = activeSessions[sessionId]?.transport;
        if (!transport) {
          if (!isInitialize && !isListTools && !isGet) {
            // Non-initialization request without valid session
            return res.status(400).json({
              jsonrpc: "2.0",
              error: {
                code: -32000,
                message: "Invalid or expired session",
                data: { reason: "Session not found or expired" }
              },
              id: req.body?.id || null
            });
          }
          
          // Create new transport for this session
          transport = createTransportForSession(sessionId);
        }
        
        // Update session activity timestamp
        updateSessionActivity(sessionId);
        
        // Add session ID to response headers
        res.setHeader('X-MCP-Session-ID', sessionId);
        
        // Handle the request based on method
        if (isGet) {
          await transport.handleRequest(req, res);
        } else {
          await transport.handleRequest(req, res, req.body);
        }
      } catch (error: any) {
        // Error handling
        process.stderr.write(`[ERROR] MCP request error: ${error?.message || error}\n`);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message: "Internal server error",
              data: { message: error?.message || String(error) }
            },
            id: req.body?.id || null
          });
        }
      }
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
    
    // Server is now configured to handle multiple client connections
    // Each client gets its own transport that will be connected to the server on demand
    
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
    // Stop the session cleanup interval if it exists
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
    }
    
    // Close all active transports to release resources
    for (const sessionId in activeSessions) {
      try {
        process.stderr.write(`[INFO] Closing transport for session: ${sessionId}\n`);
        const sessionInfo = activeSessions[sessionId];
        if (sessionInfo?.transport) {
          sessionInfo.transport.close();
        }
      } catch (err) {
        process.stderr.write(`[ERROR] Error closing transport for session ${sessionId}: ${err}\n`);
      }
    }
    
    // Clear session tracking objects
    Object.keys(activeSessions).forEach(key => delete activeSessions[key]);
    
    if (authServer) {
      // Attempt to stop the auth server if it exists and might be running
      await authServer.stop();
    }
    process.exit(0);
  } catch (error: unknown) {
    process.stderr.write(`[ERROR] Cleanup error: ${error}\n`);
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

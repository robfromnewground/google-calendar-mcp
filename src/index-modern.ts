import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { OAuth2Client } from "google-auth-library";
import { fileURLToPath } from "url";
import { z } from "zod";
import express from "express";
import { randomUUID } from "node:crypto";

// Import authentication components
import { initializeOAuth2Client } from './auth/client.js';
import { AuthServer } from './auth/server.js';
import { TokenManager } from './auth/tokenManager.js';

// Import tool handlers
import { ListCalendarsHandler } from "./handlers/core/ListCalendarsHandler.js";
import { ListEventsHandler } from "./handlers/core/ListEventsHandler.js";
import { SearchEventsHandler } from "./handlers/core/SearchEventsHandler.js";
import { ListColorsHandler } from "./handlers/core/ListColorsHandler.js";
import { CreateEventHandler } from "./handlers/core/CreateEventHandler.js";
import { UpdateEventHandler } from "./handlers/core/UpdateEventHandler.js";
import { DeleteEventHandler } from "./handlers/core/DeleteEventHandler.js";
import { FreeBusyEventHandler } from "./handlers/core/FreeBusyEventHandler.js";

// Import config
import { parseArgs, ServerConfig } from './config/TransportConfig.js';

// --- Zod Schema Definitions ---

// Common schemas
const CalendarIdSchema = z.string().describe("ID of the calendar (use 'primary' for the main calendar)");
const DateTimeSchema = z.string().datetime().describe("ISO format with timezone (e.g., 2024-01-01T00:00:00Z or 2024-01-01T00:00:00+00:00)");
const EmailSchema = z.string().email();

// Reminder schema for reusability
const RemindersSchema = z.object({
  useDefault: z.boolean().describe("Whether to use the default reminders"),
  overrides: z.array(z.object({
    method: z.enum(["email", "popup"]).default("popup").describe("Reminder method"),
    minutes: z.number().describe("Minutes before the event to trigger the reminder")
  }).partial({ method: true })).optional().describe("Custom reminders")
}).describe("Reminder settings for the event");

// Attendee schema
const AttendeeSchema = z.object({
  email: EmailSchema.describe("Email address of the attendee")
});

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
  if (!(await tokenManager.validateTokens())) {
    throw new Error("Authentication required. Please run 'npm run auth' to authenticate.");
  }
}

async function executeWithHandler<T>(handler: any, args: any): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  await ensureAuthenticated();
  const result = await handler.runTool(args, oauth2Client);
  return result;
}

// --- Tool Definitions with Modern API ---

// List Calendars - Read-only tool
server.tool(
  "list-calendars",
  "List all available calendars", 
  {},
  async () => {
    const handler = new ListCalendarsHandler();
    return executeWithHandler(handler, {});
  }
);

// List Events - Read-only tool
server.tool(
  "list-events",
  "List events from one or more calendars",
  {
    calendarId: z.union([
      CalendarIdSchema,
      z.array(CalendarIdSchema).min(1).max(50)
    ]).describe("ID of the calendar(s) to list events from"),
    timeMin: DateTimeSchema.optional().describe("Start time boundary"),
    timeMax: DateTimeSchema.optional().describe("End time boundary")
  },
  async ({ calendarId, timeMin, timeMax }: { calendarId: string | string[], timeMin?: string, timeMax?: string }) => {
    const handler = new ListEventsHandler();
    return executeWithHandler(handler, { calendarId, timeMin, timeMax });
  }
);

// Search Events - Read-only tool
server.tool(
  "search-events",
  "Search for events in a calendar by text query",
  {
    calendarId: CalendarIdSchema,
    query: z.string().describe("Free text search query (searches summary, description, location, attendees, etc.)"),
    timeMin: DateTimeSchema.optional().describe("Start time boundary"),
    timeMax: DateTimeSchema.optional().describe("End time boundary")
  },
  async ({ calendarId, query, timeMin, timeMax }: { calendarId: string, query: string, timeMin?: string, timeMax?: string }) => {
    const handler = new SearchEventsHandler();
    return executeWithHandler(handler, { calendarId, query, timeMin, timeMax });
  }
);

// List Colors - Read-only tool
server.tool(
  "list-colors",
  "List available color IDs and their meanings for calendar events",
  {},
  async () => {
    const handler = new ListColorsHandler();
    return executeWithHandler(handler, {});
  }
);

// Create Event - Destructive tool
server.tool(
  "create-event",
  "Create a new calendar event",
  {
    calendarId: CalendarIdSchema,
    summary: z.string().describe("Title of the event"),
    description: z.string().optional().describe("Description/notes for the event"),
    start: DateTimeSchema.describe("Start time"),
    end: DateTimeSchema.describe("End time"),
    timeZone: z.string().describe("Timezone as IANA Time Zone Database name (e.g., America/Los_Angeles)"),
    location: z.string().optional().describe("Location of the event"),
    attendees: z.array(AttendeeSchema).optional().describe("List of attendee email addresses"),
    colorId: z.string().optional().describe("Color ID for the event (use list-colors to see available IDs)"),
    reminders: RemindersSchema.optional(),
    recurrence: z.array(z.string()).optional().describe("Recurrence rules in RFC5545 format (e.g., [\"RRULE:FREQ=WEEKLY;COUNT=5\"])")
  },
  async (args: {
    calendarId: string;
    summary: string;
    description?: string;
    start: string;
    end: string;
    timeZone: string;
    location?: string;
    attendees?: Array<{ email: string }>;
    colorId?: string;
    reminders?: {
      useDefault: boolean;
      overrides?: Array<{ method?: "email" | "popup"; minutes: number }>;
    };
    recurrence?: string[];
  }) => {
    const handler = new CreateEventHandler();
    return executeWithHandler(handler, args);
  }
);

// Update Event - Destructive tool  
server.tool(
  "update-event",
  "Update an existing calendar event with recurring event modification scope support",
  {
    calendarId: CalendarIdSchema,
    eventId: z.string().describe("ID of the event to update"),
    summary: z.string().optional().describe("Updated title of the event"),
    description: z.string().optional().describe("Updated description/notes"),
    start: DateTimeSchema.optional().describe("Updated start time"),
    end: DateTimeSchema.optional().describe("Updated end time"),
    timeZone: z.string().optional().describe("Updated timezone"),
    location: z.string().optional().describe("Updated location"),
    attendees: z.array(AttendeeSchema).optional().describe("Updated attendee list"),
    colorId: z.string().optional().describe("Updated color ID"),
    reminders: RemindersSchema.optional(),
    recurrence: z.array(z.string()).optional().describe("Updated recurrence rules"),
    sendUpdates: z.enum(["all", "externalOnly", "none"]).default("all").describe("Whether to send update notifications"),
    modificationScope: z.enum(["thisAndFollowing", "allFollowing", "thisEventOnly"]).optional().describe("Scope for recurring event modifications")
  },
  async (args: {
    calendarId: string;
    eventId: string;
    summary?: string;
    description?: string;
    start?: string;
    end?: string;
    timeZone?: string;
    location?: string;
    attendees?: Array<{ email: string }>;
    colorId?: string;
    reminders?: {
      useDefault: boolean;
      overrides?: Array<{ method?: "email" | "popup"; minutes: number }>;
    };
    recurrence?: string[];
    sendUpdates?: "all" | "externalOnly" | "none";
    modificationScope?: "thisAndFollowing" | "allFollowing" | "thisEventOnly";
  }) => {
    const handler = new UpdateEventHandler();
    return executeWithHandler(handler, args);
  }
);

// Delete Event - Destructive tool
server.tool(
  "delete-event",
  "Delete a calendar event",
  {
    calendarId: CalendarIdSchema,
    eventId: z.string().describe("ID of the event to delete"),
    sendUpdates: z.enum(["all", "externalOnly", "none"]).default("all").describe("Whether to send cancellation notifications")
  },
  async ({ calendarId, eventId, sendUpdates }: { calendarId: string, eventId: string, sendUpdates?: "all" | "externalOnly" | "none" }) => {
    const handler = new DeleteEventHandler();
    return executeWithHandler(handler, { calendarId, eventId, sendUpdates });
  }
);

// Get Free/Busy - Read-only tool
server.tool(
  "get-freebusy",
  "Query free/busy information for calendars",
  {
    items: z.array(z.object({
      id: CalendarIdSchema
    })).describe("List of calendars to check"),
    timeMin: DateTimeSchema.describe("Start time for the query"),
    timeMax: DateTimeSchema.describe("End time for the query"),
    timeZone: z.string().optional().describe("Timezone for the query")
  },
  async (args: {
    items: Array<{ id: string }>;
    timeMin: string;
    timeMax: string;
    timeZone?: string;
  }) => {
    const handler = new FreeBusyEventHandler();
    return executeWithHandler(handler, args);
  }
);

// --- Modern Transport Setup ---

async function createTransport(config: ServerConfig) {
  switch (config.transport.type) {
    case 'stdio':
      return new StdioServerTransport();
      
    case 'http':
      // Use modern StreamableHTTPServerTransport instead of deprecated SSE
      const app = express();
      app.use(express.json());
      
      // Session management for stateful HTTP transport
      const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};
      
      // Health check endpoint
      app.get('/health', (req, res) => {
        res.json({ 
          status: 'ok', 
          transport: 'streamable-http',
          sessions: Object.keys(transports).length,
          capabilities: {
            tools: true,
            resources: false,
            prompts: false
          }
        });
      });
      
      // Main MCP endpoint with session management
      app.post('/mcp', async (req, res) => {
        const sessionId = req.headers['mcp-session-id'] as string | undefined;
        let transport: StreamableHTTPServerTransport;
        
        if (sessionId && transports[sessionId]) {
          // Reuse existing transport
          transport = transports[sessionId];
        } else {
          // Create new transport with session management
          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (sessionId) => {
              transports[sessionId] = transport;
              console.log(`New session initialized: ${sessionId}`);
            }
          });
          
          // Clean up transport when closed
          transport.onclose = () => {
            if (transport.sessionId) {
              delete transports[transport.sessionId];
              console.log(`Session closed: ${transport.sessionId}`);
            }
          };
          
          await server.connect(transport);
        }
        
        await transport.handleRequest(req, res, req.body);
      });
      
      // SSE endpoint for notifications
      app.get('/mcp', async (req, res) => {
        const sessionId = req.headers['mcp-session-id'] as string | undefined;
        if (!sessionId || !transports[sessionId]) {
          res.status(400).send('Invalid or missing session ID');
          return;
        }
        
        const transport = transports[sessionId];
        await transport.handleRequest(req, res);
      });
      
      // Session termination
      app.delete('/mcp', async (req, res) => {
        const sessionId = req.headers['mcp-session-id'] as string | undefined;
        if (!sessionId || !transports[sessionId]) {
          res.status(400).send('Invalid or missing session ID');
          return;
        }
        
        const transport = transports[sessionId];
        await transport.handleRequest(req, res);
      });
      
      // Start the HTTP server
      const port = config.transport.port || 3000;
      const host = config.transport.host || '127.0.0.1';
      
      return new Promise<void>((resolve, reject) => {
        app.listen(port, host, () => {
          console.log(`Google Calendar MCP Server (Streamable HTTP) listening on ${host}:${port}`);
          console.log(`Endpoint: http://${host}:${port}/mcp`);
          console.log(`Health check: http://${host}:${port}/health`);
          resolve();
        }).on('error', reject);
      });
      
    default:
      throw new Error(`Unsupported transport type: ${config.transport.type}`);
  }
}

// --- Main Application Logic ---
async function main() {
  try {
    // 1. Parse command line arguments
    config = parseArgs(process.argv.slice(2));
    
    if (config.debug) {
      console.log('Configuration:', JSON.stringify(config, null, 2));
    }

    // 2. Initialize Authentication
    oauth2Client = await initializeOAuth2Client();
    tokenManager = new TokenManager(oauth2Client);
    authServer = new AuthServer(oauth2Client);

    // Start auth server if authentication is required
    const shouldOpenBrowser = config.transport.type === 'stdio';
    const authSuccess = await authServer.start(shouldOpenBrowser);
    if (!authSuccess) {
      const authMessage = config.transport.type === 'stdio' 
        ? 'Authentication failed' 
        : 'Authentication failed. Please run "npm run auth" first for HTTP mode.';
      console.error(authMessage);
      process.exit(1);
    }

    // 3. Create and Connect Transport
    if (config.transport.type === 'stdio') {
      const transport = await createTransport(config);
      await server.connect(transport as StdioServerTransport);
      console.log('Google Calendar MCP Server started (stdio mode)');
    } else {
      // HTTP transport setup is handled in createTransport
      await createTransport(config);
    }

    // 4. Set up Graceful Shutdown
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);

  } catch (error: unknown) {
    console.error('Failed to start server:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// --- Cleanup Logic ---
async function cleanup() {
  try {
    console.log('\nShutting down gracefully...');
    
    if (authServer) {
      await authServer.stop();
    }
    
    // McpServer handles transport cleanup automatically
    server.close();
    
    process.exit(0);
  } catch (error: unknown) {
    console.error('Error during cleanup:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// --- Exports & Execution Guard ---
export { main, server };

// Run main() only when this script is executed directly
const isDirectRun = import.meta.url.startsWith('file://') && process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((error) => {
    console.error('Unhandled error:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
} 
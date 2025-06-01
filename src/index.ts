import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { OAuth2Client } from "google-auth-library";
import { fileURLToPath } from "url";
import { z } from "zod";
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
    
    // 2. Initialize Authentication
    oauth2Client = await initializeOAuth2Client();
    tokenManager = new TokenManager(oauth2Client);
    authServer = new AuthServer(oauth2Client);

    // Start auth server - don't open browser for HTTP mode
    const openBrowser = config.transport.type === 'stdio';
    const authSuccess = await authServer.start(openBrowser);
    if (!authSuccess) {
      const mode = config.transport.type === 'http' ? 'HTTP' : 'stdio';
      process.stderr.write(`Authentication failed for ${mode} mode. Please run "npm run auth" first.\n`);
      process.exit(1);
    }

    // 3. Set up Modern Tool Definitions
    setupToolDefinitions();

    // 4. Create and Connect Transport
    await createAndConnectTransport();

    // 5. Set up Graceful Shutdown
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);

  } catch (error: unknown) {
    process.stderr.write(`Failed to start server: ${error instanceof Error ? error.message : error}\n`);
    process.exit(1);
  }
}

// --- Tool Definitions with Modern API ---

function setupToolDefinitions() {
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
      
      process.stderr.write(`Google Calendar MCP Server listening on http://${host}:${port}\n`);
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

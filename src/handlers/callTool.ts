import { CallToolRequestSchema, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { CallToolResultContentItem } from "../schemas/types.js";
import { OAuth2Client } from 'google-auth-library';
import { BaseToolHandler } from "./core/BaseToolHandler.js";
import { ListCalendarsHandler } from "./core/ListCalendarsHandler.js";
import { ListEventsHandler } from "./core/ListEventsHandler.js";
import { SearchEventsHandler } from "./core/SearchEventsHandler.js";
import { ListColorsHandler } from "./core/ListColorsHandler.js";
import { CreateEventHandler } from "./core/CreateEventHandler.js";
import { UpdateEventHandler } from "./core/UpdateEventHandler.js";
import { DeleteEventHandler } from "./core/DeleteEventHandler.js";
import { FreeBusyEventHandler } from "./core/FreeBusyEventHandler.js";
import { StreamCallback } from "../schemas/types.js";
import { StreamingChunk } from "../schemas/types.js";

/**
 * Executes a tool call with support for both synchronous and streaming responses.
 * 
 * For streaming responses, this function handles the initial request and delegates
 * to the appropriate handler's streaming implementation. The handler will then use
 * the provided callback to send data chunks as they become available.
 *
 * @param request The tool request containing name and arguments
 * @param oauth2Client An authenticated OAuth2 client for Google APIs
 * @param extra Additional context from the request handler
 * @param transportStreamCallback Optional callback for streaming data chunks
 * @param explicitProgressToken Optional token to identify a streaming session
 * @returns A Promise resolving to the tool execution result
 */
export async function handleCallTool(
    request: typeof CallToolRequestSchema._type,
    oauth2Client: OAuth2Client,
    extra: any,
    transportStreamCallback?: (partialResult: { progressToken: string | number; content?: CallToolResultContentItem[]; _meta?: any }) => void,
    explicitProgressToken?: string | number
): Promise<CallToolResult> {
    const { name, arguments: args } = request.params;

    try {
        const handler = getHandler(name);

        if (transportStreamCallback && explicitProgressToken && typeof handler.runToolStreaming === 'function') {
            // Execute in streaming mode when all required parameters are present
            // The handler will send partial results through the callback as they become available
            // and return an initial response to indicate streaming has started
            return await handler.runToolStreaming(args, oauth2Client, extra, transportStreamCallback, explicitProgressToken);
        }
        // Fallback to traditional synchronous execution when streaming parameters are missing
        return await handler.runTool(args, oauth2Client);
    } catch (error: unknown) {
        process.stderr.write(`[ERROR] Error executing tool '${name}': ${error}\n`);
        throw error; // Re-throw so the MCP server can convert it to a proper JSON-RPC error response
    }
}

const handlerMap: Record<string, BaseToolHandler> = {
    "list-calendars": new ListCalendarsHandler(),
    "list-events": new ListEventsHandler(),
    "search-events": new SearchEventsHandler(),
    "list-colors": new ListColorsHandler(),
    "create-event": new CreateEventHandler(),
    "update-event": new UpdateEventHandler(),
    "delete-event": new DeleteEventHandler(),
    "get-freebusy": new FreeBusyEventHandler(),
};

function getHandler(toolName: string): BaseToolHandler {
    const handler = handlerMap[toolName];
    if (!handler) {
        throw new Error(`Unknown tool: ${toolName}`);
    }
    return handler;
}

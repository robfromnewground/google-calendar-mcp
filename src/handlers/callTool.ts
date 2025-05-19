import { CallToolRequestSchema, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
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

/**
 * Handles incoming tool calls, validates arguments, calls the appropriate service,
 * and formats the response.
 *
 * @param request The CallToolRequest containing tool name and arguments.
 * @param oauth2Client The authenticated OAuth2 client instance.
 * @param streamMode Whether to use streaming mode
 * @param streamCallback Callback function for streaming responses (required if streamMode is true)
 * @param progressToken Optional progress token for streaming (required if streamMode is true)
 * @returns A Promise resolving to the CallToolResponse.
 */
export async function handleCallTool(
    request: typeof CallToolRequestSchema._type, 
    oauth2Client: OAuth2Client,
    streamMode: boolean = false,
    streamCallback?: StreamCallback,
    progressToken?: string
): Promise<CallToolResult> {
    const { name, arguments: args } = request.params;

    try {
        const handler = getHandler(name);
        
        if (streamMode && streamCallback && progressToken) {
            // Execute the streaming tool logic. It will use the streamCallback to send chunks.
            // The streamCallback (wrappedCallback from index.ts) is responsible for using the progressToken.
            await handler.runToolStreaming(args, oauth2Client, streamCallback);
            
            // Return an initial response indicating streaming has started, using the provided progressToken
            return {
                content: [{
                    type: "text",
                    text: "Streaming response initiated. Waiting for partial results..."
                }],
                _meta: {
                    streaming: true,
                    progressToken: progressToken
                }
            };
        } else if (streamMode) {
            // This case should ideally not happen if called correctly from index.ts
            throw new Error("Stream mode requires a streamCallback and progressToken.");
        } else {
            // Use traditional mode
            return await handler.runTool(args, oauth2Client);
        }
    } catch (error: unknown) {
        process.stderr.write(`[ERROR] Error executing tool '${name}': ${error}\n`);
        throw error;
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

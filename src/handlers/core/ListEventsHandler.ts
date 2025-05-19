import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { CallToolResultContentItem } from "../../schemas/types.js";
import { OAuth2Client } from "google-auth-library";
import { ListEventsArgumentsSchema } from "../../schemas/validators.js";
import { BaseToolHandler } from "./BaseToolHandler.js";
import { google, calendar_v3 } from 'googleapis';
import { z } from 'zod';
import { formatEventList, formatEventForStream, calculateProgress } from "../utils.js";

/**
 * Default timeout for Google Calendar API requests (30 seconds)
 * Prevents hanging on slow or unresponsive API calls
 */
/**
 * Configuration constants for ListEventsHandler
 */
const GOOGLE_API_TIMEOUT_MS = 30000;    // Timeout for Google Calendar API requests
const STREAMING_BATCH_SIZE = 5;        // Number of events per streaming batch
const STREAMING_DELAY_MS = 300;        // Artificial delay between batches (for demo)
const STREAMING_MAX_BATCH_SIZE = 10;   // Maximum number of events per batch
const STREAMING_TIMEOUT_MS = 120000;   // Maximum time allowed for the entire streaming operation (2 min)

/**
 * Wraps a promise with a timeout to prevent long-running API calls from blocking
 * 
 * @param promise - The original promise to execute with a timeout
 * @param timeoutMs - Maximum time to wait in milliseconds
 * @param timeoutMessage - Error message to use if timeout occurs
 * @returns The original promise result or rejects with timeout error
 */
async function promiseWithTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
    let timeoutHandle: NodeJS.Timeout | undefined = undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    });

    try {
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        if (timeoutHandle) {
            clearTimeout(timeoutHandle);
        }
    }
}

export class ListEventsHandler extends BaseToolHandler {
    async runTool(args: any, oauth2Client: OAuth2Client): Promise<CallToolResult> {
        const validArgs = ListEventsArgumentsSchema.parse(args);
        const events = await this.listEvents(oauth2Client, validArgs);
        return {
            content: [{
                type: "text",
                text: formatEventList(events),
            }],
        };
    }
    
    /**
     * Streams calendar events in batches to provide a responsive experience
     * 
     * This implementation:
     * 1. Sends an initial message when the request begins
     * 2. Fetches all events from the Google Calendar API
     * 3. Sends event batches progressively with progress updates
     * 4. Handles errors gracefully with appropriate streaming error responses
     */
    async runToolStreaming(
        args: any,
        oauth2Client: OAuth2Client,
        extra: any,
        transportDataStreamCallback: (partialResult: { progressToken: string | number; content?: CallToolResultContentItem[]; _meta?: any }) => void,
        progressToken: string | number
    ): Promise<CallToolResult> {
        // Create a controller to allow timeout cancellation of the streaming operation
        const controller = new AbortController();
        const signal = controller.signal;
        
        // Set a timeout for the entire streaming operation
        const timeoutId = setTimeout(() => {
            controller.abort('Streaming operation timed out');
        }, STREAMING_TIMEOUT_MS);
        
        try {
        const validArgs = ListEventsArgumentsSchema.parse(args);
            // Send initial "fetching" message as the first chunk
            transportDataStreamCallback({
                progressToken,
                content: [{ type: "text", text: "Fetching calendar events...\n" }],
                _meta: { progress: 0, isLast: false }
            });

            const calendar = this.getCalendar(oauth2Client);
            const listRequest = calendar.events.list({
                calendarId: validArgs.calendarId,
                timeMin: validArgs.timeMin,
                timeMax: validArgs.timeMax,
                singleEvents: true,
                orderBy: 'startTime',
            });
            
            const response = await promiseWithTimeout(
                listRequest,
                GOOGLE_API_TIMEOUT_MS,
                `Google Calendar API call (list events) timed out after ${GOOGLE_API_TIMEOUT_MS / 1000}s`
            );
            const events = response.data.items || [];

            if (events.length === 0) {
                transportDataStreamCallback({
                    progressToken,
                    content: [{ type: "text", text: "No events found for the specified time range.\n" }],
                    _meta: { progress: 100, isLast: true }
                });
                return { structuredContent: {}, _meta: { streamingCompleted: true, progressToken } }; // Final "empty" result
            }

            transportDataStreamCallback({
                progressToken,
                content: [{ type: "text", text: `Found ${events.length} events. Streaming results...\n\n` }],
                _meta: { progress: 5, isLast: false } // Or some initial progress
            });

            // Determine optimal batch size based on total events
            // Smaller batches for many events, larger for few events
            // This provides a more responsive streaming experience
            const batchSize = Math.min(
                STREAMING_MAX_BATCH_SIZE,
                Math.max(1, Math.ceil(events.length <= 10 ? events.length / 2 : STREAMING_BATCH_SIZE))
            );
            
            for (let i = 0; i < events.length; i += batchSize) {
                const batch = events.slice(i, i + batchSize);
                const batchText = batch.map(formatEventForStream).join("\n");
                const currentProgress = calculateProgress(i + batch.length, events.length);
                const isLastBatch = i + batchSize >= events.length;

                transportDataStreamCallback({
                    progressToken,
                    content: [{ type: "text", text: batchText + (isLastBatch ? "" : "\n") }],
                    _meta: { progress: currentProgress, isLast: isLastBatch }
                });

                // Add a small delay between batches for a more realistic streaming experience
                // This helps demonstrate the progressive nature of streaming updates
                // The delay is configurable via STREAMING_DELAY_MS constant
                // Note: In production, consider removing this artificial delay or making it configurable
                if (!isLastBatch && STREAMING_DELAY_MS > 0) {
                    await new Promise(resolve => setTimeout(resolve, STREAMING_DELAY_MS));
                }
            }
            // Stream completion:
            // 1. The last chunk sent above has isLast: true to signal end of streaming
            // 2. The MCP server will finalize the JSON-RPC response based on the last chunk
            // 3. We return a minimal result here as streaming is now complete
            // 4. The SDK ties the stream to the original request ID for proper response handling
            
            // Clear the timeout since streaming completed successfully
            clearTimeout(timeoutId);
            
            return {
                structuredContent: {},
                _meta: { streamingCompleted: true, progressToken, finalMessage: "All events streamed." }
            };

        } catch (error: any) {
            // Check if this was a timeout/abort error from our controller
            const isTimeoutError = error.name === 'AbortError' || 
                                 error.message?.includes('timed out') ||
                                 signal.aborted;
            
            const errorMessage = isTimeoutError
                ? `Streaming operation timed out after ${STREAMING_TIMEOUT_MS/1000}s`
                : `Error fetching events: ${error.message || String(error)}`;
                
            // Send error as the final streaming chunk
            transportDataStreamCallback({
                progressToken,
                content: [{ type: "text", text: errorMessage }],
                _meta: { progress: 100, isLast: true, error: true }
            });
            
            // Error handling for streaming:
            // 1. We've already sent an error chunk through the callback
            // 2. We also return a CallToolResult with error information
            // 3. The MCP protocol may generate additional error information
            
            // Always clear the timeout on error
            clearTimeout(timeoutId);
            
            return {
                content: [{ type: "text", text: `Error during streaming: ${error.message || String(error)}`}],
                _meta: { streamingFailed: true, progressToken, error: true }
            };
        } finally {
            // Ensure timeout is always cleared, even if we somehow missed it above
            clearTimeout(timeoutId);
        }
    }

    private async listEvents(
        client: OAuth2Client,
        args: z.infer<typeof ListEventsArgumentsSchema>
    ): Promise<calendar_v3.Schema$Event[]> {
        try {
            const calendar = this.getCalendar(client);
            const listRequest = calendar.events.list({
                calendarId: args.calendarId,
                timeMin: args.timeMin,
                timeMax: args.timeMax,
                singleEvents: true,
                orderBy: 'startTime',
            });
            
            const response = await promiseWithTimeout(
                listRequest,
                GOOGLE_API_TIMEOUT_MS,
                `Google Calendar API call (listEvents private method) timed out after ${GOOGLE_API_TIMEOUT_MS / 1000}s`
            );
            return response.data.items || [];
        } catch (error) {
            throw this.handleGoogleApiError(error);
        }
    }
}

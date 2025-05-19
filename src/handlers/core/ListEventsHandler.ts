import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { OAuth2Client } from "google-auth-library";
import { ListEventsArgumentsSchema } from "../../schemas/validators.js";
import { BaseToolHandler } from "./BaseToolHandler.js";
import { google, calendar_v3 } from 'googleapis';
import { z } from 'zod';
import { formatEventList, formatEventForStream, calculateProgress } from "../utils.js";
import { StreamCallback, StreamingChunk } from "../../schemas/types.js";

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
     * Implementation of streaming events list
     * Overrides the default implementation in BaseToolHandler
     */
    async runToolStreaming(
        args: any, 
        oauth2Client: OAuth2Client,
        streamCallback: StreamCallback
    ): Promise<void> {
        // Validate arguments
        const validArgs = ListEventsArgumentsSchema.parse(args);
        
        try {
            // Send initial response
            streamCallback({
                content: [{
                    type: "text",
                    text: "Fetching calendar events...\n",
                }],
                meta: {
                    progress: 0,
                }
            });
            
            // Get the calendar events
            const calendar = this.getCalendar(oauth2Client);
            const response = await calendar.events.list({
                calendarId: validArgs.calendarId,
                timeMin: validArgs.timeMin,
                timeMax: validArgs.timeMax,
                singleEvents: true,
                orderBy: 'startTime',
            });
            
            const events = response.data.items || [];
            
            // If no events, send empty result
            if (events.length === 0) {
                streamCallback({
                    content: [{
                        type: "text",
                        text: "No events found for the specified time range.\n"
                    }],
                    meta: {
                        progress: 100,
                        isLast: true
                    }
                });
                return;
            }
            
            // Send initial events count
            streamCallback({
                content: [{
                    type: "text",
                    text: `Found ${events.length} events. Streaming results...\n\n`
                }],
                meta: {
                    progress: 5
                }
            });
            
            // Stream events in batches
            const batchSize = 3; // Small batch size for demonstrating streaming
            
            for (let i = 0; i < events.length; i += batchSize) {
                const batch = events.slice(i, i + batchSize);
                const batchText = batch.map(formatEventForStream).join("\n");
                
                const progress = calculateProgress(i + batch.length, events.length);
                const isLast = i + batchSize >= events.length;
                
                // Stream this batch
                const chunk: StreamingChunk = {
                    content: [{
                        type: "text",
                        text: batchText
                    }],
                    meta: {
                        progress: progress,
                        isLast: isLast
                    }
                };
                
                streamCallback(chunk);
                
                // Add a small delay to simulate network latency (remove in production)
                if (!isLast) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            }
            
            // Final message not needed since we set isLast in the final batch
            
        } catch (error) {
            // Send error as a streaming response
            streamCallback({
                content: [{
                    type: "text",
                    text: `Error fetching events: ${error instanceof Error ? error.message : String(error)}`
                }],
                meta: {
                    progress: 100,
                    isLast: true
                }
            });
            
            // Also throw the error to be handled by the caller
            throw this.handleGoogleApiError(error);
        }
    }

    private async listEvents(
        client: OAuth2Client,
        args: z.infer<typeof ListEventsArgumentsSchema>
    ): Promise<calendar_v3.Schema$Event[]> {
        try {
            const calendar = this.getCalendar(client);
            const response = await calendar.events.list({
                calendarId: args.calendarId,
                timeMin: args.timeMin,
                timeMax: args.timeMax,
                singleEvents: true,
                orderBy: 'startTime',
            });
            return response.data.items || [];
        } catch (error) {
            throw this.handleGoogleApiError(error);
        }
    }
}

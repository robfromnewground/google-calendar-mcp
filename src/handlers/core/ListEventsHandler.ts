import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { OAuth2Client } from "google-auth-library";
import { ListEventsArgumentsSchema } from "../../schemas/validators.js";
import { BaseToolHandler } from "./BaseToolHandler.js";
import { google, calendar_v3 } from 'googleapis';
import { z } from 'zod';
import { formatEventList } from "../utils.js";
import { v4 as uuidv4 } from 'uuid';

export class ListEventsHandler extends BaseToolHandler {
    async runTool(args: any, oauth2Client: OAuth2Client): Promise<CallToolResult> {
        // Sanitize input arguments
        const sanitizedArgs = { ...args };
        
        // Ensure string types for date fields and trim whitespace
        if (sanitizedArgs.timeMin) {
            sanitizedArgs.timeMin = String(sanitizedArgs.timeMin).trim();
        }
        if (sanitizedArgs.timeMax) {
            sanitizedArgs.timeMax = String(sanitizedArgs.timeMax).trim();
        }
        
        try {
            const validArgs = ListEventsArgumentsSchema.parse(sanitizedArgs);
            const events = await this.listEvents(oauth2Client, validArgs);
            return {
                content: [{
                    type: "text",
                    text: formatEventList(events),
                }],
            };
        } catch (error: unknown) {
            throw error;
        }
    }

    private async listEvents(
        client: OAuth2Client,
        args: z.infer<typeof ListEventsArgumentsSchema>
    ): Promise<calendar_v3.Schema$Event[]> {
        try {
            if (args.calendarIds && args.calendarIds.length > 0) {
                return await this.listEventsBatch(client, args.calendarIds, args.timeMin, args.timeMax);
            }

            const calendar = this.getCalendar(client);
            const response = await calendar.events.list({
                calendarId: args.calendarId!,
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

    private async listEventsBatch(
        client: OAuth2Client,
        calendarIds: string[],
        timeMin?: string,
        timeMax?: string
    ): Promise<calendar_v3.Schema$Event[]> {
        const boundary = 'batch_' + uuidv4().replace(/-/g, '');
        
        const body = calendarIds.map((id, idx) => {
            const params = new URLSearchParams();
            if (timeMin) params.append('timeMin', timeMin);
            if (timeMax) params.append('timeMax', timeMax);
            params.append('singleEvents', 'true');
            params.append('orderBy', 'startTime');
            const path = `/calendar/v3/calendars/${encodeURIComponent(id)}/events?${params.toString()}`;
            
            return [
                `--${boundary}`,
                'Content-Type: application/http',
                `Content-ID: ${idx + 1}`,
                '',
                `GET ${path} HTTP/1.1`,
                '',
            ].join('\r\n');
        }).join('\r\n') + `\r\n--${boundary}--`;

        const headers = await client.getRequestHeaders();
        const response = await client.request<string>({
            url: 'https://www.googleapis.com/batch/calendar/v3',
            method: 'POST',
            headers: {
                ...headers,
                'Content-Type': `multipart/mixed; boundary=${boundary}`,
                'Accept': 'multipart/mixed',
            },
            data: body,
            responseType: 'text',
        });

        // Handle both string and object responses
        let responseData: string;
        if (typeof response.data === 'string') {
            responseData = response.data;
        } else {
            // Fallback: if response is parsed as JSON, stringify it
            responseData = JSON.stringify(response.data);
        }
        
        return this.parseBatchResponse(responseData, boundary);
    }

    private parseBatchResponse(data: string, boundary: string): calendar_v3.Schema$Event[] {
        const events: calendar_v3.Schema$Event[] = [];
        
        // Split by the exact boundary markers used in the request
        const boundaryRegex = new RegExp(`--${boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
        const parts = data.split(boundaryRegex);
        
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!part || part.trim() === '' || part.trim() === '--') {
                continue;
            }
            
            // Look for HTTP responses (both success and error)
            const httpMatch = part.match(/HTTP\/1\.1 (\d+)/);
            if (!httpMatch) {
                continue;
            }
            
            const statusCode = httpMatch[1];
            
            // Only process successful responses
            if (statusCode !== '200') {
                continue;
            }
            
            // Find the JSON payload (after headers section)
            let jsonStart = part.indexOf('\r\n\r\n');
            if (jsonStart === -1) {
                jsonStart = part.indexOf('\n\n');
            }
            if (jsonStart === -1) {
                continue;
            }
            
            const jsonPart = part.substring(jsonStart + (part.includes('\r\n\r\n') ? 4 : 2)).trim();
            if (!jsonPart || !jsonPart.startsWith('{')) {
                continue;
            }
            
            try {
                const parsed = JSON.parse(jsonPart);
                if (parsed.items && Array.isArray(parsed.items)) {
                    events.push(...parsed.items);
                } else if (parsed.error) {
                    // Log calendar-specific errors but continue processing others
                    console.error(`Calendar API error for request ${i}:`, parsed.error.message || parsed.error);
                }
            } catch (parseError: unknown) {
                console.error(`Failed to parse JSON response for request ${i}:`, parseError instanceof Error ? parseError.message : String(parseError));
            }
        }
        
        // Sort events by start time across all calendars
        return events.sort((a, b) => {
            const aStart = a.start?.dateTime || a.start?.date || '';
            const bStart = b.start?.dateTime || b.start?.date || '';
            return aStart.localeCompare(bStart);
        });
    }
}

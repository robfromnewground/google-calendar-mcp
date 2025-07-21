import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { OAuth2Client } from "google-auth-library";
import { CreateEventInput } from "../../tools/registry.js";
import { BaseToolHandler } from "./BaseToolHandler.js";
import { calendar_v3 } from 'googleapis';
import { createEventResponseWithConflicts, formatConflictWarnings } from "../utils.js";
import { createTimeObject } from "../utils/datetime.js";
import { ConflictDetectionService } from "../../services/conflict-detection/index.js";

export class CreateEventHandler extends BaseToolHandler {
    private conflictDetectionService: ConflictDetectionService;
    private readonly BLOCK_SIMILARITY_THRESHOLD = 0.8; // Threshold for blocking duplicates (90% similar)
    private readonly DEFAULT_DUPLICATE_THRESHOLD = 0.5; // Default threshold for flagging potential duplicates (80% similar)
    
    constructor() {
        super();
        this.conflictDetectionService = new ConflictDetectionService();
    }
    
    async runTool(args: any, oauth2Client: OAuth2Client): Promise<CallToolResult> {
        const validArgs = args as CreateEventInput;
        
        // Create the event object for conflict checking
        const timezone = args.timeZone || await this.getCalendarTimezone(oauth2Client, validArgs.calendarId);
        const eventToCheck: calendar_v3.Schema$Event = {
            summary: args.summary,
            description: args.description,
            start: createTimeObject(args.start, timezone),
            end: createTimeObject(args.end, timezone),
            attendees: args.attendees,
            location: args.location,
        };
        
        // Check for conflicts and duplicates
        const conflicts = await this.conflictDetectionService.checkConflicts(
            oauth2Client,
            eventToCheck,
            validArgs.calendarId,
            {
                checkDuplicates: true,
                checkConflicts: true,
                calendarsToCheck: validArgs.calendarsToCheck || [validArgs.calendarId],
                duplicateSimilarityThreshold: validArgs.duplicateSimilarityThreshold || this.DEFAULT_DUPLICATE_THRESHOLD
            }
        );
        
        // If high similarity duplicates are found, suggest updating instead
        const highSimilarityDuplicate = conflicts.duplicates.find(dup => dup.event.similarity > this.BLOCK_SIMILARITY_THRESHOLD);
        if (highSimilarityDuplicate && validArgs.blockOnHighSimilarity !== false) {
            // Filter to only show the high similarity duplicate(s)
            const highSimilarityConflicts = {
                hasConflicts: true,
                duplicates: conflicts.duplicates.filter(dup => dup.event.similarity > this.BLOCK_SIMILARITY_THRESHOLD),
                conflicts: []
            };
            
            // Format the duplicate details
            const duplicateDetails = formatConflictWarnings(highSimilarityConflicts);
            
            // Remove the "POTENTIAL DUPLICATES DETECTED" header since we're blocking
            const cleanedDetails = duplicateDetails.replace('⚠️ POTENTIAL DUPLICATES DETECTED:', '').trim();
            
            let blockMessage = `⚠️ DUPLICATE EVENT DETECTED!\n\n`;
            blockMessage += cleanedDetails;
            blockMessage += `\n\nTo create anyway, set blockOnHighSimilarity to false.`;
            
            return {
                content: [{
                    type: "text",
                    text: blockMessage
                }]
            };
        }
        
        // Create the event
        const event = await this.createEvent(oauth2Client, validArgs);
        
        // Generate response with conflict warnings
        const text = createEventResponseWithConflicts(event, validArgs.calendarId, conflicts, "created");
        
        return {
            content: [{
                type: "text",
                text: text
            }]
        };
    }

    private async createEvent(
        client: OAuth2Client,
        args: CreateEventInput
    ): Promise<calendar_v3.Schema$Event> {
        try {
            const calendar = this.getCalendar(client);
            
            // Use provided timezone or calendar's default timezone
            const timezone = args.timeZone || await this.getCalendarTimezone(client, args.calendarId);
            
            const requestBody: calendar_v3.Schema$Event = {
                summary: args.summary,
                description: args.description,
                start: createTimeObject(args.start, timezone),
                end: createTimeObject(args.end, timezone),
                attendees: args.attendees,
                location: args.location,
                colorId: args.colorId,
                reminders: args.reminders,
                recurrence: args.recurrence,
            };
            const response = await calendar.events.insert({
                calendarId: args.calendarId,
                requestBody: requestBody,
            });
            if (!response.data) throw new Error('Failed to create event, no data returned');
            return response.data;
        } catch (error) {
            throw this.handleGoogleApiError(error);
        }
    }
}

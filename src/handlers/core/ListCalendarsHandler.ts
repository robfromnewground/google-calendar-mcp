import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { OAuth2Client } from "google-auth-library";
import { BaseToolHandler } from "./BaseToolHandler.js";
import { calendar_v3 } from "googleapis";

export class ListCalendarsHandler extends BaseToolHandler {
    async runTool(_: any, oauth2Client: OAuth2Client): Promise<CallToolResult> {
        const calendars = await this.listCalendars(oauth2Client);
        return {
            content: [{
                type: "text", // This MUST be a string literal
                text: this.formatCalendarList(calendars),
            }],
        };
    }

    private async listCalendars(client: OAuth2Client): Promise<calendar_v3.Schema$CalendarListEntry[]> {
        try {
            const calendar = this.getCalendar(client);
            const response = await calendar.calendarList.list();
            return response.data.items || [];
        } catch (error) {
            throw this.handleGoogleApiError(error);
        }
    }


    /**
     * Formats a list of calendars into a user-friendly string with detailed information.
     */
    private formatCalendarList(calendars: calendar_v3.Schema$CalendarListEntry[]): string {
        return calendars
            .map((cal) => {
                const name = cal.summaryOverride || cal.summary || "Untitled";
                const id = cal.id || "no-id";
                const timezone = cal.timeZone || "Unknown";
                const kind = cal.kind || "Unknown";
                const accessRole = cal.accessRole || "Unknown";
                const isPrimary = cal.primary ? " (PRIMARY)" : "";
                const isSelected = cal.selected !== false ? "Yes" : "No";
                const isHidden = cal.hidden ? "Yes" : "No";
                const backgroundColor = cal.backgroundColor || "Default";
                const description = cal.description ? `\n  Description: ${cal.description}` : "";
                
                let defaultReminders = "None";
                if (cal.defaultReminders && cal.defaultReminders.length > 0) {
                    defaultReminders = cal.defaultReminders
                        .map(reminder => `${reminder.method} (${reminder.minutes}min before)`)
                        .join(", ");
                }
                
                return `${name}${isPrimary} (${id})
  Timezone: ${timezone}
  Kind: ${kind}
  Access Role: ${accessRole}
  Selected: ${isSelected}
  Hidden: ${isHidden}
  Background Color: ${backgroundColor}
  Default Reminders: ${defaultReminders}${description}`;
            })
            .join("\n\n");
    }

}

import { calendar_v3 } from "googleapis";

/**
 * Formats a list of events into a user-friendly string.
 */
export function formatEventList(events: calendar_v3.Schema$Event[]): string {
    return events
        .map((event) => {
            const attendeeList = event.attendees
                ? `\nAttendees: ${event.attendees
                    .map((a) => `${a.email || "no-email"} (${a.responseStatus || "unknown"})`)
                    .join(", ")}`
                : "";
            const locationInfo = event.location ? `\nLocation: ${event.location}` : "";
            const colorInfo = event.colorId ? `\nColor ID: ${event.colorId}` : "";
            const reminderInfo = event.reminders
                ? `\nReminders: ${event.reminders.useDefault ? 'Using default' :
                    (event.reminders.overrides || []).map((r: any) => `${r.method} ${r.minutes} minutes before`).join(', ') || 'None'}`
                : "";
            return `${event.summary || "Untitled"} (${event.id || "no-id"})${locationInfo}\nStart: ${event.start?.dateTime || event.start?.date || "unspecified"}\nEnd: ${event.end?.dateTime || event.end?.date || "unspecified"}${attendeeList}${colorInfo}${reminderInfo}\n`;
        })
        .join("\n");
}

/**
 * Formats a single event for streaming output.
 * Similar to formatEventList but processes one event at a time.
 */
export function formatEventForStream(event: calendar_v3.Schema$Event): string {
    const attendeeList = event.attendees
        ? `\nAttendees: ${event.attendees
            .map((a) => `${a.email || "no-email"} (${a.responseStatus || "unknown"})`)
            .join(", ")}`
        : "";
    const locationInfo = event.location ? `\nLocation: ${event.location}` : "";
    const colorInfo = event.colorId ? `\nColor ID: ${event.colorId}` : "";
    const reminderInfo = event.reminders
        ? `\nReminders: ${event.reminders.useDefault ? 'Using default' :
            (event.reminders.overrides || []).map((r: any) => `${r.method} ${r.minutes} minutes before`).join(', ') || 'None'}`
        : "";
    
    return `${event.summary || "Untitled"} (${event.id || "no-id"})${locationInfo}\nStart: ${event.start?.dateTime || event.start?.date || "unspecified"}\nEnd: ${event.end?.dateTime || event.end?.date || "unspecified"}${attendeeList}${colorInfo}${reminderInfo}\n`;
}

/**
 * Calculate progress percentage based on current index and total items
 * @param currentIndex Current position in the list (0-based)
 * @param totalItems Total number of items in the list
 * @returns Progress percentage (0-100)
 */
export function calculateProgress(currentIndex: number, totalItems: number): number {
    if (totalItems === 0) return 100;
    const progress = Math.floor(((currentIndex + 1) / totalItems) * 100);
    return Math.min(progress, 100); // Ensure we don't exceed 100%
}

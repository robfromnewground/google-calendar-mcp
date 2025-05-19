// TypeScript interfaces for Google Calendar data structures

import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

// Define the type for individual content items from CallToolResult
export type CallToolResultContentItem = NonNullable<CallToolResult['content']>[number];

export interface CalendarListEntry {
  id?: string | null;
  summary?: string | null;
}

export interface CalendarEventReminder {
  method: 'email' | 'popup';
  minutes: number;
}

export interface CalendarEventAttendee {
  email?: string | null;
  responseStatus?: string | null;
}

export interface CalendarEvent {
  id?: string | null;
  summary?: string | null;
  start?: {
    dateTime?: string | null;
    date?: string | null;
    timeZone?: string | null;
  };
  end?: {
    dateTime?: string | null;
    date?: string | null;
    timeZone?: string | null;
  };
  location?: string | null;
  attendees?: CalendarEventAttendee[] | null;
  colorId?: string | null;
  reminders?: {
    useDefault: boolean;
    overrides?: CalendarEventReminder[];
  };
  recurrence?: string[] | null;
}

// Type-safe response based on Google Calendar FreeBusy API
export interface FreeBusyResponse {
  kind: "calendar#freeBusy";
  timeMin: string;
  timeMax: string;
  groups?: {
    [key: string]: {
      errors?: { domain: string; reason: string }[];
      calendars?: string[];
    };
  };
  calendars: {
    [key: string]: {
      errors?: { domain: string; reason: string }[];
      busy: {
        start: string;
        end: string;
      }[];
    };
  };
}

/**
 * MCP Streaming-related types and interfaces
 */

/**
 * Represents a chunk of data sent during progressive streaming.
 * Used to provide partial results during long-running operations.
 *
 * @property content - The actual content items to be displayed
 * @property meta - Optional metadata about the streaming progress
 */
export interface StreamingChunk {
  content: CallToolResultContentItem[];
  
  // Metadata about streaming progress
  meta?: {
    progress?: number; // 0-100 representing completion percentage
    isLast?: boolean;  // Whether this is the final chunk in the stream
    error?: boolean;   // Whether this chunk represents an error state
  };
}

/**
 * Callback function type for sending streaming chunks to clients.
 * Handlers invoke this callback to send partial results during streaming operations.
 *
 * @param chunk - The data chunk to send in the stream
 */
export type StreamCallback = (chunk: StreamingChunk) => void;
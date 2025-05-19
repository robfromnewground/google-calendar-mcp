// TypeScript interfaces for Google Calendar data structures

import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

// Define the type for individual content items from CallToolResult
type CallToolResultContentItem = NonNullable<CallToolResult['content']>[number];

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

// Streaming-related types and interfaces

/**
 * A chunk of streaming response data
 */
export interface StreamingChunk {
  content: CallToolResultContentItem[];
  
  // Optional metadata about streaming progress
  meta?: {
    progress?: number; // 0-100
    isLast?: boolean;
  };
}

/**
 * Type for streaming callback function
 */
export type StreamCallback = (chunk: StreamingChunk) => void;
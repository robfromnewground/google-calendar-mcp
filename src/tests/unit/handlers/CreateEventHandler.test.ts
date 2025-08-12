import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateEventHandler } from '../../../handlers/core/CreateEventHandler.js';
import { OAuth2Client } from 'google-auth-library';

// Mock the googleapis module
vi.mock('googleapis', () => ({
  google: {
    calendar: vi.fn(() => ({
      events: {
        insert: vi.fn()
      }
    }))
  },
  calendar_v3: {}
}));

// Mock the event ID validator
vi.mock('../../../utils/event-id-validator.js', () => ({
  validateEventId: vi.fn((eventId: string) => {
    if (eventId.length < 5 || eventId.length > 1024) {
      throw new Error(`Invalid event ID: length must be between 5 and 1024 characters`);
    }
    if (!/^[a-zA-Z0-9-]+$/.test(eventId)) {
      throw new Error(`Invalid event ID: can only contain letters, numbers, and hyphens`);
    }
  })
}));

// Mock datetime utilities
vi.mock('../../../utils/datetime.js', () => ({
  createTimeObject: vi.fn((datetime: string, timezone: string) => ({ 
    dateTime: datetime,
    timeZone: timezone 
  }))
}));

describe('CreateEventHandler', () => {
  let handler: CreateEventHandler;
  let mockOAuth2Client: OAuth2Client;
  let mockCalendar: any;

  beforeEach(() => {
    handler = new CreateEventHandler();
    mockOAuth2Client = new OAuth2Client();
    
    // Setup mock calendar
    mockCalendar = {
      events: {
        insert: vi.fn()
      }
    };
    
    // Mock the getCalendar method
    vi.spyOn(handler as any, 'getCalendar').mockReturnValue(mockCalendar);
    
    // Mock getCalendarTimezone
    vi.spyOn(handler as any, 'getCalendarTimezone').mockResolvedValue('America/Los_Angeles');
  });

  describe('runTool', () => {
    it('should create an event without custom ID', async () => {
      const mockCreatedEvent = {
        id: 'generated-id-123',
        summary: 'Test Event',
        start: { dateTime: '2025-01-15T10:00:00Z' },
        end: { dateTime: '2025-01-15T11:00:00Z' },
        htmlLink: 'https://calendar.google.com/event?eid=abc123'
      };

      mockCalendar.events.insert.mockResolvedValue({ data: mockCreatedEvent });

      const args = {
        calendarId: 'primary',
        summary: 'Test Event',
        start: '2025-01-15T10:00:00',
        end: '2025-01-15T11:00:00'
      };

      const result = await handler.runTool(args, mockOAuth2Client);

      expect(mockCalendar.events.insert).toHaveBeenCalledWith({
        calendarId: 'primary',
        requestBody: expect.objectContaining({
          summary: 'Test Event',
          start: { dateTime: '2025-01-15T10:00:00', timeZone: 'America/Los_Angeles' },
          end: { dateTime: '2025-01-15T11:00:00', timeZone: 'America/Los_Angeles' }
        })
      });

      // Should not include id field when no custom ID provided
      expect(mockCalendar.events.insert.mock.calls[0][0].requestBody.id).toBeUndefined();

      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Event created successfully!');
      expect(result.content[0].text).toContain('Test Event');
    });

    it('should create an event with custom ID', async () => {
      const mockCreatedEvent = {
        id: 'custom-event-2025',
        summary: 'Test Event',
        start: { dateTime: '2025-01-15T10:00:00Z' },
        end: { dateTime: '2025-01-15T11:00:00Z' },
        htmlLink: 'https://calendar.google.com/event?eid=abc123'
      };

      mockCalendar.events.insert.mockResolvedValue({ data: mockCreatedEvent });

      const args = {
        calendarId: 'primary',
        eventId: 'custom-event-2025',
        summary: 'Test Event',
        start: '2025-01-15T10:00:00',
        end: '2025-01-15T11:00:00'
      };

      const result = await handler.runTool(args, mockOAuth2Client);

      expect(mockCalendar.events.insert).toHaveBeenCalledWith({
        calendarId: 'primary',
        requestBody: expect.objectContaining({
          id: 'custom-event-2025',
          summary: 'Test Event',
          start: { dateTime: '2025-01-15T10:00:00', timeZone: 'America/Los_Angeles' },
          end: { dateTime: '2025-01-15T11:00:00', timeZone: 'America/Los_Angeles' }
        })
      });

      expect(result.content[0].text).toContain('Event created successfully!');
    });

    it('should handle invalid custom event ID', async () => {
      const args = {
        calendarId: 'primary',
        eventId: 'bad id', // Contains space
        summary: 'Test Event',
        start: '2025-01-15T10:00:00',
        end: '2025-01-15T11:00:00'
      };

      await expect(handler.runTool(args, mockOAuth2Client)).rejects.toThrow(
        'Invalid event ID: can only contain letters, numbers, and hyphens'
      );

      expect(mockCalendar.events.insert).not.toHaveBeenCalled();
    });

    it('should handle event ID conflict (409 error)', async () => {
      const conflictError = new Error('Conflict');
      (conflictError as any).code = 409;
      mockCalendar.events.insert.mockRejectedValue(conflictError);

      const args = {
        calendarId: 'primary',
        eventId: 'existing-event',
        summary: 'Test Event',
        start: '2025-01-15T10:00:00',
        end: '2025-01-15T11:00:00'
      };

      await expect(handler.runTool(args, mockOAuth2Client)).rejects.toThrow(
        "Event ID 'existing-event' already exists. Please use a different ID."
      );
    });

    it('should handle event ID conflict with response status', async () => {
      const conflictError = new Error('Conflict');
      (conflictError as any).response = { status: 409 };
      mockCalendar.events.insert.mockRejectedValue(conflictError);

      const args = {
        calendarId: 'primary',
        eventId: 'existing-event',
        summary: 'Test Event',
        start: '2025-01-15T10:00:00',
        end: '2025-01-15T11:00:00'
      };

      await expect(handler.runTool(args, mockOAuth2Client)).rejects.toThrow(
        "Event ID 'existing-event' already exists. Please use a different ID."
      );
    });

    it('should create event with all optional fields', async () => {
      const mockCreatedEvent = {
        id: 'full-event',
        summary: 'Full Event',
        description: 'Event description',
        location: 'Conference Room A',
        start: { dateTime: '2025-01-15T10:00:00Z' },
        end: { dateTime: '2025-01-15T11:00:00Z' },
        attendees: [{ email: 'test@example.com' }],
        colorId: '5',
        reminders: { useDefault: false, overrides: [{ method: 'email', minutes: 30 }] }
      };

      mockCalendar.events.insert.mockResolvedValue({ data: mockCreatedEvent });

      const args = {
        calendarId: 'primary',
        eventId: 'full-event',
        summary: 'Full Event',
        description: 'Event description',
        location: 'Conference Room A',
        start: '2025-01-15T10:00:00',
        end: '2025-01-15T11:00:00',
        attendees: [{ email: 'test@example.com' }],
        colorId: '5',
        reminders: {
          useDefault: false,
          overrides: [{ method: 'email' as const, minutes: 30 }]
        }
      };

      const result = await handler.runTool(args, mockOAuth2Client);

      expect(mockCalendar.events.insert).toHaveBeenCalledWith({
        calendarId: 'primary',
        requestBody: expect.objectContaining({
          id: 'full-event',
          summary: 'Full Event',
          description: 'Event description',
          location: 'Conference Room A',
          attendees: [{ email: 'test@example.com' }],
          colorId: '5',
          reminders: {
            useDefault: false,
            overrides: [{ method: 'email', minutes: 30 }]
          }
        })
      });

      expect(result.content[0].text).toContain('Event created successfully!');
    });

    it('should handle API errors other than 409', async () => {
      const apiError = new Error('API Error');
      (apiError as any).code = 500;
      mockCalendar.events.insert.mockRejectedValue(apiError);

      const args = {
        calendarId: 'primary',
        summary: 'Test Event',
        start: '2025-01-15T10:00:00',
        end: '2025-01-15T11:00:00'
      };

      // Mock handleGoogleApiError
      vi.spyOn(handler as any, 'handleGoogleApiError').mockImplementation(() => {
        throw new Error('Handled API Error');
      });

      await expect(handler.runTool(args, mockOAuth2Client)).rejects.toThrow('Handled API Error');
    });

    it('should handle missing response data', async () => {
      mockCalendar.events.insert.mockResolvedValue({ data: null });

      const args = {
        calendarId: 'primary',
        summary: 'Test Event',
        start: '2025-01-15T10:00:00',
        end: '2025-01-15T11:00:00'
      };

      await expect(handler.runTool(args, mockOAuth2Client)).rejects.toThrow(
        'Failed to create event, no data returned'
      );
    });

    it('should validate event ID before making API call', async () => {
      const args = {
        calendarId: 'primary',
        eventId: 'abc', // Too short (< 5 chars)
        summary: 'Test Event',
        start: '2025-01-15T10:00:00',
        end: '2025-01-15T11:00:00'
      };

      await expect(handler.runTool(args, mockOAuth2Client)).rejects.toThrow(
        'Invalid event ID: length must be between 5 and 1024 characters'
      );

      // Should not call the API if validation fails
      expect(mockCalendar.events.insert).not.toHaveBeenCalled();
    });
  });
});
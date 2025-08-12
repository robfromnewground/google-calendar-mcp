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
  validateEventId: vi.fn()
}));

// Mock datetime utilities
vi.mock('../../../utils/datetime.js', () => ({
  createTimeObject: vi.fn((datetime: string, timezone: string) => ({ 
    dateTime: datetime,
    timeZone: timezone 
  }))
}));

describe('CreateEventHandler - Enhanced Properties', () => {
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

  describe('Guest Management Properties', () => {
    it('should create event with transparency setting', async () => {
      const mockCreatedEvent = {
        id: 'event123',
        summary: 'Focus Time',
        transparency: 'transparent'
      };

      mockCalendar.events.insert.mockResolvedValue({ data: mockCreatedEvent });

      const args = {
        calendarId: 'primary',
        summary: 'Focus Time',
        start: '2025-01-15T10:00:00',
        end: '2025-01-15T11:00:00',
        transparency: 'transparent' as const
      };

      await handler.runTool(args, mockOAuth2Client);

      expect(mockCalendar.events.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: expect.objectContaining({
            transparency: 'transparent'
          })
        })
      );
    });

    it('should create event with visibility settings', async () => {
      const mockCreatedEvent = {
        id: 'event123',
        summary: 'Private Meeting',
        visibility: 'private'
      };

      mockCalendar.events.insert.mockResolvedValue({ data: mockCreatedEvent });

      const args = {
        calendarId: 'primary',
        summary: 'Private Meeting',
        start: '2025-01-15T10:00:00',
        end: '2025-01-15T11:00:00',
        visibility: 'private' as const
      };

      await handler.runTool(args, mockOAuth2Client);

      expect(mockCalendar.events.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: expect.objectContaining({
            visibility: 'private'
          })
        })
      );
    });

    it('should create event with guest permissions', async () => {
      const mockCreatedEvent = {
        id: 'event123',
        summary: 'Team Meeting'
      };

      mockCalendar.events.insert.mockResolvedValue({ data: mockCreatedEvent });

      const args = {
        calendarId: 'primary',
        summary: 'Team Meeting',
        start: '2025-01-15T10:00:00',
        end: '2025-01-15T11:00:00',
        guestsCanInviteOthers: false,
        guestsCanModify: true,
        guestsCanSeeOtherGuests: false,
        anyoneCanAddSelf: true
      };

      await handler.runTool(args, mockOAuth2Client);

      expect(mockCalendar.events.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: expect.objectContaining({
            guestsCanInviteOthers: false,
            guestsCanModify: true,
            guestsCanSeeOtherGuests: false,
            anyoneCanAddSelf: true
          })
        })
      );
    });

    it('should send update notifications when specified', async () => {
      const mockCreatedEvent = {
        id: 'event123',
        summary: 'Meeting'
      };

      mockCalendar.events.insert.mockResolvedValue({ data: mockCreatedEvent });

      const args = {
        calendarId: 'primary',
        summary: 'Meeting',
        start: '2025-01-15T10:00:00',
        end: '2025-01-15T11:00:00',
        sendUpdates: 'externalOnly' as const
      };

      await handler.runTool(args, mockOAuth2Client);

      expect(mockCalendar.events.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          sendUpdates: 'externalOnly'
        })
      );
    });
  });

  describe('Conference Data', () => {
    it('should create event with conference data', async () => {
      const mockCreatedEvent = {
        id: 'event123',
        summary: 'Video Call',
        conferenceData: {
          entryPoints: [{ uri: 'https://meet.google.com/abc-defg-hij' }]
        }
      };

      mockCalendar.events.insert.mockResolvedValue({ data: mockCreatedEvent });

      const args = {
        calendarId: 'primary',
        summary: 'Video Call',
        start: '2025-01-15T10:00:00',
        end: '2025-01-15T11:00:00',
        conferenceData: {
          createRequest: {
            requestId: 'unique-request-123',
            conferenceSolutionKey: {
              type: 'hangoutsMeet' as const
            }
          }
        }
      };

      await handler.runTool(args, mockOAuth2Client);

      expect(mockCalendar.events.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: expect.objectContaining({
            conferenceData: {
              createRequest: {
                requestId: 'unique-request-123',
                conferenceSolutionKey: {
                  type: 'hangoutsMeet'
                }
              }
            }
          }),
          conferenceDataVersion: 1
        })
      );
    });
  });

  describe('Extended Properties', () => {
    it('should create event with extended properties', async () => {
      const mockCreatedEvent = {
        id: 'event123',
        summary: 'Custom Event'
      };

      mockCalendar.events.insert.mockResolvedValue({ data: mockCreatedEvent });

      const args = {
        calendarId: 'primary',
        summary: 'Custom Event',
        start: '2025-01-15T10:00:00',
        end: '2025-01-15T11:00:00',
        extendedProperties: {
          private: {
            'appId': '12345',
            'customField': 'value1'
          },
          shared: {
            'projectId': 'proj-789',
            'category': 'meeting'
          }
        }
      };

      await handler.runTool(args, mockOAuth2Client);

      expect(mockCalendar.events.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: expect.objectContaining({
            extendedProperties: {
              private: {
                'appId': '12345',
                'customField': 'value1'
              },
              shared: {
                'projectId': 'proj-789',
                'category': 'meeting'
              }
            }
          })
        })
      );
    });
  });

  describe('Attachments', () => {
    it('should create event with attachments', async () => {
      const mockCreatedEvent = {
        id: 'event123',
        summary: 'Meeting with Docs'
      };

      mockCalendar.events.insert.mockResolvedValue({ data: mockCreatedEvent });

      const args = {
        calendarId: 'primary',
        summary: 'Meeting with Docs',
        start: '2025-01-15T10:00:00',
        end: '2025-01-15T11:00:00',
        attachments: [
          {
            fileUrl: 'https://docs.google.com/document/d/123',
            title: 'Meeting Agenda',
            mimeType: 'application/vnd.google-apps.document'
          },
          {
            fileUrl: 'https://drive.google.com/file/d/456',
            title: 'Presentation',
            mimeType: 'application/vnd.google-apps.presentation',
            fileId: '456'
          }
        ]
      };

      await handler.runTool(args, mockOAuth2Client);

      expect(mockCalendar.events.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: expect.objectContaining({
            attachments: [
              {
                fileUrl: 'https://docs.google.com/document/d/123',
                title: 'Meeting Agenda',
                mimeType: 'application/vnd.google-apps.document'
              },
              {
                fileUrl: 'https://drive.google.com/file/d/456',
                title: 'Presentation',
                mimeType: 'application/vnd.google-apps.presentation',
                fileId: '456'
              }
            ]
          }),
          supportsAttachments: true
        })
      );
    });
  });

  describe('Enhanced Attendees', () => {
    it('should create event with detailed attendee information', async () => {
      const mockCreatedEvent = {
        id: 'event123',
        summary: 'Team Sync'
      };

      mockCalendar.events.insert.mockResolvedValue({ data: mockCreatedEvent });

      const args = {
        calendarId: 'primary',
        summary: 'Team Sync',
        start: '2025-01-15T10:00:00',
        end: '2025-01-15T11:00:00',
        attendees: [
          {
            email: 'alice@example.com',
            displayName: 'Alice Smith',
            optional: false,
            responseStatus: 'accepted' as const
          },
          {
            email: 'bob@example.com',
            displayName: 'Bob Jones',
            optional: true,
            responseStatus: 'needsAction' as const,
            comment: 'May join late',
            additionalGuests: 2
          }
        ]
      };

      await handler.runTool(args, mockOAuth2Client);

      expect(mockCalendar.events.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: expect.objectContaining({
            attendees: [
              {
                email: 'alice@example.com',
                displayName: 'Alice Smith',
                optional: false,
                responseStatus: 'accepted'
              },
              {
                email: 'bob@example.com',
                displayName: 'Bob Jones',
                optional: true,
                responseStatus: 'needsAction',
                comment: 'May join late',
                additionalGuests: 2
              }
            ]
          })
        })
      );
    });
  });

  describe('Source Property', () => {
    it('should create event with source information', async () => {
      const mockCreatedEvent = {
        id: 'event123',
        summary: 'Follow-up Meeting'
      };

      mockCalendar.events.insert.mockResolvedValue({ data: mockCreatedEvent });

      const args = {
        calendarId: 'primary',
        summary: 'Follow-up Meeting',
        start: '2025-01-15T10:00:00',
        end: '2025-01-15T11:00:00',
        source: {
          url: 'https://example.com/meetings/123',
          title: 'Original Meeting Request'
        }
      };

      await handler.runTool(args, mockOAuth2Client);

      expect(mockCalendar.events.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: expect.objectContaining({
            source: {
              url: 'https://example.com/meetings/123',
              title: 'Original Meeting Request'
            }
          })
        })
      );
    });
  });

  describe('Combined Properties', () => {
    it('should create event with multiple enhanced properties', async () => {
      const mockCreatedEvent = {
        id: 'event123',
        summary: 'Complex Event'
      };

      mockCalendar.events.insert.mockResolvedValue({ data: mockCreatedEvent });

      const args = {
        calendarId: 'primary',
        eventId: 'custom-complex-event',
        summary: 'Complex Event',
        description: 'An event with all features',
        start: '2025-01-15T10:00:00',
        end: '2025-01-15T11:00:00',
        location: 'Conference Room A',
        transparency: 'opaque' as const,
        visibility: 'public' as const,
        guestsCanInviteOthers: true,
        guestsCanModify: false,
        conferenceData: {
          createRequest: {
            requestId: 'conf-123',
            conferenceSolutionKey: {
              type: 'hangoutsMeet' as const
            }
          }
        },
        attendees: [
          {
            email: 'team@example.com',
            displayName: 'Team',
            optional: false
          }
        ],
        extendedProperties: {
          private: {
            'trackingId': '789'
          }
        },
        source: {
          url: 'https://example.com/source',
          title: 'Source System'
        },
        sendUpdates: 'all' as const
      };

      await handler.runTool(args, mockOAuth2Client);

      const callArgs = mockCalendar.events.insert.mock.calls[0][0];
      
      expect(callArgs.requestBody).toMatchObject({
        id: 'custom-complex-event',
        summary: 'Complex Event',
        description: 'An event with all features',
        location: 'Conference Room A',
        transparency: 'opaque',
        visibility: 'public',
        guestsCanInviteOthers: true,
        guestsCanModify: false
      });
      
      expect(callArgs.conferenceDataVersion).toBe(1);
      expect(callArgs.sendUpdates).toBe('all');
    });
  });
});
import { describe, it, expect } from 'vitest';
import {
  isValidEventId,
  validateEventId,
  sanitizeEventId
} from '../../../utils/event-id-validator.js';

describe('Event ID Validator', () => {
  describe('isValidEventId', () => {
    it('should accept valid event IDs', () => {
      expect(isValidEventId('valid-event-123')).toBe(true);
      expect(isValidEventId('Event2025')).toBe(true);
      expect(isValidEventId('a1b2c3d4e5')).toBe(true);
      expect(isValidEventId('meeting-2025-01-15')).toBe(true);
      expect(isValidEventId('12345')).toBe(true); // Minimum length
    });

    it('should reject IDs that are too short', () => {
      expect(isValidEventId('')).toBe(false);
      expect(isValidEventId('a')).toBe(false);
      expect(isValidEventId('ab')).toBe(false);
      expect(isValidEventId('abc')).toBe(false);
      expect(isValidEventId('abcd')).toBe(false); // 4 chars, min is 5
    });

    it('should reject IDs that are too long', () => {
      const longId = 'a'.repeat(1025);
      expect(isValidEventId(longId)).toBe(false);
    });

    it('should accept IDs at boundary lengths', () => {
      const minId = 'a'.repeat(5);
      const maxId = 'a'.repeat(1024);
      expect(isValidEventId(minId)).toBe(true);
      expect(isValidEventId(maxId)).toBe(true);
    });

    it('should reject IDs with invalid characters', () => {
      expect(isValidEventId('event id')).toBe(false); // Space
      expect(isValidEventId('event_id')).toBe(false); // Underscore
      expect(isValidEventId('event.id')).toBe(false); // Period
      expect(isValidEventId('event/id')).toBe(false); // Slash
      expect(isValidEventId('event@id')).toBe(false); // At symbol
      expect(isValidEventId('event#id')).toBe(false); // Hash
      expect(isValidEventId('event$id')).toBe(false); // Dollar
      expect(isValidEventId('event%id')).toBe(false); // Percent
    });
  });

  describe('validateEventId', () => {
    it('should not throw for valid event IDs', () => {
      expect(() => validateEventId('valid-event-123')).not.toThrow();
      expect(() => validateEventId('Event2025')).not.toThrow();
    });

    it('should throw with specific error for short IDs', () => {
      expect(() => validateEventId('abc')).toThrow('Invalid event ID: must be at least 5 characters long');
    });

    it('should throw with specific error for long IDs', () => {
      const longId = 'a'.repeat(1025);
      expect(() => validateEventId(longId)).toThrow('Invalid event ID: must not exceed 1024 characters');
    });

    it('should throw with specific error for invalid characters', () => {
      expect(() => validateEventId('event_id_123')).toThrow('Invalid event ID: can only contain letters, numbers, and hyphens');
    });

    it('should combine multiple error messages', () => {
      expect(() => validateEventId('a b')).toThrow('Invalid event ID: must be at least 5 characters long, can only contain letters, numbers, and hyphens');
    });
  });

  describe('sanitizeEventId', () => {
    it('should replace invalid characters with hyphens', () => {
      expect(sanitizeEventId('event id 123')).toMatch(/^event-id-123/);
      expect(sanitizeEventId('event_id_123')).toMatch(/^event-id-123/);
      expect(sanitizeEventId('event.id.123')).toMatch(/^event-id-123/);
    });

    it('should remove consecutive hyphens', () => {
      expect(sanitizeEventId('event___id')).toMatch(/^event-id/);
      expect(sanitizeEventId('event---id')).toMatch(/^event-id/);
    });

    it('should remove leading and trailing hyphens', () => {
      expect(sanitizeEventId('-event-id-')).toMatch(/^event-id/);
      expect(sanitizeEventId('___event___')).toMatch(/^event/);
    });

    it('should pad short IDs to meet minimum length', () => {
      const result = sanitizeEventId('ab');
      expect(result.length).toBeGreaterThanOrEqual(5);
      expect(result).toMatch(/^ab-\d+/); // Should append timestamp
    });

    it('should truncate long IDs to maximum length', () => {
      const longInput = 'a'.repeat(2000);
      const result = sanitizeEventId(longInput);
      expect(result.length).toBe(1024);
    });

    it('should handle empty input', () => {
      const result = sanitizeEventId('');
      expect(result).toMatch(/^event-\d+$/);
      expect(result.length).toBeGreaterThanOrEqual(5);
    });

    it('should handle input with only invalid characters', () => {
      const result = sanitizeEventId('!@#$%');
      expect(result).toMatch(/^event-\d+$/);
    });

    it('should preserve valid characters', () => {
      const result = sanitizeEventId('ValidEvent123');
      expect(result).toBe('ValidEvent123');
    });

    it('should handle mixed valid and invalid characters', () => {
      const result = sanitizeEventId('Event!@#2025$%^Meeting');
      expect(result).toMatch(/^Event-2025-Meeting/);
    });
  });
});
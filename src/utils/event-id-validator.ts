/**
 * Event ID validation utility for Google Calendar API
 */

/**
 * Validates a custom event ID according to Google Calendar requirements
 * @param eventId The event ID to validate
 * @returns true if valid, false otherwise
 */
export function isValidEventId(eventId: string): boolean {
  // Check length constraints (5-1024 characters)
  if (eventId.length < 5 || eventId.length > 1024) {
    return false;
  }
  
  // Check character constraints (alphanumeric and hyphens only)
  // Google Calendar allows: a-z, A-Z, 0-9, and -
  const validPattern = /^[a-zA-Z0-9-]+$/;
  return validPattern.test(eventId);
}

/**
 * Validates and throws an error if the event ID is invalid
 * @param eventId The event ID to validate
 * @throws Error if the event ID is invalid
 */
export function validateEventId(eventId: string): void {
  if (!isValidEventId(eventId)) {
    const errors: string[] = [];
    
    if (eventId.length < 5) {
      errors.push("must be at least 5 characters long");
    }
    
    if (eventId.length > 1024) {
      errors.push("must not exceed 1024 characters");
    }
    
    if (!/^[a-zA-Z0-9-]+$/.test(eventId)) {
      errors.push("can only contain letters, numbers, and hyphens");
    }
    
    throw new Error(`Invalid event ID: ${errors.join(", ")}`);
  }
}

/**
 * Sanitizes a string to make it a valid event ID
 * Replaces invalid characters with hyphens and ensures length constraints
 * @param input The input string to sanitize
 * @returns A valid event ID
 */
export function sanitizeEventId(input: string): string {
  // Replace invalid characters with hyphens
  let sanitized = input.replace(/[^a-zA-Z0-9-]/g, '-');
  
  // Remove consecutive hyphens
  sanitized = sanitized.replace(/-+/g, '-');
  
  // Remove leading/trailing hyphens
  sanitized = sanitized.replace(/^-+|-+$/g, '');
  
  // Ensure minimum length
  if (sanitized.length < 5) {
    // If sanitized is empty or too short, generate a default
    if (sanitized.length === 0) {
      sanitized = `event-${Date.now()}`;
    } else {
      // Pad with timestamp to ensure uniqueness
      sanitized = `${sanitized}-${Date.now()}`.slice(0, 1024);
    }
  }
  
  // Ensure maximum length
  if (sanitized.length > 1024) {
    sanitized = sanitized.slice(0, 1024);
  }
  
  // If still too short after all operations, generate a default
  if (sanitized.length < 5) {
    sanitized = `event-${Date.now()}`;
  }
  
  return sanitized;
}
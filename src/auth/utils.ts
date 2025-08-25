import * as path from 'path';
import * as os from 'os';
import { fileURLToPath } from 'url';
import { getSecureTokenPath as getSharedSecureTokenPath, getLegacyTokenPath as getSharedLegacyTokenPath, getAccountMode as getSharedAccountMode } from './paths.js';

// Helper to get the project root directory reliably
function getProjectRoot(): string {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  // In build output (e.g., build/bundle.js), __dirname is .../build
  // Go up ONE level to get the project root
  const projectRoot = path.join(__dirname, ".."); // Corrected: Go up ONE level
  return path.resolve(projectRoot); // Ensure absolute path
}

// Get the current account mode (normal or test) - delegates to shared implementation
export function getAccountMode(): 'normal' | 'test' {
  return getSharedAccountMode() as 'normal' | 'test';
}

// Helper to detect if we're running in a test environment
function isRunningInTestEnvironment(): boolean {
  // Simple and reliable: just check NODE_ENV
  return process.env.NODE_ENV === 'test';
}

// Returns the absolute path for the saved token file - delegates to shared implementation
export function getSecureTokenPath(): string {
  return getSharedSecureTokenPath();
}

// Returns the legacy token path for backward compatibility - delegates to shared implementation  
export function getLegacyTokenPath(): string {
  return getSharedLegacyTokenPath();
}

// Returns the absolute path for the GCP OAuth keys file with priority:
// 1. Environment variable GOOGLE_OAUTH_CREDENTIALS (highest priority)
// 2. Default file path (lowest priority)
export function getKeysFilePath(): string {
  // Priority 1: Environment variable
  const envCredentialsPath = process.env.GOOGLE_OAUTH_CREDENTIALS;
  if (envCredentialsPath) {
    return path.resolve(envCredentialsPath);
  }
  
  // Priority 2: Default file path
  const projectRoot = getProjectRoot();
  const keysPath = path.join(projectRoot, "gcp-oauth.keys.json");
  return keysPath; // Already absolute from getProjectRoot
}

// Load OAuth credentials from base64 environment variable (for Railway/cloud deployment)
export function loadCredentialsFromBase64(): OAuthCredentials | null {
  const base64Credentials = process.env.GOOGLE_OAUTH_CREDENTIALS_BASE64;
  if (!base64Credentials) {
    return null;
  }
  
  try {
    const jsonString = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const credentials = JSON.parse(jsonString);
    
    // Handle both direct format and "web" wrapper format
    if (credentials.web) {
      return {
        client_id: credentials.web.client_id,
        client_secret: credentials.web.client_secret,
        redirect_uris: credentials.web.redirect_uris || [(process.env.OAUTH_BASE_URL || 'http://localhost:3000') + '/oauth2callback']
      };
    } else if (credentials.client_id && credentials.client_secret) {
      return {
        client_id: credentials.client_id,
        client_secret: credentials.client_secret,
        redirect_uris: credentials.redirect_uris || [(process.env.OAUTH_BASE_URL || 'http://localhost:3000') + '/oauth2callback']
      };
    } else {
      throw new Error('Invalid credentials format in base64 data');
    }
  } catch (error) {
    throw new Error(`Failed to parse base64 credentials: ${error instanceof Error ? error.message : error}`);
  }
}

// Helper to determine if we're currently in test mode
export function isTestMode(): boolean {
  return getAccountMode() === 'test';
}

// Interface for OAuth credentials
export interface OAuthCredentials {
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
}

// Generate helpful error message for missing credentials
export function generateCredentialsErrorMessage(): string {
  return `
OAuth credentials not found. Please provide credentials using one of these methods:

1. Base64 environment variable (recommended for cloud deployment):
   Set GOOGLE_OAUTH_CREDENTIALS_BASE64 to your base64-encoded credentials:
   export GOOGLE_OAUTH_CREDENTIALS_BASE64="eyJ3ZWIiOnsic..."

2. File path environment variable:
   Set GOOGLE_OAUTH_CREDENTIALS to the path of your credentials file:
   export GOOGLE_OAUTH_CREDENTIALS="/path/to/gcp-oauth.keys.json"

3. Default file path:
   Place your gcp-oauth.keys.json file in the package root directory.

Token storage:
- Tokens are saved to: ${getSecureTokenPath()}
- To use a custom token location, set GOOGLE_CALENDAR_MCP_TOKEN_PATH environment variable

To get OAuth credentials:
1. Go to the Google Cloud Console (https://console.cloud.google.com/)
2. Create or select a project
3. Enable the Google Calendar API
4. Create OAuth 2.0 credentials
5. Download the credentials file as gcp-oauth.keys.json
`.trim();
}

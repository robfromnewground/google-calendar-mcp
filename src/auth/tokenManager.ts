import { OAuth2Client, Credentials } from 'google-auth-library';
import fs from 'fs/promises';
import { getSecureTokenPath } from './utils.js';
import { GaxiosError } from 'gaxios';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';

export class TokenManager {
  private oauth2Client: OAuth2Client;
  private tokenPath: string;

  constructor(oauth2Client: OAuth2Client) {
    this.oauth2Client = oauth2Client;
    this.tokenPath = getSecureTokenPath();
    this.setupTokenRefresh();
  }

  // Method to expose the token path
  public getTokenPath(): string {
    return this.tokenPath;
  }

  private async ensureTokenDirectoryExists(): Promise<void> {
    try {
      await mkdir(dirname(this.tokenPath), { recursive: true });
    } catch (error) {
      process.stderr.write(`Failed to create token directory: ${error}\n`);
    }
  }

  private setupTokenRefresh(): void {
    this.oauth2Client.on("tokens", async (newTokens) => {
      try {
        await this.ensureTokenDirectoryExists();
        const currentTokens = JSON.parse(await fs.readFile(this.tokenPath, "utf-8"));
        const updatedTokens = {
          ...currentTokens,
          ...newTokens,
          refresh_token: newTokens.refresh_token || currentTokens.refresh_token,
        };
        await fs.writeFile(this.tokenPath, JSON.stringify(updatedTokens, null, 2), {
          mode: 0o600,
        });
        process.stderr.write("Tokens updated and saved\n");
      } catch (error: unknown) {
        // Handle case where currentTokens might not exist yet
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') { 
          try {
             await fs.writeFile(this.tokenPath, JSON.stringify(newTokens, null, 2), { mode: 0o600 });
             process.stderr.write("New tokens saved\n");
          } catch (writeError) {
            process.stderr.write("Error saving initial tokens: ");
            if (writeError) {
              process.stderr.write(writeError.toString());
            }
            process.stderr.write("\n");
          }
        } else {
            process.stderr.write("Error saving updated tokens: ");
            if (error instanceof Error) {
              process.stderr.write(error.message);
            } else if (typeof error === 'string') {
              process.stderr.write(error);
            }
            process.stderr.write("\n");
        }
      }
    });
  }

  async loadSavedTokens(): Promise<boolean> {
    try {
      await this.ensureTokenDirectoryExists();
      if (
        !(await fs
          .access(this.tokenPath)
          .then(() => true)
          .catch(() => false))
      ) {
        process.stderr.write(`No token file found at: ${this.tokenPath}\n`);
        return false;
      }

      const tokens = JSON.parse(await fs.readFile(this.tokenPath, "utf-8"));

      if (!tokens || typeof tokens !== "object") {
        process.stderr.write(`Invalid token format in file: ${this.tokenPath}\n`);
        return false;
      }

      this.oauth2Client.setCredentials(tokens);
      return true;
    } catch (error: unknown) {
      process.stderr.write("Error loading tokens: ");
      if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') { 
          try { 
              await fs.unlink(this.tokenPath); 
              process.stderr.write("Removed potentially corrupted token file\n"); 
            } catch (unlinkErr) { /* ignore */ } 
      }
      return false;
    }
  }

  async refreshTokensIfNeeded(): Promise<boolean> {
    const expiryDate = this.oauth2Client.credentials.expiry_date;
    const isExpired = expiryDate
      ? Date.now() >= expiryDate - 5 * 60 * 1000 // 5 minute buffer
      : !this.oauth2Client.credentials.access_token; // No token means we need one

    if (isExpired && this.oauth2Client.credentials.refresh_token) {
      process.stderr.write("Auth token expired or nearing expiry, refreshing...\n");
      try {
        const response = await this.oauth2Client.refreshAccessToken();
        const newTokens = response.credentials;

        if (!newTokens.access_token) {
          throw new Error("Received invalid tokens during refresh");
        }
        // The 'tokens' event listener should handle saving
        this.oauth2Client.setCredentials(newTokens);
        process.stderr.write("Token refreshed successfully\n");
        return true;
      } catch (refreshError) {
        if (refreshError instanceof GaxiosError && refreshError.response?.data?.error === 'invalid_grant') {
            process.stderr.write("Error refreshing auth token: Invalid grant. Token likely expired or revoked. Please re-authenticate.\n");
            // Optionally clear the potentially invalid tokens here
            // await this.clearTokens(); 
            return false; // Indicate failure due to invalid grant
        } else {
            // Handle other refresh errors
            process.stderr.write("Error refreshing auth token: ");
            if (refreshError instanceof Error) {
              process.stderr.write(refreshError.message);
            } else if (typeof refreshError === 'string') {
              process.stderr.write(refreshError);
            }
            process.stderr.write("\n");
            return false;
        }
      }
    } else if (!this.oauth2Client.credentials.access_token && !this.oauth2Client.credentials.refresh_token) {
        process.stderr.write("No access or refresh token available. Please re-authenticate.\n");
        return false;
    } else {
        // Token is valid or no refresh token available
        return true;
    }
  }

  async validateTokens(): Promise<boolean> {
    if (!this.oauth2Client.credentials || !this.oauth2Client.credentials.access_token) {
        // Try loading first if no credentials set
        if (!(await this.loadSavedTokens())) {
            return false; // No saved tokens to load
        }
        // Check again after loading
        if (!this.oauth2Client.credentials || !this.oauth2Client.credentials.access_token) {
            return false; // Still no token after loading
        }
    }
    return this.refreshTokensIfNeeded();
  }

  async saveTokens(tokens: Credentials): Promise<void> {
    try {
        await this.ensureTokenDirectoryExists();
        await fs.writeFile(this.tokenPath, JSON.stringify(tokens, null, 2), { mode: 0o600 });
        this.oauth2Client.setCredentials(tokens);
        process.stderr.write(`Tokens saved successfully to: ${this.tokenPath}\n`);
    } catch (error: unknown) {
        process.stderr.write(`Error saving tokens: ${error}\n`);
        throw error;
    }
  }

  async clearTokens(): Promise<void> {
    try {
      this.oauth2Client.setCredentials({}); // Clear in memory
      await fs.unlink(this.tokenPath);
      process.stderr.write("Tokens cleared successfully\n");
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        // File already gone, which is fine
        process.stderr.write("Token file already deleted\n");
      } else {
        process.stderr.write(`Error clearing tokens: ${error}\n`);
        // Don't re-throw, clearing is best-effort
      }
    }
  }
} 
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { OAuth2Client } from "google-auth-library";
import { GaxiosError } from 'gaxios';
import { calendar_v3, google } from "googleapis";
import { CallToolResultContentItem } from "../../schemas/types.js";


export abstract class BaseToolHandler {
    /**
     * Run the tool and return a complete response
     * @param args Tool arguments
     * @param oauth2Client Authenticated OAuth2 client
     * @returns Promise resolving to the tool result
     */
    abstract runTool(args: any, oauth2Client: OAuth2Client): Promise<CallToolResult>;
    
    /**
     * Executes a tool with progressive streaming support.
     * 
     * This method allows tools to send partial results as they become available,
     * providing a more responsive experience for long-running operations.
     * Each handler should override this method to implement streaming for their specific tool.
     * 
     * The default implementation sends the complete result as a single chunk after execution.
     * 
     * @param args - Tool arguments validated by the handler
     * @param oauth2Client - Authenticated Google OAuth2 client
     * @param extra - MCP request context containing metadata and utility methods
     * @param transportDataStreamCallback - Function to call with each chunk of streaming data
     * @param progressToken - Unique identifier for this streaming session
     * @returns An initial CallToolResult indicating streaming has started; actual data is sent via callback
     */
    async runToolStreaming(
      args: any,
      oauth2Client: OAuth2Client,
      extra: any, // General extra (for control notifications like cancellation)
      transportDataStreamCallback: (partialResult: { progressToken: string | number; content?: CallToolResultContentItem[]; _meta?: any }) => void,
      progressToken: string | number
    ): Promise<CallToolResult> {
      // Default implementation for handlers without streaming support:
      // 1. Execute the standard synchronous implementation
      // 2. Send the complete result as a single chunk with 100% progress
      // 3. Return a minimal initial response
      const fullResult = await this.runTool(args, oauth2Client);
      transportDataStreamCallback({
        progressToken,
        content: fullResult.content,
        _meta: { ...fullResult._meta, isLast: true, progress: 100 }
      });
      return {
        structuredContent: {},
        _meta: { streamingInitiated: true, progressToken }
      };
    }

    /**
     * Enhanced error handler for Google API errors
     * 
     * Translates Google API error codes into more user-friendly error messages
     * and provides guidance on how to resolve common issues.
     * 
     * @param error - The error from the Google API
     * @throws Error with user-friendly message
     */
    protected handleGoogleApiError(error: unknown): never {
        // If it's not a Google API error, just rethrow it
        if (!(error instanceof GaxiosError)) {
            throw error;
        }

        const statusCode = error.response?.status;
        const errorCode = error.response?.data?.error;
        const errorMessage = error.response?.data?.error_description || error.message;

        // Handle authentication-related errors
        if (errorCode === 'invalid_grant') {
            throw new Error(
                'Google API Error: Authentication token is invalid or expired. ' +
                'Please re-run the authentication process (e.g., `npm run auth`).'
            );
        }

        // Handle rate limiting and quota errors
        if (statusCode === 403 || statusCode === 429 || 
            errorMessage?.includes('quota') || errorMessage?.includes('rate limit')) {
            throw new Error(
                'Google API Error: Rate limit or quota exceeded. ' +
                'Please try again later or check your Google Cloud Console quota settings.'
            );
        }

        // Handle permission errors
        if (statusCode === 403 || errorCode === 'forbidden') {
            throw new Error(
                'Google API Error: Insufficient permissions. ' +
                'Make sure your Google account has access to the requested calendar.'
            );
        }

        // Handle not found errors
        if (statusCode === 404 || errorCode === 'notFound') {
            throw new Error(
                'Google API Error: Resource not found. ' +
                'The requested calendar or event may not exist or you may not have access to it.'
            );
        }

        // Handle gateway timeout errors
        if (statusCode === 504 || statusCode === 502 || errorMessage?.includes('timeout')) {
            throw new Error(
                'Google API Error: Operation timed out. ' +
                'The request took too long to complete. Please try again later.'
            );
        }

        // Generic error handling
        throw new Error(`Google Calendar API Error (${statusCode || 'unknown'}): ${errorMessage || 'Unknown error'}`);  
    }

    protected getCalendar(auth: OAuth2Client): calendar_v3.Calendar {
        return google.calendar({ version: 'v3', auth });
    }
}
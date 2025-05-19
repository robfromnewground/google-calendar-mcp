import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { OAuth2Client } from "google-auth-library";
import { GaxiosError } from 'gaxios';
import { calendar_v3, google } from "googleapis";
import { StreamCallback, StreamingChunk } from "../../schemas/types.js";


export abstract class BaseToolHandler {
    /**
     * Run the tool and return a complete response
     * @param args Tool arguments
     * @param oauth2Client Authenticated OAuth2 client
     * @returns Promise resolving to the tool result
     */
    abstract runTool(args: any, oauth2Client: OAuth2Client): Promise<CallToolResult>;
    
    /**
     * Run the tool with streaming response support
     * @param args Tool arguments
     * @param oauth2Client Authenticated OAuth2 client
     * @param streamCallback Function to call with each chunk of the streaming response
     * @returns Promise that resolves when streaming is complete
     */
    async runToolStreaming(
      args: any, 
      oauth2Client: OAuth2Client, 
      streamCallback: StreamCallback
    ): Promise<void> {
      // Default implementation calls regular runTool and sends result as a single chunk
      // Derived classes should override this for true streaming behavior
      const result = await this.runTool(args, oauth2Client);
      
      // Content from runTool should be CallToolResultContentItem[] or undefined
      const toolContent = result.content || [{ type: 'text', text: 'No content available' }];
      
      // Send the result as a single chunk
      const chunk: StreamingChunk = {
        content: toolContent, // Directly use result.content or a default
        meta: {
          progress: 100,
          isLast: true
        }
      };
      
      streamCallback(chunk);
    }

    protected handleGoogleApiError(error: unknown): void {
        if (
            error instanceof GaxiosError &&
            error.response?.data?.error === 'invalid_grant'
        ) {
            throw new Error(
                'Google API Error: Authentication token is invalid or expired. Please re-run the authentication process (e.g., `npm run auth`).'
            );
        }
        throw error;
    }

    protected getCalendar(auth: OAuth2Client): calendar_v3.Calendar {
        return google.calendar({ version: 'v3', auth });
    }
}

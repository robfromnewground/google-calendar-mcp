#!/usr/bin/env node

/**
 * Example HTTP Client for Google Calendar MCP Server
 * 
 * This demonstrates how to connect to the Google Calendar MCP server
 * when it's running in HTTP transport mode.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

async function main() {
  const serverUrl = process.argv[2] || 'http://localhost:3000/sse';
  
  console.log(`Connecting to Google Calendar MCP Server at: ${serverUrl}`);
  
  try {
    // Create MCP client
    const client = new Client({
      name: "google-calendar-client",
      version: "1.0.0"
    }, {
      capabilities: {}
    });

    // Create SSE transport
    const transport = new SSEClientTransport(new URL(serverUrl));
    
    // Connect to server
    await client.connect(transport);
    console.log('✅ Connected to MCP server');

    // List available tools
    console.log('\n📋 Available tools:');
    const tools = await client.listTools();
    tools.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });

    // Example: List calendars
    console.log('\n📅 Listing calendars...');
    const calendarsResult = await client.callTool({
      name: 'list-calendars',
      arguments: {}
    });
    
    console.log('Calendars result:', calendarsResult.content[0].text);

    // Example: List events from primary calendar
    console.log('\n📋 Listing recent events...');
    const eventsResult = await client.callTool({
      name: 'list-events',
      arguments: {
        calendarId: 'primary',
        maxResults: 5
      }
    });
    
    console.log('Events result:', eventsResult.content[0].text);

    console.log('\n✅ Example completed successfully');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  process.exit(0);
});

main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
}); 
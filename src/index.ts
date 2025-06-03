import { fileURLToPath } from "url";
import { GoogleCalendarMcpServer } from './server.js';
import { parseArgs } from './config/TransportConfig.js';

// --- Main Application Logic --- 
async function main() {
  try {
    // Parse command line arguments
    const config = parseArgs(process.argv.slice(2));
    
    // Create and initialize the server
    const server = new GoogleCalendarMcpServer(config);
    await server.initialize();
    
    // Start the server with the appropriate transport
    await server.start();

  } catch (error: unknown) {
    process.stderr.write(`Failed to start server: ${error instanceof Error ? error.message : error}\n`);
    process.exit(1);
  }
}

// --- Exports & Execution Guard --- 
// Export main for testing or potential programmatic use
export { main };

// Run main() only when this script is executed directly
const isDirectRun = import.meta.url.startsWith('file://') && process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((error) => {
    process.stderr.write(`Unhandled error: ${error instanceof Error ? error.message : error}\n`);
    process.exit(1);
  });
}

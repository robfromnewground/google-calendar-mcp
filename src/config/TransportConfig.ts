export interface TransportConfig {
  type: 'stdio' | 'http';
  port?: number;
  host?: string;
  allowedOrigins?: string[];
  sessionTimeout?: number;
  authMode?: 'local' | 'remote' | 'tokens';
}

export interface ServerConfig {
  transport: TransportConfig;
  debug?: boolean;
}

export function parseArgs(args: string[]): ServerConfig {
  const config: ServerConfig = {
    transport: {
      type: 'stdio', // Default to stdio for backward compatibility
      port: 3000,
      host: '127.0.0.1', // Bind to localhost for security
      allowedOrigins: ['http://localhost:3000', 'https://localhost:3000'],
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      authMode: 'local'
    },
    debug: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--transport':
        const transport = args[++i];
        if (transport === 'stdio' || transport === 'http') {
          config.transport.type = transport;
        }
        break;
      case '--port':
        config.transport.port = parseInt(args[++i], 10);
        break;
      case '--host':
        config.transport.host = args[++i];
        break;
      case '--allowed-origins':
        config.transport.allowedOrigins = args[++i].split(',');
        break;
      case '--auth-mode':
        const authMode = args[++i];
        if (authMode === 'local' || authMode === 'remote' || authMode === 'tokens') {
          config.transport.authMode = authMode;
        }
        break;
      case '--debug':
        config.debug = true;
        break;
      case '--help':
        console.log(`
Google Calendar MCP Server

Usage: node build/index.js [options]

Options:
  --transport <type>        Transport type: stdio (default) | http
  --port <number>          Port for HTTP transport (default: 3000)
  --host <string>          Host for HTTP transport (default: 127.0.0.1)
  --allowed-origins <list> Comma-separated list of allowed origins
  --auth-mode <mode>       Authentication mode: local | remote | tokens
  --debug                  Enable debug logging
  --help                   Show this help message

Examples:
  node build/index.js                                    # stdio (local use)
  node build/index.js --transport http --port 3000       # HTTP server
  node build/index.js --transport http --auth-mode remote # Remote auth
        `);
        process.exit(0);
    }
  }

  return config;
} 
import express from 'express';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { randomUUID } from 'node:crypto';
import { TransportConfig } from '../config/TransportConfig.js';
import { Transport } from './TransportFactory.js';
import http from 'http';

export class HttpTransport implements Transport {
  private app: express.Express;
  private server: http.Server | null = null;
  private transports: { [sessionId: string]: SSEServerTransport } = {};
  private config: TransportConfig;
  private mcpServer?: Server;

  constructor(config: TransportConfig) {
    this.config = config;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Enable JSON parsing
    this.app.use(express.json());

    // CORS middleware
    this.app.use((req, res, next) => {
      const origin = req.headers.origin;
      const allowedOrigins = this.config.allowedOrigins || ['http://localhost:3000'];
      
      if (origin && allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
      }
      
      res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Accept');
      res.header('Access-Control-Allow-Credentials', 'true');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
      }
      
      next();
    });

    // Security: Origin validation for non-OPTIONS requests
    this.app.use((req, res, next) => {
      if (req.method === 'OPTIONS') {
        return next();
      }

      const origin = req.headers.origin;
      const allowedOrigins = this.config.allowedOrigins || ['http://localhost:3000'];
      
      // Allow requests without origin (e.g., from curl, Postman)
      if (!origin) {
        return next();
      }
      
      if (!allowedOrigins.includes(origin)) {
        return res.status(403).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Origin not allowed'
          },
          id: null
        });
      }
      
      next();
    });

    // Rate limiting (basic implementation)
    const requestCounts = new Map<string, { count: number; resetTime: number }>();
    this.app.use((req, res, next) => {
      const clientId = req.ip || 'unknown';
      const now = Date.now();
      const windowMs = 60 * 1000; // 1 minute
      const maxRequests = 100; // 100 requests per minute
      
      const clientData = requestCounts.get(clientId);
      
      if (!clientData || now > clientData.resetTime) {
        requestCounts.set(clientId, { count: 1, resetTime: now + windowMs });
        return next();
      }
      
      if (clientData.count >= maxRequests) {
        return res.status(429).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Rate limit exceeded'
          },
          id: null
        });
      }
      
      clientData.count++;
      next();
    });
  }

  private setupRoutes(): void {
    // SSE endpoint for establishing connections
    this.app.get('/sse', async (req, res) => {
      try {
        console.log('SSE connection established');
        const sessionId = randomUUID();
        const transport = new SSEServerTransport('/messages', res);
        
        this.transports[sessionId] = transport;
        
        // Set up session timeout
        setTimeout(() => {
          if (this.transports[sessionId]) {
            console.log(`Session ${sessionId} timed out`);
            delete this.transports[sessionId];
          }
        }, this.config.sessionTimeout || 30 * 60 * 1000);

        res.on('close', () => {
          console.log('SSE connection closed');
          delete this.transports[sessionId];
        });

        if (this.mcpServer) {
          await this.mcpServer.connect(transport);
        }
      } catch (error) {
        console.error('Error establishing SSE connection:', error);
        if (!res.headersSent) {
          res.status(500).send('Internal server error');
        }
      }
    });

    // Messages endpoint for handling POST requests
    this.app.post('/messages', async (req, res) => {
      try {
        const sessionId = req.query.sessionId as string;
        const transport = this.transports[sessionId];
        
        if (transport) {
          await transport.handlePostMessage(req, res);
        } else {
          res.status(400).send('No transport found for sessionId');
        }
      } catch (error) {
        console.error('Error handling message:', error);
        if (!res.headersSent) {
          res.status(500).send('Internal server error');
        }
      }
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        transport: 'sse', 
        sessions: Object.keys(this.transports).length 
      });
    });

    // Info endpoint
    this.app.get('/info', (req, res) => {
      res.json({
        name: 'google-calendar-mcp',
        version: '1.2.0',
        transport: 'sse',
        endpoints: {
          sse: '/sse',
          messages: '/messages',
          health: '/health',
          info: '/info'
        }
      });
    });
  }

  async connect(server: Server): Promise<void> {
    // Store server reference for creating connections
    this.mcpServer = server;
    
    return new Promise((resolve, reject) => {
      const port = this.config.port || 3000;
      const host = this.config.host || '127.0.0.1';
      
      this.server = this.app.listen(port, host, () => {
        console.log(`Google Calendar MCP Server (SSE) listening on ${host}:${port}`);
        console.log(`SSE endpoint: http://${host}:${port}/sse`);
        console.log(`Health check: http://${host}:${port}/health`);
        resolve();
      });

      this.server.on('error', (error) => {
        reject(error);
      });
    });
  }

  async close(): Promise<void> {
    // Close all active transports
    for (const transport of Object.values(this.transports)) {
      // SSEServerTransport doesn't have a close method, connections close when response ends
    }
    this.transports = {};

    // Close HTTP server
    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => {
          console.log('HTTP server closed');
          resolve();
        });
      });
    }
  }
} 
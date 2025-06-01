import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { TransportConfig } from '../config/TransportConfig.js';
import { HttpTransport } from './HttpTransport.js';

export interface Transport {
  connect(server: Server): Promise<void>;
  close(): Promise<void>;
}

export class TransportFactory {
  static async create(config: TransportConfig): Promise<Transport> {
    switch (config.type) {
      case 'stdio':
        return new StdioTransportWrapper();
      case 'http':
        return new HttpTransport(config);
      default:
        throw new Error(`Unsupported transport type: ${config.type}`);
    }
  }
}

class StdioTransportWrapper implements Transport {
  private transport: StdioServerTransport;

  constructor() {
    this.transport = new StdioServerTransport();
  }

  async connect(server: Server): Promise<void> {
    await server.connect(this.transport);
  }

  async close(): Promise<void> {
    // StdioServerTransport doesn't have a close method
    // Connection closes when process exits
  }
} 
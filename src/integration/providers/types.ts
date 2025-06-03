// Core types and interfaces for multi-provider LLM integration

export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface ToolExecutionResult {
  toolCall: ToolCall;
  result: any;
  success: boolean;
  error?: string;
}

export interface LLMResponse {
  content: string;
  toolCalls: ToolCall[];
  executedResults: ToolExecutionResult[];
  model: string;
  provider: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}

export interface ProviderConfig {
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  [key: string]: any; // Allow provider-specific options
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

/**
 * Abstract interface for LLM providers
 * Each provider implementation must provide these methods
 */
export abstract class LLMProvider {
  abstract readonly name: string;
  protected config: ProviderConfig;
  
  constructor(config: ProviderConfig) {
    this.config = config;
  }

  /**
   * Send a message to the LLM and execute any tool calls
   */
  abstract sendMessage(
    prompt: string, 
    availableTools: MCPTool[], 
    mcpClient: any
  ): Promise<LLMResponse>;

  /**
   * Convert MCP tool schema to provider-specific format
   */
  protected abstract convertToolSchema(mcpTool: MCPTool): any;

  /**
   * Validate provider configuration
   */
  protected validateConfig(): void {
    if (!this.config.apiKey) {
      throw new Error(`API key is required for ${this.name} provider`);
    }
    if (!this.config.model) {
      throw new Error(`Model is required for ${this.name} provider`);
    }
  }
}

export type SupportedProvider = 'anthropic' | 'openai' | 'google' | 'cohere';

export interface ProviderTestConfig {
  provider: SupportedProvider;
  config: ProviderConfig;
  enabled: boolean;
} 
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

/**
 * Schema Compatibility Tests
 * 
 * These tests ensure that all MCP tool schemas are compatible with
 * various MCP clients (OpenAI, Claude, etc.) by validating that
 * schemas don't contain problematic features at the top level.
 */

describe('Schema Compatibility', () => {
  let mcpClient: Client;
  let transport: StdioClientTransport;
  let availableTools: any;

  beforeAll(async () => {
    // Connect to MCP server to get actual schemas
    mcpClient = new Client({
      name: "schema-test-client",
      version: "1.0.0"
    }, {
      capabilities: { tools: {} }
    });

    transport = new StdioClientTransport({
      command: 'node',
      args: ['build/index.js'],
      env: Object.fromEntries(
        Object.entries(process.env).filter(([, value]) => value !== undefined)
      ) as Record<string, string>
    });

    await mcpClient.connect(transport);
    availableTools = await mcpClient.listTools();
  }, 10000);

  afterAll(async () => {
    if (mcpClient && transport) {
      await mcpClient.close();
    }
  }, 10000);

  it('should have tools available', () => {
    expect(availableTools.tools).toBeDefined();
    expect(availableTools.tools.length).toBeGreaterThan(0);
  });

  it('should not contain problematic schema features at top level', () => {
    const problematicFeatures = ['oneOf', 'anyOf', 'allOf', 'not'];
    const issues: string[] = [];

    for (const tool of availableTools.tools) {
      const schemaStr = JSON.stringify(tool.inputSchema);
      
      for (const feature of problematicFeatures) {
        if (schemaStr.includes(`"${feature}"`)) {
          issues.push(`Tool "${tool.name}" contains problematic feature: ${feature}`);
        }
      }
    }

    if (issues.length > 0) {
      throw new Error(`Schema compatibility issues found:\n${issues.join('\n')}`);
    }
  });

  it('should have proper schema structure for all tools', () => {
    for (const tool of availableTools.tools) {
      const schema = tool.inputSchema;
      
      // All schemas should be objects at the top level
      expect(schema.type).toBe('object');
      
      // Should have properties defined (even if empty)
      expect(schema.properties).toBeDefined();
      
      // Should have required array (or no properties if it's an empty schema)
      const hasProperties = schema.properties && Object.keys(schema.properties).length > 0;
      if (hasProperties) {
        expect(Array.isArray(schema.required)).toBe(true);
      }
    }
  });

  it('should validate specific known tool schemas', () => {
    const toolSchemas = new Map();
    for (const tool of availableTools.tools) {
      toolSchemas.set(tool.name, tool.inputSchema);
    }

    // Validate list-events specifically (this was the problematic one)
    const listEventsSchema = toolSchemas.get('list-events');
    expect(listEventsSchema).toBeDefined();
    expect(listEventsSchema.type).toBe('object');
    expect(listEventsSchema.properties.calendarId).toBeDefined();
    expect(listEventsSchema.properties.calendarId.type).toBe('string');
    expect(listEventsSchema.properties.timeMin).toBeDefined();
    expect(listEventsSchema.properties.timeMax).toBeDefined();

    // Ensure calendarId doesn't use anyOf/oneOf/allOf
    const calendarIdStr = JSON.stringify(listEventsSchema.properties.calendarId);
    expect(calendarIdStr).not.toContain('anyOf');
    expect(calendarIdStr).not.toContain('oneOf');
    expect(calendarIdStr).not.toContain('allOf');
  });

  it('should test OpenAI schema conversion compatibility', () => {
    // This mimics the exact conversion logic that would be used by OpenAI integrations
    const convertMCPSchemaToOpenAI = (mcpSchema: any) => {
      if (!mcpSchema) {
        return {
          type: 'object',
          properties: {},
          required: []
        };
      }
      
      return {
        type: 'object',
        properties: mcpSchema.properties || {},
        required: mcpSchema.required || []
      };
    };

    const validateOpenAISchema = (schema: any, toolName: string) => {
      if (schema.type !== 'object') {
        throw new Error(`${toolName}: Schema must have type 'object' at top level, got '${schema.type}'`);
      }
      
      const schemaStr = JSON.stringify(schema);
      const problematicFeatures = ['oneOf', 'anyOf', 'allOf', 'not'];
      
      for (const feature of problematicFeatures) {
        if (schemaStr.includes(`"${feature}"`)) {
          throw new Error(`${toolName}: Schema cannot contain '${feature}' at top level`);
        }
      }
    };

    // Test conversion for all tools
    for (const tool of availableTools.tools) {
      const openaiSchema = convertMCPSchemaToOpenAI(tool.inputSchema);
      expect(() => validateOpenAISchema(openaiSchema, tool.name)).not.toThrow();
    }
  });

  it('should test that all datetime fields have proper format', () => {
    const dateTimeFields = ['start', 'end', 'timeMin', 'timeMax', 'originalStartTime', 'futureStartDate'];
    
    for (const tool of availableTools.tools) {
      const properties = tool.inputSchema.properties || {};
      
      for (const fieldName of Object.keys(properties)) {
        if (dateTimeFields.includes(fieldName)) {
          const field = properties[fieldName];
          
          // DateTime fields should be strings with proper format
          expect(field.type).toBe('string');
          expect(field.format).toBe('date-time');
          expect(field.pattern).toBeDefined();
          expect(field.description).toContain('timezone');
        }
      }
    }
  });

  it('should ensure enum fields are properly structured', () => {
    for (const tool of availableTools.tools) {
      const properties = tool.inputSchema.properties || {};
      
      for (const [, field] of Object.entries(properties)) {
        if (field && typeof field === 'object' && 'enum' in field) {
          // Enum fields should have proper type
          const fieldWithType = field as any;
          expect(fieldWithType.type).toBeDefined();
          expect(Array.isArray(fieldWithType.enum)).toBe(true);
          expect(fieldWithType.enum.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('should validate array fields have proper items definition', () => {
    for (const tool of availableTools.tools) {
      const properties = tool.inputSchema.properties || {};
      
      for (const [, field] of Object.entries(properties)) {
        if (field && typeof field === 'object') {
          const fieldWithType = field as any;
          if (fieldWithType.type === 'array') {
            // Array fields should have items defined
            expect(fieldWithType.items).toBeDefined();
            
            // If items is an object, it should have a type
            if (typeof fieldWithType.items === 'object') {
              expect(fieldWithType.items.type).toBeDefined();
            }
          }
        }
      }
    }
  });
});

/**
 * JSON Schema Validation Rules
 * 
 * This test documents the rules that our schemas must follow
 * to be compatible with various MCP clients.
 */
describe('Schema Validation Rules Documentation', () => {
  it('should document MCP client compatibility requirements', () => {
    const rules = {
      'Top-level schema must be object': 'type: "object" required at root',
      'No oneOf/anyOf/allOf at top level': 'These cause compatibility issues with OpenAI',
      'DateTime fields must have timezone': 'RFC3339 format with timezone required',
      'Array fields must have items defined': 'Proper validation requires items schema',
      'Enum fields must have type': 'Type information required alongside enum values'
    };

    // This test documents the rules - it always passes but serves as documentation
    expect(Object.keys(rules).length).toBeGreaterThan(0);
  });
});
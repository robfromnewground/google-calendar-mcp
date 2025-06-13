#!/usr/bin/env node

/**
 * Schema Validation Script
 * 
 * This script validates that all MCP tool schemas are compatible
 * with various MCP clients. It's designed to be run in CI/CD
 * to catch schema compatibility issues early.
 * 
 * Usage: npm run validate-schemas
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const PROBLEMATIC_FEATURES = ['oneOf', 'anyOf', 'allOf', 'not'];
const DATETIME_FIELDS = ['start', 'end', 'timeMin', 'timeMax', 'originalStartTime', 'futureStartDate'];

async function validateSchemas() {
  console.log('🔍 Validating MCP tool schemas...\n');
  
  let mcpClient;
  let transport;
  let exitCode = 0;
  
  try {
    // 1. Connect to MCP server
    console.log('1. Connecting to MCP server...');
    mcpClient = new Client({
      name: "schema-validator",
      version: "1.0.0"
    }, {
      capabilities: { tools: {} }
    });

    transport = new StdioClientTransport({
      command: 'node',
      args: ['build/index.js'],
      env: process.env
    });
    
    await mcpClient.connect(transport);
    console.log('✅ Connected to MCP server\n');

    // 2. Get tool schemas
    console.log('2. Fetching tool schemas...');
    const availableTools = await mcpClient.listTools();
    console.log(`✅ Found ${availableTools.tools.length} tools\n`);

    // 3. Validate each tool schema
    console.log('3. Validating tool schemas...');
    const issues = [];
    
    for (const tool of availableTools.tools) {
      console.log(`   Validating: ${tool.name}`);
      
      try {
        validateToolSchema(tool);
        console.log(`   ✅ ${tool.name} - Schema valid`);
      } catch (error) {
        console.log(`   ❌ ${tool.name} - ERROR: ${error.message}`);
        issues.push(`${tool.name}: ${error.message}`);
      }
    }

    // 4. Report results
    console.log('\n4. Validation Results:');
    
    if (issues.length === 0) {
      console.log('✅ All schemas are valid and compatible!');
    } else {
      console.log(`❌ Found ${issues.length} schema validation issues:\n`);
      issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
      exitCode = 1;
    }

    // 5. Test OpenAI compatibility
    console.log('\n5. Testing OpenAI compatibility...');
    testOpenAICompatibility(availableTools.tools);
    console.log('✅ OpenAI compatibility test passed');

  } catch (error) {
    console.error('\n❌ Validation failed:', error.message);
    console.error('Stack trace:', error.stack);
    console.error('Full error object:', error);
    exitCode = 1;
  } finally {
    if (mcpClient) {
      await mcpClient.close();
    }
  }

  process.exit(exitCode);
}

function validateToolSchema(tool) {
  const schema = tool.inputSchema;
  
  // Rule 1: Top-level schema must be object
  if (schema.type !== 'object') {
    throw new Error(`Schema must have type 'object' at top level, got '${schema.type}'`);
  }
  
  // Rule 2: No problematic features at top level
  const schemaStr = JSON.stringify(schema);
  for (const feature of PROBLEMATIC_FEATURES) {
    if (schemaStr.includes(`"${feature}"`)) {
      throw new Error(`Schema cannot contain '${feature}' at top level`);
    }
  }
  
  // Rule 3: Must have properties defined
  if (!schema.properties) {
    throw new Error('Schema must have properties defined');
  }
  
  // Rule 4: Must have required array (or empty object with no properties)
  if (!Array.isArray(schema.required)) {
    // Allow tools with no properties to not have a required array
    const hasProperties = schema.properties && Object.keys(schema.properties).length > 0;
    if (hasProperties) {
      throw new Error('Schema must have required array defined');
    }
  }
  
  // Rule 5: Validate datetime fields
  for (const [fieldName, field] of Object.entries(schema.properties)) {
    if (DATETIME_FIELDS.includes(fieldName)) {
      validateDateTimeField(fieldName, field);
    }
    
    // Rule 6: Validate array fields
    if (field.type === 'array' && !field.items) {
      throw new Error(`Array field '${fieldName}' must have items defined`);
    }
    
    // Rule 7: Validate enum fields
    if (field.enum && !field.type) {
      throw new Error(`Enum field '${fieldName}' must have type defined`);
    }
  }
}

function validateDateTimeField(fieldName, field) {
  if (field.type !== 'string') {
    throw new Error(`DateTime field '${fieldName}' must have type 'string'`);
  }
  
  if (field.format !== 'date-time') {
    throw new Error(`DateTime field '${fieldName}' must have format 'date-time'`);
  }
  
  if (!field.pattern) {
    throw new Error(`DateTime field '${fieldName}' must have pattern defined`);
  }
  
  if (!field.description || !field.description.includes('timezone')) {
    throw new Error(`DateTime field '${fieldName}' description must mention timezone requirement`);
  }
}

function testOpenAICompatibility(tools) {
  // Simulate the exact conversion logic used by OpenAI integrations
  for (const tool of tools) {
    const openaiTool = {
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: convertMCPSchemaToOpenAI(tool.inputSchema)
      }
    };
    
    validateOpenAISchema(openaiTool.function.parameters, tool.name);
  }
}

function convertMCPSchemaToOpenAI(mcpSchema) {
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
}

function validateOpenAISchema(schema, toolName) {
  if (schema.type !== 'object') {
    throw new Error(`OpenAI compatibility: ${toolName} schema must have type 'object' at top level`);
  }
  
  const schemaStr = JSON.stringify(schema);
  for (const feature of PROBLEMATIC_FEATURES) {
    if (schemaStr.includes(`"${feature}"`)) {
      throw new Error(`OpenAI compatibility: ${toolName} schema cannot contain '${feature}' at top level`);
    }
  }
}

// Run the validation
validateSchemas().catch(console.error);
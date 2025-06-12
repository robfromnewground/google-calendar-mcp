# Development Scripts Guide

This document explains the clean script organization used in this project.

## Package.json Scripts (Clean & Simple)

The `package.json` contains only essential, user-facing scripts:

```json
{
  "scripts": {
    "start": "node build/index.js",        // Start the MCP server
    "build": "node scripts/build.js",      // Build the project
    "auth": "node build/auth-server.js",   // Quick authentication
    "dev": "node scripts/dev.js",          // Development helper
    "postinstall": "npm run build",        // Auto-build on install
    "test": "vitest run",                   // Run all tests
    "test:watch": "vitest"                  // Watch mode for tests
  }
}
```

## Advanced Scripts via `npm run dev`

All advanced development commands are organized through the dev script:

### Schema Validation
```bash
npm run dev validate-schemas    # Validate MCP tool schemas
npm run dev test:schemas        # Run schema validation tests
```

### Testing
```bash
npm run dev test                     # Unit tests only
npm run dev test:integration         # Core integration tests
npm run dev test:integration:claude  # Claude integration tests
npm run dev test:integration:openai  # OpenAI integration tests
npm run dev test:integration:all     # All integration tests
npm run dev test:watch:all          # Watch mode for all tests
npm run dev coverage                 # Generate coverage report
```

### HTTP Transport
```bash
npm run dev http              # Start HTTP server on localhost:3000
npm run dev http:public       # Start HTTP server accessible from any host
```

### Authentication Management
```bash
npm run dev auth                    # Authenticate normal account
npm run dev auth:test               # Authenticate test account
npm run dev account:status          # Check account status
npm run dev account:clear:normal    # Clear normal account tokens
npm run dev account:clear:test      # Clear test account tokens
```

## Benefits of This Approach

### 1. **Clean package.json**
- New developers see only essential commands
- No clutter with specialized development scripts
- Easier to understand the project structure

### 2. **Organized Development Tools**
- All advanced commands are categorized
- Consistent command structure
- Self-documenting help system

### 3. **Automatic Build Management**
- Commands that need building automatically trigger builds
- No need to remember to build first
- Optimized for developer experience

### 4. **Help System**
```bash
npm run dev                   # Shows all available commands with descriptions
npm run dev help              # Same as above
```

## CI/CD Integration

The GitHub Actions workflows use the dev commands:

```yaml
- name: Run schema validation
  run: npm run dev validate-schemas

- name: Run unit tests  
  run: npm run dev test

- name: Run coverage
  run: npm run dev coverage
```

## Adding New Scripts

To add new development scripts:

1. **Edit `scripts/dev.js`**
2. **Add to the `commands` object**
3. **Update the appropriate category in `showHelp()`**
4. **Test with `npm run dev <command>`**

Example:
```javascript
// In scripts/dev.js
'my-new-command': {
  description: 'Description of what this does',
  cmd: 'node',
  args: ['path/to/script.js'],
  env: { CUSTOM_ENV: 'value' },     // Optional
  preBuild: true                    // Optional: auto-build first
}
```

## Maintenance

This approach keeps the development environment:
- **Scalable**: Easy to add new commands
- **Discoverable**: Help system shows all options
- **Maintainable**: Centralized command management
- **User-friendly**: Clean package.json for new developers

The dev script handles:
- Command execution
- Environment setup
- Build management
- Error handling
- Help documentation
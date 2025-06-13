In-Depth Review: Simplifying the Google Calendar MCP App Structure

  Based on my comprehensive analysis of the streamable-http-support branch, here's my
  assessment of the current complexity and recommendations for better structure:

  Current Complexity Analysis

  Package.json Scripts (19 total)

  The current scripts can be categorized as:

  Core Scripts (4) - Essential for basic use:
  - build, start, typecheck, postinstall

  HTTP Transport Scripts (2) - New complexity:
  - start:http, start:http:public

  Authentication Scripts (5) - Multi-account complexity:
  - auth, auth:test, account:status, account:clear:normal, account:clear:test

  Testing Scripts (8) - Extensive testing infrastructure:
  - test, test:all, test:watch, test:watch:all, test:integration:direct,
  test:integration:claude-mcp, test:integration:all, coverage

  Added Complexity Summary

  1. HTTP Transport: ~500 lines of code, Docker configs, examples
  2. Multi-Account OAuth: Complex account management system
  3. Integration Testing: Sophisticated AI + MCP testing infrastructure
  4. Documentation: Extensive README covering all features

  Restructuring Recommendations

  1. Tiered Documentation Structure

  Main README.md - Keep simple and focused:
  # Google Calendar MCP Server

  Simple Google Calendar integration for Model Context Protocol.

  ## Quick Start
  1. `npm install`
  2. Set up OAuth credentials (see [Authentication Guide](docs/authentication.md))
  3. `npm run auth && npm start`

  ## Basic Usage
  - `npm start` - Local MCP server
  - `npm run auth` - Authenticate with Google
  - `npm test` - Run tests

  ## Advanced Features
  - [HTTP Transport & Remote Deployment](docs/http-transport.md)
  - [Integration Testing Guide](docs/testing.md)
  - [Multi-Account Setup](docs/multi-account.md)
  - [Development & Contributing](docs/development.md)

  Separate Documentation Files:
  - docs/authentication.md - OAuth setup details
  - docs/http-transport.md - HTTP mode, Docker, deployment
  - docs/testing.md - Integration testing infrastructure
  - docs/multi-account.md - Test account management
  - docs/development.md - Contributing guidelines

  2. Simplified Package.json Scripts

  Core Scripts (keep visible):
  {
    "scripts": {
      "build": "npm run typecheck && node scripts/build.js",
      "start": "node build/index.js",
      "auth": "node build/auth-server.js",
      "test": "vitest run --exclude '**/integration/**'"
    }
  }

  Advanced Scripts (move to scripts/ directory):
  - Create scripts/http.js for HTTP transport commands
  - Create scripts/account.js for multi-account management
  - Create scripts/test-integration.js for integration testing
  - Update package.json to reference these scripts

  3. Feature-Based Directory Structure

  src/
  ├── core/                    # Core MCP functionality
  │   ├── handlers/           # Tool handlers
  │   ├── schemas/           # Validation schemas
  │   └── auth/              # Authentication
  ├── transports/             # Transport implementations
  │   ├── stdio.ts           # Default transport
  │   └── http/              # HTTP transport (optional)
  │       ├── server.ts
  │       ├── security.ts
  │       └── config.ts
  ├── testing/               # Testing infrastructure (optional)
  │   ├── integration/       # Integration tests
  │   ├── factories/         # Test data factories
  │   └── utils/            # Testing utilities
  └── examples/              # Usage examples (optional)
      ├── basic/
      ├── http/
      └── docker/

  4. Optional Feature Installation

  Core Installation (default):
  npm install google-calendar-mcp
  # Includes: stdio transport, basic auth, unit tests

  With HTTP Transport:
  npm install google-calendar-mcp[http]
  # Or use environment flag: INSTALL_HTTP_TRANSPORT=true npm install

  With Development Tools:
  npm install google-calendar-mcp --dev
  # Includes: integration tests, multi-account, examples

  5. Configuration-Driven Features

  Environment-Based Feature Toggle:
  # .env file
  ENABLE_HTTP_TRANSPORT=false     # Default: false
  ENABLE_MULTI_ACCOUNT=false      # Default: false  
  ENABLE_INTEGRATION_TESTS=false  # Default: false

  Conditional Script Loading:
  // package.json generation based on features
  if (process.env.ENABLE_HTTP_TRANSPORT) {
    scripts["start:http"] = "node build/index.js --transport http";
  }

  6. Beginner vs. Contributor Modes

  Beginner Mode (default):
  - Simple README with quick start
  - Basic scripts only
  - Core functionality
  - Minimal dependencies

  Contributor Mode (opt-in):
  npm run setup:contributor
  # Installs dev dependencies, sets up test accounts, 
  # shows advanced documentation, enables all scripts

  7. Improved Script Organization

  Keep in package.json (essential):
  {
    "scripts": {
      "start": "node build/index.js",
      "build": "npm run typecheck && node scripts/build.js",
      "auth": "node build/auth-server.js",
      "test": "vitest run --exclude '**/integration/**'",
      "dev": "node scripts/dev-helper.js"
    }
  }

  Move to dedicated scripts (advanced):
  - npm run dev http → Start HTTP server
  - npm run dev account status → Check account status
  - npm run dev test integration → Run integration tests

  8. Modular Architecture Benefits

  For Basic Users:
  - Clean, simple setup
  - Minimal cognitive load
  - Fast installation
  - Clear documentation path

  For Contributors:
  - Full feature access when needed
  - Comprehensive testing tools
  - Advanced deployment options
  - Rich development environment

  Implementation Priority

  1. High Priority: Simplify main README, move advanced docs
  2. Medium Priority: Reorganize package.json scripts
  3. Low Priority: Modular installation, feature toggles

  This approach maintains the sophisticated functionality you've built while dramatically
  improving the first-time user experience and reducing apparent complexity for those who
  just want basic Google Calendar integration.
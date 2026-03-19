#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { ObsidianClient } from "./obsidian-client.js";
import { registerFileTools } from "./tools/files.js";
import { registerSearchTools } from "./tools/search.js";
import { registerPeriodicTools } from "./tools/periodic.js";
import { registerCommandTools } from "./tools/commands.js";
import { registerSmartSearchTools } from "./tools/smart-search.js";
import { SmartSearchEngine } from "./smart-connections/search-engine.js";

// Disable SSL verification for self-signed certs if configured
if (process.env.OBSIDIAN_VERIFY_SSL === "false") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const config = loadConfig();
const client = new ObsidianClient(config);

const server = new McpServer({
  name: "obsidian-mcp",
  version: "1.0.0",
});

registerFileTools(server, client);
registerSearchTools(server, client);
registerPeriodicTools(server, client);
registerCommandTools(server, client);

// Smart Connections semantic search (optional — requires Smart Connections plugin)
const smartEnvPath = process.env.OBSIDIAN_SMART_ENV_PATH;
if (smartEnvPath) {
  const engine = new SmartSearchEngine(smartEnvPath);
  registerSmartSearchTools(server, engine);
}

const transport = new StdioServerTransport();
await server.connect(transport);

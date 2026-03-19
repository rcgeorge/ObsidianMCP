import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ObsidianClient } from "../obsidian-client.js";

export function registerSearchTools(server: McpServer, client: ObsidianClient) {
  server.tool(
    "search_vault",
    "Search for notes in the vault using full-text fuzzy search. Returns matching filenames and context.",
    {
      query: z.string().describe("Search query string"),
      limit: z.number().optional().describe("Max number of results to return (default: all)"),
    },
    async ({ query, limit }) => {
      let results = await client.searchSimple(query);
      if (limit) results = results.slice(0, limit);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }
  );

  server.tool(
    "search_dataview",
    "Run a Dataview DQL query against the vault. Requires the Dataview plugin to be installed in Obsidian. Example: 'TABLE file.mtime AS \"Modified\" FROM \"Notes\" SORT file.mtime DESC'",
    { dql: z.string().describe("Dataview Query Language (DQL) query string") },
    async ({ dql }) => {
      const results = await client.searchDataview(dql);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }
  );

  server.tool(
    "search_jsonlogic",
    "Run a JsonLogic query against the vault for structured/programmatic searches. Useful for filtering notes by metadata fields.",
    { query: z.string().describe("JsonLogic query as a JSON string") },
    async ({ query }) => {
      const parsed = JSON.parse(query);
      const results = await client.searchJsonLogic(parsed);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }
  );
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SmartSearchEngine } from "../smart-connections/search-engine.js";

export function registerSmartSearchTools(
  server: McpServer,
  engine: SmartSearchEngine
) {
  server.tool(
    "semantic_search",
    "Search the vault using AI semantic similarity. Finds conceptually related notes even when wording differs. Requires the Smart Connections plugin to be installed and to have indexed the vault.",
    {
      query: z
        .string()
        .describe("Natural language search query"),
      limit: z
        .number()
        .optional()
        .describe("Max results to return (default 20)"),
      minSimilarity: z
        .number()
        .optional()
        .describe(
          "Minimum similarity threshold 0-1 (default 0.3)"
        ),
      blocksOnly: z
        .boolean()
        .optional()
        .describe(
          "Only return block-level matches for more granular results"
        ),
      sourcesOnly: z
        .boolean()
        .optional()
        .describe("Only return file-level matches"),
    },
    async ({ query, limit, minSimilarity, blocksOnly, sourcesOnly }) => {
      const results = await engine.semanticSearch(query, {
        limit,
        minSimilarity,
        blocksOnly,
        sourcesOnly,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }
  );

  server.tool(
    "find_related_notes",
    "Find notes semantically related to a given note. Uses pre-computed embeddings from Smart Connections — no model inference needed.",
    {
      notePath: z
        .string()
        .describe(
          "Path to the note in the vault (e.g. 'Notes/my-note.md')"
        ),
      limit: z
        .number()
        .optional()
        .describe("Max results to return (default 20)"),
      minSimilarity: z
        .number()
        .optional()
        .describe("Minimum similarity threshold 0-1 (default 0.3)"),
      includeBlocks: z
        .boolean()
        .optional()
        .describe(
          "Include block-level matches in addition to file-level (default false)"
        ),
    },
    async ({ notePath, limit, minSimilarity, includeBlocks }) => {
      const results = await engine.findRelated(notePath, {
        limit,
        minSimilarity,
        includeBlocks,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }
  );

  server.tool(
    "smart_connections_status",
    "Get statistics about the Smart Connections index: number of indexed sources, blocks, embedding model, and dimensions.",
    {},
    async () => {
      await engine.ensureLoaded();
      const stats = engine.getStats();
      return {
        content: [{ type: "text", text: JSON.stringify(stats, null, 2) }],
      };
    }
  );
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ObsidianClient } from "../obsidian-client.js";

const periodSchema = z
  .enum(["daily", "weekly", "monthly", "quarterly", "yearly"])
  .describe("The period type for the note");

export function registerPeriodicTools(server: McpServer, client: ObsidianClient) {
  server.tool(
    "get_periodic_note",
    "Get the content of a periodic note (daily, weekly, monthly, quarterly, or yearly).",
    { period: periodSchema },
    async ({ period }) => {
      const content = await client.getPeriodicNote(period);
      return { content: [{ type: "text", text: content }] };
    }
  );

  server.tool(
    "create_periodic_note",
    "Create or overwrite a periodic note (daily, weekly, monthly, quarterly, or yearly).",
    {
      period: periodSchema,
      content: z.string().describe("Markdown content for the periodic note"),
    },
    async ({ period, content }) => {
      await client.createOrUpdatePeriodicNote(period, content);
      return {
        content: [{ type: "text", text: `${period} note created/updated` }],
      };
    }
  );

  server.tool(
    "append_to_periodic_note",
    "Append content to a periodic note (e.g. add an entry to today's daily note).",
    {
      period: periodSchema,
      content: z.string().describe("Markdown content to append"),
    },
    async ({ period, content }) => {
      await client.appendToPeriodicNote(period, content);
      return {
        content: [{ type: "text", text: `Content appended to ${period} note` }],
      };
    }
  );
}

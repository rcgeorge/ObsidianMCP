import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ObsidianClient } from "../obsidian-client.js";

export function registerCommandTools(server: McpServer, client: ObsidianClient) {
  server.tool(
    "list_commands",
    "List all available Obsidian commands that can be executed.",
    {},
    async () => {
      const result = await client.listCommands();
      return {
        content: [{ type: "text", text: JSON.stringify(result.commands, null, 2) }],
      };
    }
  );

  server.tool(
    "execute_command",
    "Execute an Obsidian command by its ID. Use list_commands to find available command IDs.",
    { commandId: z.string().describe("The command ID to execute (e.g. 'editor:toggle-bold')") },
    async ({ commandId }) => {
      await client.executeCommand(commandId);
      return {
        content: [{ type: "text", text: `Command executed: ${commandId}` }],
      };
    }
  );
}

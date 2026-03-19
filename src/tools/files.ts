import { readFile } from "node:fs/promises";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ObsidianClient } from "../obsidian-client.js";

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

export function registerFileTools(server: McpServer, client: ObsidianClient) {
  server.tool(
    "list_vault_files",
    "List files and directories in the Obsidian vault. Provide a folder path to list its contents, or omit to list the root.",
    { path: z.string().optional().describe("Folder path within the vault (e.g. 'Notes/Projects'). Omit for root.") },
    async ({ path }) => {
      const result = await client.listFiles(path ?? "/");
      return {
        content: [{ type: "text", text: JSON.stringify(result.files, null, 2) }],
      };
    }
  );

  server.tool(
    "read_note",
    "Read the markdown content of a note in the vault.",
    { path: z.string().describe("Path to the note (e.g. 'Notes/my-note.md')") },
    async ({ path }) => {
      const content = await client.readNote(path);
      return { content: [{ type: "text", text: content }] };
    }
  );

  server.tool(
    "create_note",
    "Create a new note or overwrite an existing one in the vault. Embed attachments using ![[filename.png]] syntax.",
    {
      path: z.string().describe("Path for the note (e.g. 'Notes/new-note.md')"),
      content: z.string().describe("Markdown content for the note. Use ![[filename.png]] to embed attachments."),
    },
    async ({ path, content }) => {
      await client.createOrUpdateNote(path, content);
      return { content: [{ type: "text", text: `Note created/updated: ${path}` }] };
    }
  );

  server.tool(
    "append_to_note",
    "Append content to the end of an existing note. Use ![[filename.png]] to embed attachments.",
    {
      path: z.string().describe("Path to the note"),
      content: z.string().describe("Markdown content to append. Use ![[filename.png]] to embed attachments."),
    },
    async ({ path, content }) => {
      await client.appendToNote(path, content);
      return { content: [{ type: "text", text: `Content appended to: ${path}` }] };
    }
  );

  server.tool(
    "patch_note",
    "Insert or replace content relative to a heading in a note. Useful for updating specific sections.",
    {
      path: z.string().describe("Path to the note"),
      content: z.string().describe("Markdown content to insert"),
      heading: z.string().optional().describe("Target heading to insert content under"),
      headingBoundary: z.string().optional().describe("Heading level that marks the end of the target section (e.g. '##')"),
      insertPosition: z.enum(["beginning", "end"]).optional().describe("Where to insert relative to the heading: 'beginning' or 'end'"),
    },
    async ({ path, content, heading, headingBoundary, insertPosition }) => {
      await client.patchNote(path, content, {
        heading,
        "heading-boundary": headingBoundary,
        "content-insertion-position": insertPosition,
      });
      return { content: [{ type: "text", text: `Note patched: ${path}` }] };
    }
  );

  server.tool(
    "delete_note",
    "Delete a note from the vault.",
    { path: z.string().describe("Path to the note to delete") },
    async ({ path }) => {
      await client.deleteNote(path);
      return { content: [{ type: "text", text: `Note deleted: ${path}` }] };
    }
  );

  server.tool(
    "get_active_note",
    "Read the content of the currently active/open note in Obsidian.",
    {},
    async () => {
      const content = await client.getActiveNote();
      return { content: [{ type: "text", text: content }] };
    }
  );

  server.tool(
    "update_active_note",
    "Overwrite the content of the currently active/open note in Obsidian.",
    { content: z.string().describe("New markdown content for the active note") },
    async ({ content }) => {
      await client.updateActiveNote(content);
      return { content: [{ type: "text", text: "Active note updated" }] };
    }
  );

  server.tool(
    "append_to_active_note",
    "Append content to the currently active/open note in Obsidian.",
    { content: z.string().describe("Markdown content to append") },
    async ({ content }) => {
      await client.appendToActiveNote(content);
      return { content: [{ type: "text", text: "Content appended to active note" }] };
    }
  );

  server.tool(
    "patch_active_note",
    "Insert or replace content relative to a heading in the currently active note.",
    {
      content: z.string().describe("Markdown content to insert"),
      heading: z.string().optional().describe("Target heading to insert content under"),
      headingBoundary: z.string().optional().describe("Heading level that marks the end of the target section"),
      insertPosition: z.enum(["beginning", "end"]).optional().describe("Where to insert: 'beginning' or 'end'"),
    },
    async ({ content, heading, headingBoundary, insertPosition }) => {
      await client.patchActiveNote(content, {
        heading,
        "heading-boundary": headingBoundary,
        "content-insertion-position": insertPosition,
      });
      return { content: [{ type: "text", text: "Active note patched" }] };
    }
  );

  server.tool(
    "delete_active_note",
    "Delete the currently active/open note in Obsidian.",
    {},
    async () => {
      await client.deleteActiveNote();
      return { content: [{ type: "text", text: "Active note deleted" }] };
    }
  );

  server.tool(
    "open_note",
    "Open a note in the Obsidian UI.",
    { path: z.string().describe("Path to the note to open") },
    async ({ path }) => {
      await client.openNote(path);
      return { content: [{ type: "text", text: `Opened: ${path}` }] };
    }
  );

  server.tool(
    "get_server_status",
    "Check the status of the Obsidian Local REST API server and get version info.",
    {},
    async () => {
      const status = await client.getStatus();
      return { content: [{ type: "text", text: JSON.stringify(status, null, 2) }] };
    }
  );

  server.tool(
    "upload_attachment",
    "Upload an attachment (image, PDF, audio, video) to the vault from a local file path. After uploading, embed it in a note using ![[filename]] syntax.",
    {
      localPath: z.string().describe("Absolute path to the file on your local filesystem (e.g. '/Users/me/photo.png')"),
      vaultPath: z.string().describe("Destination path in the vault (e.g. 'attachments/photo.png')"),
    },
    async ({ localPath, vaultPath }) => {
      const data = await readFile(localPath);
      const ext = localPath.substring(localPath.lastIndexOf(".")).toLowerCase();
      const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";
      await client.uploadAttachment(vaultPath, data, contentType);
      const filename = vaultPath.split("/").pop() ?? vaultPath;
      return {
        content: [{
          type: "text",
          text: `Attachment uploaded to: ${vaultPath}\nEmbed in a note with: ![[${filename}]]`,
        }],
      };
    }
  );
}

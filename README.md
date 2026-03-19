# ObsidianMCP

An MCP (Model Context Protocol) server that connects Claude to your Obsidian vault via the [Obsidian Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api) plugin.

## Prerequisites

1. [Obsidian](https://obsidian.md/) with the **Local REST API** community plugin installed and enabled
2. An API key from the plugin settings (Settings → Local REST API → API Key)
3. Node.js 18+

## Setup

```bash
npm install
npm run build
```

## Configuration

Set the following environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OBSIDIAN_API_KEY` | Yes | — | API key from the Local REST API plugin |
| `OBSIDIAN_HOST` | No | `127.0.0.1` | Host where Obsidian is running |
| `OBSIDIAN_PORT` | No | `27124` | Port for the REST API |
| `OBSIDIAN_PROTOCOL` | No | `https` | `http` or `https` |
| `OBSIDIAN_VERIFY_SSL` | No | `true` | Set to `false` for self-signed certs |
| `OBSIDIAN_SMART_ENV_PATH` | No | — | Path to `.smart-env/` folder for semantic search (requires Smart Connections plugin) |

## Usage with Claude Code

Add to your Claude Code MCP settings (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "node",
      "args": ["/path/to/ObsidianMCP/dist/index.js"],
      "env": {
        "OBSIDIAN_API_KEY": "your-api-key-here",
        "OBSIDIAN_VERIFY_SSL": "false",
        "OBSIDIAN_SMART_ENV_PATH": "/path/to/your/vault/.smart-env"
      }
    }
  }
}
```

## Usage with Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "node",
      "args": ["/path/to/ObsidianMCP/dist/index.js"],
      "env": {
        "OBSIDIAN_API_KEY": "your-api-key-here",
        "OBSIDIAN_VERIFY_SSL": "false",
        "OBSIDIAN_SMART_ENV_PATH": "/path/to/your/vault/.smart-env"
      }
    }
  }
}
```

## Available Tools

### File Operations
- **list_vault_files** — List files/folders in the vault
- **read_note** — Read a note's content
- **create_note** — Create or overwrite a note
- **append_to_note** — Append content to a note
- **patch_note** — Insert/replace content under a specific heading
- **delete_note** — Delete a note
- **open_note** — Open a note in the Obsidian UI
- **upload_attachment** — Upload an image/PDF/audio/video file to the vault, then embed with `![[filename]]`

### Active Note
- **get_active_note** — Read the currently open note
- **update_active_note** — Overwrite the currently open note
- **append_to_active_note** — Append content to the currently open note
- **patch_active_note** — Insert/replace content under a heading in the active note
- **delete_active_note** — Delete the currently open note

### Search
- **search_vault** — Full-text fuzzy search across the vault
- **search_dataview** — Run a Dataview DQL query (requires Dataview plugin)
- **search_jsonlogic** — Run a JsonLogic structured query

### Periodic Notes
- **get_periodic_note** — Read a daily/weekly/monthly/quarterly/yearly note
- **create_periodic_note** — Create or overwrite a periodic note
- **append_to_periodic_note** — Append to a periodic note

### Commands
- **list_commands** — List available Obsidian commands
- **execute_command** — Execute an Obsidian command by ID

### Semantic Search (Smart Connections)
- **semantic_search** — AI-powered semantic search across the vault (finds conceptually related content)
- **find_related_notes** — Find notes semantically related to a given note
- **smart_connections_status** — Index stats: sources, blocks, model, dimensions

> Requires the [Smart Connections](https://github.com/brianpetro/obsidian-smart-connections) plugin and `OBSIDIAN_SMART_ENV_PATH` env var. The first `semantic_search` call downloads the embedding model (~30MB, cached afterwards).

### Server
- **get_server_status** — Check REST API status and version info

import { ObsidianConfig } from "./config.js";

export class ObsidianClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(private config: ObsidianConfig) {
    this.baseUrl = `${config.protocol}://${config.host}:${config.port}`;
    this.headers = {
      Authorization: `Bearer ${config.apiKey}`,
    };
  }

  private async request(
    path: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
      // SSL verification is handled via NODE_TLS_REJECT_UNAUTHORIZED env var
    });
    return response;
  }

  // --- Server Status ---

  async getStatus(): Promise<unknown> {
    const resp = await this.request("/", {
      headers: { Accept: "application/json" },
    });
    if (!resp.ok) throw new Error(`Failed to get status: ${resp.status} ${await resp.text()}`);
    return resp.json();
  }

  // --- Vault File Operations ---

  async listFiles(path: string = "/"): Promise<{ files: string[] }> {
    const resp = await this.request(
      `/vault/${encodeURIPath(path.replace(/^\//, ""))}`,
      {
        headers: { Accept: "application/json" },
      }
    );
    if (!resp.ok) throw new Error(`Failed to list files: ${resp.status} ${await resp.text()}`);
    return resp.json() as Promise<{ files: string[] }>;
  }

  async readNote(path: string): Promise<string> {
    const resp = await this.request(
      `/vault/${encodeURIPath(path)}`,
      {
        headers: { Accept: "text/markdown" },
      }
    );
    if (!resp.ok) throw new Error(`Failed to read note: ${resp.status} ${await resp.text()}`);
    return resp.text();
  }

  async createOrUpdateNote(path: string, content: string): Promise<void> {
    const resp = await this.request(
      `/vault/${encodeURIPath(path)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "text/markdown" },
        body: content,
      }
    );
    if (!resp.ok) throw new Error(`Failed to create/update note: ${resp.status} ${await resp.text()}`);
  }

  async appendToNote(path: string, content: string): Promise<void> {
    const resp = await this.request(
      `/vault/${encodeURIPath(path)}`,
      {
        method: "POST",
        headers: { "Content-Type": "text/markdown" },
        body: content,
      }
    );
    if (!resp.ok) throw new Error(`Failed to append to note: ${resp.status} ${await resp.text()}`);
  }

  async patchNote(
    path: string,
    content: string,
    options: {
      heading?: string;
      "heading-boundary"?: string;
      "content-insertion-position"?: "beginning" | "end";
    } = {}
  ): Promise<void> {
    const headers: Record<string, string> = {
      "Content-Type": "text/markdown",
    };
    if (options.heading) headers["Heading"] = options.heading;
    if (options["heading-boundary"])
      headers["Heading-Boundary"] = options["heading-boundary"];
    if (options["content-insertion-position"])
      headers["Content-Insertion-Position"] =
        options["content-insertion-position"];

    const resp = await this.request(
      `/vault/${encodeURIPath(path)}`,
      {
        method: "PATCH",
        headers,
        body: content,
      }
    );
    if (!resp.ok) throw new Error(`Failed to patch note: ${resp.status} ${await resp.text()}`);
  }

  async uploadAttachment(
    path: string,
    data: Uint8Array,
    contentType: string
  ): Promise<void> {
    const resp = await this.request(
      `/vault/${encodeURIPath(path)}`,
      {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: data as unknown as BodyInit,
      }
    );
    if (!resp.ok) throw new Error(`Failed to upload attachment: ${resp.status} ${await resp.text()}`);
  }

  async deleteNote(path: string): Promise<void> {
    const resp = await this.request(
      `/vault/${encodeURIPath(path)}`,
      { method: "DELETE" }
    );
    if (!resp.ok) throw new Error(`Failed to delete note: ${resp.status} ${await resp.text()}`);
  }

  // --- Search ---

  async searchSimple(query: string): Promise<unknown[]> {
    const resp = await this.request(
      `/search/simple/?query=${encodeURIComponent(query)}`,
      {
        method: "POST",
        headers: { Accept: "application/json" },
      }
    );
    if (!resp.ok) throw new Error(`Search failed: ${resp.status} ${await resp.text()}`);
    return resp.json() as Promise<unknown[]>;
  }

  async searchDataview(dql: string): Promise<unknown> {
    const resp = await this.request("/search/", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/vnd.olrapi.dataview.dql+txt",
      },
      body: dql,
    });
    if (!resp.ok) throw new Error(`Dataview search failed: ${resp.status} ${await resp.text()}`);
    return resp.json();
  }

  async searchJsonLogic(query: object): Promise<unknown> {
    const resp = await this.request("/search/", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/vnd.olrapi.jsonlogic+json",
      },
      body: JSON.stringify(query),
    });
    if (!resp.ok) throw new Error(`JsonLogic search failed: ${resp.status} ${await resp.text()}`);
    return resp.json();
  }

  // --- Periodic Notes ---

  async getPeriodicNote(
    period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly"
  ): Promise<string> {
    const resp = await this.request(`/periodic/${period}/`, {
      headers: { Accept: "text/markdown" },
    });
    if (!resp.ok) throw new Error(`Failed to get ${period} note: ${resp.status} ${await resp.text()}`);
    return resp.text();
  }

  async createOrUpdatePeriodicNote(
    period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly",
    content: string
  ): Promise<void> {
    const resp = await this.request(`/periodic/${period}/`, {
      method: "PUT",
      headers: { "Content-Type": "text/markdown" },
      body: content,
    });
    if (!resp.ok) throw new Error(`Failed to create/update ${period} note: ${resp.status} ${await resp.text()}`);
  }

  async appendToPeriodicNote(
    period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly",
    content: string
  ): Promise<void> {
    const resp = await this.request(`/periodic/${period}/`, {
      method: "POST",
      headers: { "Content-Type": "text/markdown" },
      body: content,
    });
    if (!resp.ok) throw new Error(`Failed to append to ${period} note: ${resp.status} ${await resp.text()}`);
  }

  // --- Commands ---

  async listCommands(): Promise<{ commands: Array<{ id: string; name: string }> }> {
    const resp = await this.request("/commands/", {
      headers: { Accept: "application/json" },
    });
    if (!resp.ok) throw new Error(`Failed to list commands: ${resp.status} ${await resp.text()}`);
    return resp.json() as Promise<{ commands: Array<{ id: string; name: string }> }>;
  }

  async executeCommand(commandId: string): Promise<void> {
    const resp = await this.request(
      `/commands/${encodeURIComponent(commandId)}/`,
      { method: "POST" }
    );
    if (!resp.ok) throw new Error(`Failed to execute command: ${resp.status} ${await resp.text()}`);
  }

  // --- Open ---

  async openNote(path: string): Promise<void> {
    const resp = await this.request(
      `/open/${encodeURIPath(path)}`,
      { method: "POST" }
    );
    if (!resp.ok) throw new Error(`Failed to open note: ${resp.status} ${await resp.text()}`);
  }

  // --- Active File ---

  async getActiveNote(): Promise<string> {
    const resp = await this.request("/active/", {
      headers: { Accept: "text/markdown" },
    });
    if (!resp.ok) throw new Error(`Failed to get active note: ${resp.status} ${await resp.text()}`);
    return resp.text();
  }

  async updateActiveNote(content: string): Promise<void> {
    const resp = await this.request("/active/", {
      method: "PUT",
      headers: { "Content-Type": "text/markdown" },
      body: content,
    });
    if (!resp.ok) throw new Error(`Failed to update active note: ${resp.status} ${await resp.text()}`);
  }

  async appendToActiveNote(content: string): Promise<void> {
    const resp = await this.request("/active/", {
      method: "POST",
      headers: { "Content-Type": "text/markdown" },
      body: content,
    });
    if (!resp.ok) throw new Error(`Failed to append to active note: ${resp.status} ${await resp.text()}`);
  }

  async patchActiveNote(
    content: string,
    options: {
      heading?: string;
      "heading-boundary"?: string;
      "content-insertion-position"?: "beginning" | "end";
    } = {}
  ): Promise<void> {
    const headers: Record<string, string> = {
      "Content-Type": "text/markdown",
    };
    if (options.heading) headers["Heading"] = options.heading;
    if (options["heading-boundary"])
      headers["Heading-Boundary"] = options["heading-boundary"];
    if (options["content-insertion-position"])
      headers["Content-Insertion-Position"] =
        options["content-insertion-position"];

    const resp = await this.request("/active/", {
      method: "PATCH",
      headers,
      body: content,
    });
    if (!resp.ok) throw new Error(`Failed to patch active note: ${resp.status} ${await resp.text()}`);
  }

  async deleteActiveNote(): Promise<void> {
    const resp = await this.request("/active/", { method: "DELETE" });
    if (!resp.ok) throw new Error(`Failed to delete active note: ${resp.status} ${await resp.text()}`);
  }
}

function encodeURIPath(path: string): string {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

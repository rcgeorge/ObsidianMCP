export interface ObsidianConfig {
  apiKey: string;
  host: string;
  port: number;
  protocol: "http" | "https";
  verifySsl: boolean;
}

export function loadConfig(): ObsidianConfig {
  const apiKey = process.env.OBSIDIAN_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OBSIDIAN_API_KEY environment variable is required. " +
        "Get it from the Obsidian Local REST API plugin settings."
    );
  }

  return {
    apiKey,
    host: process.env.OBSIDIAN_HOST ?? "127.0.0.1",
    port: parseInt(process.env.OBSIDIAN_PORT ?? "27124", 10),
    protocol: (process.env.OBSIDIAN_PROTOCOL as "http" | "https") ?? "https",
    verifySsl: process.env.OBSIDIAN_VERIFY_SSL !== "false",
  };
}

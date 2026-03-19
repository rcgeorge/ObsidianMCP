import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

export interface EmbeddingEntry {
  key: string;
  path: string;
  vec: number[];
  embedModel: string;
  isBlock: boolean;
  lines?: [number, number];
  size?: number;
}

export async function loadSmartEnv(
  smartEnvPath: string
): Promise<{ entries: EmbeddingEntry[]; model: string | null }> {
  const multiPath = join(smartEnvPath, "multi");
  const entries: EmbeddingEntry[] = [];
  let detectedModel: string | null = null;

  let files: string[];
  try {
    files = (await readdir(multiPath)).filter((f) => f.endsWith(".ajson"));
  } catch {
    return { entries, model: null };
  }

  for (const file of files) {
    const filePath = join(multiPath, file);
    let content: string;
    try {
      content = (await readFile(filePath, "utf-8")).trim();
    } catch {
      continue;
    }

    if (!content) continue;

    try {
      // AJSON: comma-separated key-value pairs without outer braces
      if (content.endsWith(",")) {
        content = content.slice(0, -1);
      }
      content = "{" + content + "}";

      const data = JSON.parse(content) as Record<string, Record<string, unknown>>;

      for (const [key, value] of Object.entries(data)) {
        if (!value) continue;

        const isBlock = key.startsWith("smart_blocks:");
        const isSource = key.startsWith("smart_sources:");
        if (!isBlock && !isSource) continue;

        const actualPath = key.replace(/^(smart_sources|smart_blocks):/, "");

        const embeddings = (value.embeddings ?? {}) as Record<
          string,
          { vec?: number[] }
        >;
        const modelKey = Object.keys(embeddings)[0];

        if (modelKey && embeddings[modelKey]?.vec?.length) {
          if (!detectedModel) detectedModel = modelKey;

          entries.push({
            key,
            path: actualPath,
            vec: embeddings[modelKey].vec!,
            embedModel: modelKey,
            isBlock,
            lines: value.lines as [number, number] | undefined,
            size: value.size as number | undefined,
          });
        }
      }
    } catch {
      // Skip unparseable files
    }
  }

  return { entries, model: detectedModel };
}

import { EmbeddingEntry, loadSmartEnv } from "./ajson-loader.js";
import { embedQuery } from "./embedding-service.js";
import { cosineSimilarity } from "./similarity.js";

export interface SearchResult {
  path: string;
  similarity: number;
  isBlock: boolean;
  lines?: [number, number];
}

export class SmartSearchEngine {
  private entries: EmbeddingEntry[] = [];
  private model: string | null = null;
  private loaded = false;

  constructor(private smartEnvPath: string) {}

  async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    const result = await loadSmartEnv(this.smartEnvPath);
    this.entries = result.entries;
    this.model = result.model;
    this.loaded = true;
  }

  async semanticSearch(
    query: string,
    options: {
      limit?: number;
      minSimilarity?: number;
      blocksOnly?: boolean;
      sourcesOnly?: boolean;
    } = {}
  ): Promise<SearchResult[]> {
    await this.ensureLoaded();

    const {
      limit = 20,
      minSimilarity = 0.3,
      blocksOnly = false,
      sourcesOnly = false,
    } = options;

    if (!this.model || this.entries.length === 0) {
      throw new Error(
        "No Smart Connections data found. Ensure the Smart Connections plugin is installed and has indexed your vault."
      );
    }

    const queryVec = await embedQuery(query, this.model);

    let filtered = this.entries;
    if (blocksOnly) filtered = filtered.filter((e) => e.isBlock);
    if (sourcesOnly) filtered = filtered.filter((e) => !e.isBlock);

    const results: SearchResult[] = [];
    for (const entry of filtered) {
      const similarity = cosineSimilarity(queryVec, entry.vec);
      if (similarity >= minSimilarity) {
        results.push({
          path: entry.path,
          similarity,
          isBlock: entry.isBlock,
          lines: entry.lines,
        });
      }
    }

    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, limit);
  }

  async findRelated(
    notePath: string,
    options: {
      limit?: number;
      minSimilarity?: number;
      includeBlocks?: boolean;
    } = {}
  ): Promise<SearchResult[]> {
    await this.ensureLoaded();

    const { limit = 20, minSimilarity = 0.3, includeBlocks = false } = options;

    // Find the source entry for this note
    const sourceEntry = this.entries.find(
      (e) => !e.isBlock && e.path === notePath
    );
    if (!sourceEntry) {
      throw new Error(`Note not found in Smart Connections index: ${notePath}`);
    }

    const results: SearchResult[] = [];
    for (const entry of this.entries) {
      // Skip the source note itself and its own blocks
      if (entry.path === notePath || entry.path.startsWith(notePath + "#")) {
        continue;
      }
      if (!includeBlocks && entry.isBlock) continue;

      const similarity = cosineSimilarity(sourceEntry.vec, entry.vec);
      if (similarity >= minSimilarity) {
        results.push({
          path: entry.path,
          similarity,
          isBlock: entry.isBlock,
          lines: entry.lines,
        });
      }
    }

    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, limit);
  }

  getStats(): {
    totalSources: number;
    totalBlocks: number;
    model: string | null;
    dimensions: number | null;
  } {
    return {
      totalSources: this.entries.filter((e) => !e.isBlock).length,
      totalBlocks: this.entries.filter((e) => e.isBlock).length,
      model: this.model,
      dimensions: this.entries[0]?.vec.length ?? null,
    };
  }

  reload(): void {
    this.loaded = false;
    this.entries = [];
    this.model = null;
  }
}

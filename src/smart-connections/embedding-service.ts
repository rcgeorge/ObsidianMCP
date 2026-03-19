let pipelineInstance: unknown = null;
let loadedModel: string | null = null;

// Model name mapping: Smart Connections name -> transformers.js name
const MODEL_MAP: Record<string, string> = {
  "TaylorAI/bge-micro-v2": "TaylorAI/bge-micro-v2",
  "TaylorAI/gte-tiny": "TaylorAI/gte-tiny",
  "Snowflake/snowflake-arctic-embed-m": "Xenova/snowflake-arctic-embed-m",
  "Xenova/all-MiniLM-L6-v2": "Xenova/all-MiniLM-L6-v2",
  "jinaai/jina-embeddings-v2-base-zh": "Xenova/jina-embeddings-v2-base-zh",
};

export async function embedQuery(
  text: string,
  modelName: string
): Promise<number[]> {
  if (!pipelineInstance || loadedModel !== modelName) {
    const { pipeline } = await import("@huggingface/transformers");
    const transformersModel = MODEL_MAP[modelName] ?? modelName;
    pipelineInstance = await pipeline(
      "feature-extraction",
      transformersModel,
      // @ts-expect-error quantized option is valid
      { quantized: true }
    );
    loadedModel = modelName;
  }

  const result = await (pipelineInstance as CallableFunction)(text, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(result.data as Float32Array);
}

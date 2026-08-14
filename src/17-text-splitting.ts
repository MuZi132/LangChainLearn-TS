import "dotenv/config";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

async function main(): Promise<void> {
  const doc = new Document({
    pageContent: "第一段：LangChain 负责模型、工具与 Agent。\n\n第二段：RAG 会先检索相关文档，再把上下文交给模型。第三段：中文切分应考虑句号、逗号和换行。".repeat(8),
    metadata: { source: "lesson-17" },
  });
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 180,
    chunkOverlap: 30,
    separators: ["\n\n", "\n", "。", "！", "？", "；", "，", " ", ""],
  });
  const chunks = await splitter.splitDocuments([doc]);
  chunks.forEach((chunk, index) => {
    console.log(`\n--- Chunk ${index + 1} (${chunk.pageContent.length}) ---`);
    console.log(chunk.pageContent);
    console.dir(chunk.metadata);
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

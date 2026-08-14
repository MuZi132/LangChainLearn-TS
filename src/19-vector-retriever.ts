import "dotenv/config";
import { Document } from "@langchain/core/documents";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { createQwenEmbeddings } from "./lib/model.js";

async function main(): Promise<void> {
  const store = new MemoryVectorStore(createQwenEmbeddings());
  await store.addDocuments([
    new Document({ pageContent: "第 11 课学习短期记忆和 thread_id。", metadata: { lesson: 11 } }),
    new Document({ pageContent: "第 20 课完成带来源引用的 RAG。", metadata: { lesson: 20 } }),
    new Document({ pageContent: "第 24 课使用 interrupt 和 Command 完成人工审批。", metadata: { lesson: 24 } }),
  ]);

  const scored = await store.similaritySearchWithScore("哪一课讲人工审批？", 2);
  for (const [doc, score] of scored) console.log(score.toFixed(4), doc.pageContent, doc.metadata);

  const retriever = store.asRetriever({ k: 2, searchType: "similarity" });
  const docs = await retriever.invoke("如何保存同一会话历史？");
  console.dir(docs, { depth: 3 });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

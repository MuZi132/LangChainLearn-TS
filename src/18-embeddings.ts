import "dotenv/config";
import { createQwenEmbeddings } from "./lib/model.js";

function cosine(a: number[], b: number[]): number {
  const dot = a.reduce((sum, value, index) => sum + value * (b[index] ?? 0), 0);
  const normA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
  const normB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));
  return dot / (normA * normB);
}

async function main(): Promise<void> {
  const embeddings = createQwenEmbeddings();
  const [langchain, agent, cooking] = await embeddings.embedDocuments([
    "LangChain 用于构建大模型 Agent 应用。",
    "智能体可以调用工具完成任务。",
    "红烧肉需要先焯水再慢炖。",
  ]);
  const query = await embeddings.embedQuery("怎样开发会调用工具的 AI 助手？");
  console.log(`向量维度：${query.length}`);
  console.table({
    LangChain: cosine(query, langchain),
    Agent: cosine(query, agent),
    Cooking: cosine(query, cooking),
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import "dotenv/config";
import { buildKnowledgeStore } from "./lib/knowledge.js";
import { createQwenModel } from "./lib/model.js";

function formatContext(docs: Array<{ pageContent: string; metadata: Record<string, unknown> }>): string {
  return docs.map((doc, index) => `【资料 ${index + 1}｜${String(doc.metadata.source)}】\n${doc.pageContent}`).join("\n\n");
}

async function main(): Promise<void> {
  const question = process.argv.slice(2).join(" ") || "短期记忆和长期记忆有什么区别？";
  const { store } = await buildKnowledgeStore();
  const docs = await store.asRetriever({ k: 4 }).invoke(question);
  const response = await createQwenModel().invoke([
    {
      role: "system",
      content: "只根据提供的资料回答。资料不足时明确说不知道。回答末尾列出使用的资料来源。",
    },
    { role: "user", content: `问题：${question}\n\n资料：\n${formatContext(docs)}` },
  ]);
  console.log(response.text);
  console.log("\n检索来源：", [...new Set(docs.map((doc) => doc.metadata.source))]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

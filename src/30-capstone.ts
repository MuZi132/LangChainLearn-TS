import "dotenv/config";
import { createAgent, tool, type ToolRuntime } from "langchain";
import { InMemoryStore, MemorySaver } from "@langchain/langgraph";
import { z } from "zod";
import { buildKnowledgeStore } from "./lib/knowledge.js";
import { createQwenModel } from "./lib/model.js";

const contextSchema = z.object({ userId: z.string() });
type Context = z.infer<typeof contextSchema>;

async function main(): Promise<void> {
  const { store: vectorStore, chunks } = await buildKnowledgeStore();

  const searchKnowledge = tool(
    async ({ query }) => {
      const docs = await vectorStore.similaritySearch(query, 4);
      return docs.map((doc) => ({ content: doc.pageContent, source: doc.metadata.source }));
    },
    {
      name: "search_knowledge_base",
      description: "检索个人知识库。凡涉及课程资料、LangChain、Qwen、RAG 或 LangGraph 的事实问题时使用。",
      schema: z.object({ query: z.string().min(1) }),
    },
  );

  const savePreference = tool(
    async ({ preference }, runtime: ToolRuntime<unknown, Context>) => {
      await runtime.store.put(["users", runtime.context.userId], "preference", { preference });
      return { success: true };
    },
    {
      name: "save_user_preference",
      description: "保存用户明确要求长期记住的偏好。",
      schema: z.object({ preference: z.string().min(1) }),
    },
  );

  const agent = createAgent({
    model: createQwenModel(),
    tools: [searchKnowledge, savePreference],
    contextSchema,
    checkpointer: new MemorySaver(),
    store: new InMemoryStore(),
    systemPrompt: [
      "你是个人知识库 Agent。",
      "知识库事实必须先检索；没有证据时说明资料不足。",
      "回答中注明来源文件。",
      "用户明确要求记住偏好时使用保存工具。",
    ].join("\n"),
  });

  console.log(`已索引 ${chunks.length} 个知识块。`);
  const config = { context: { userId: "user-001" }, configurable: { thread_id: "capstone-demo" } };
  const first = await agent.invoke(
    { messages: [{ role: "user", content: "请记住我喜欢 TypeScript 示例，并解释短期记忆和长期记忆的区别。" }] },
    config,
  );
  console.log(first.messages.at(-1)?.text);
  const second = await agent.invoke(
    { messages: [{ role: "user", content: "再告诉我 LangGraph 的 interrupt 适合什么场景。" }] },
    config,
  );
  console.log(second.messages.at(-1)?.text);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

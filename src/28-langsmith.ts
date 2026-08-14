import "dotenv/config";
import { createAgent } from "langchain";
import { createQwenModel } from "./lib/model.js";

async function main(): Promise<void> {
  console.log(`LANGSMITH_TRACING=${process.env.LANGSMITH_TRACING ?? "false"}`);
  console.log(`LANGSMITH_PROJECT=${process.env.LANGSMITH_PROJECT ?? "default"}`);
  const agent = createAgent({ model: createQwenModel(), tools: [], systemPrompt: "你是中文学习助手。" });
  const result = await agent.invoke(
    { messages: [{ role: "user", content: "用三句话总结 Agent、RAG 和 LangGraph 的区别。" }] },
    {
      tags: ["lesson-28", "qwen"],
      metadata: { course: "langchain-ts-qwen", environment: process.env.NODE_ENV ?? "development" },
      runName: "lesson-28-observability",
    },
  );
  console.log(result.messages.at(-1)?.text);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

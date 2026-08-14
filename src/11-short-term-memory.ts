import "dotenv/config";
import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { createQwenModel } from "./lib/model.js";

async function main(): Promise<void> {
  const agent = createAgent({
    model: createQwenModel(),
    tools: [],
    checkpointer: new MemorySaver(),
    systemPrompt: "你是学习助手，请根据同一 thread 的历史回答。",
  });

  const threadA = { configurable: { thread_id: "lesson-11-a" } };
  await agent.invoke({ messages: [{ role: "user", content: "我叫小李，目标是开发知识库 Agent。" }] }, threadA);
  const remembered = await agent.invoke({ messages: [{ role: "user", content: "我的名字和目标是什么？" }] }, threadA);
  console.log("同一线程：", remembered.messages.at(-1)?.text);

  const threadB = { configurable: { thread_id: "lesson-11-b" } };
  const isolated = await agent.invoke({ messages: [{ role: "user", content: "我的名字是什么？" }] }, threadB);
  console.log("新线程：", isolated.messages.at(-1)?.text);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

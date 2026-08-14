import "dotenv/config";
import { createAgent, tool, type ToolRuntime } from "langchain";
import { InMemoryStore, MemorySaver } from "@langchain/langgraph";
import { z } from "zod";
import { createQwenModel } from "./lib/model.js";

const contextSchema = z.object({ userId: z.string() });
type Context = z.infer<typeof contextSchema>;

const savePreferences = tool(
  async (input: { language: string; answerStyle: string }, runtime: ToolRuntime<unknown, Context>) => {
    await runtime.store.put(["users", runtime.context.userId], "preferences", input);
    return { success: true };
  },
  {
    name: "save_preferences",
    description: "保存用户明确给出的语言和回答风格偏好。",
    schema: z.object({ language: z.string(), answerStyle: z.string() }),
  },
);

const getPreferences = tool(
  async (_input, runtime: ToolRuntime<unknown, Context>) => {
    const item = await runtime.store.get(["users", runtime.context.userId], "preferences");
    return item?.value ?? { message: "暂无偏好" };
  },
  { name: "get_preferences", description: "读取当前用户的长期偏好。", schema: z.object({}) },
);

async function main(): Promise<void> {
  const agent = createAgent({
    model: createQwenModel(),
    tools: [savePreferences, getPreferences],
    contextSchema,
    store: new InMemoryStore(),
    checkpointer: new MemorySaver(),
    systemPrompt: "用户要求记住偏好时调用保存工具；询问偏好时调用读取工具。",
  });
  const context = { context: { userId: "user-001" } };
  await agent.invoke(
    { messages: [{ role: "user", content: "请记住：我偏好中文，并喜欢简洁但有代码的回答。" }] },
    { ...context, configurable: { thread_id: "thread-one" } },
  );
  const result = await agent.invoke(
    { messages: [{ role: "user", content: "我喜欢怎样的回答？" }] },
    { ...context, configurable: { thread_id: "another-thread" } },
  );
  console.log(result.messages.at(-1)?.text);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

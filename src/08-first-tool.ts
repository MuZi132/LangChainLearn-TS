import "dotenv/config";
import { tool } from "langchain";
import { z } from "zod";
import { createQwenModel } from "./lib/model.js";

const records = {
  learner_001: { name: "小李", completed: 7, currentLesson: 8 },
} as const;

const getLearningProgress = tool(
  async ({ learnerId }) => {
    return records[learnerId as keyof typeof records] ?? { error: "未找到记录" };
  },
  {
    name: "get_learning_progress",
    description: "根据 learnerId 查询真实学习进度。",
    schema: z.object({ learnerId: z.string().regex(/^learner_\d{3}$/) }),
  },
);

async function main(): Promise<void> {
  const model = createQwenModel().bindTools([getLearningProgress]);
  const messages = [
    { role: "system" as const, content: "查询学习进度必须使用工具。" },
    { role: "user" as const, content: "查询 learner_001 的学习进度。" },
  ];
  const first = await model.invoke(messages);
  console.dir(first.tool_calls, { depth: null });
  messages.push(first as never);
  for (const call of first.tool_calls ?? []) {
    if (call.name !== getLearningProgress.name) throw new Error("未注册工具");
    const result = await getLearningProgress.invoke(call);
    messages.push(result as never);
  }
  const final = await model.invoke(messages);
  console.log(final.text);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

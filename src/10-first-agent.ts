import "dotenv/config";
import { createAgent, modelCallLimitMiddleware, tool, toolCallLimitMiddleware } from "langchain";
import { z } from "zod";
import { createQwenModel } from "./lib/model.js";

const getProgress = tool(
  ({ learnerId }) => ({ learnerId, currentLesson: 10, completed: 9 }),
  { name: "get_learning_progress", description: "查询学习者进度。", schema: z.object({ learnerId: z.string() }) },
);
const getLesson = tool(
  ({ lessonNumber }) => ({ lessonNumber, title: "使用 createAgent", objective: "自动管理工具循环" }),
  { name: "get_lesson_detail", description: "查询课程详情。", schema: z.object({ lessonNumber: z.number().int().positive() }) },
);

async function main(): Promise<void> {
  const agent = createAgent({
    model: createQwenModel(),
    tools: [getProgress, getLesson],
    systemPrompt: "查询真实数据必须使用工具；课程编号若依赖进度结果，必须先查询进度。",
    middleware: [
      modelCallLimitMiddleware({ runLimit: 8, exitBehavior: "error" }),
      toolCallLimitMiddleware({ runLimit: 12, exitBehavior: "error" }),
    ],
  });
  const result = await agent.invoke({
    messages: [{ role: "user", content: "先查询 learner_001 当前课程，再查询这节课详情。" }],
  });
  console.log(result.messages.at(-1)?.text);
  console.dir(result.messages, { depth: 4 });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

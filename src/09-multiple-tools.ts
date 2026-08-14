import "dotenv/config";
import { tool } from "langchain";
import { z } from "zod";
import { createQwenModel } from "./lib/model.js";

const getLearningProgress = tool(
  ({ learnerId }) => ({ learnerId, currentLesson: learnerId === "learner_001" ? 9 : null }),
  { name: "get_learning_progress", description: "查询学习者当前课程。", schema: z.object({ learnerId: z.string() }) },
);
const getLessonDetail = tool(
  ({ lessonNumber }) => ({ lessonNumber, title: `第 ${lessonNumber} 课`, objective: "掌握多工具调用" }),
  { name: "get_lesson_detail", description: "查询指定课程详情。", schema: z.object({ lessonNumber: z.number().int().positive() }) },
);
const calculateStudyHours = tool(
  ({ dailyHours, days }) => ({ totalHours: dailyHours * days }),
  { name: "calculate_study_hours", description: "计算总学习时长。", schema: z.object({ dailyHours: z.number().positive(), days: z.number().int().positive() }) },
);

const tools = [getLearningProgress, getLessonDetail, calculateStudyHours];
const registry = new Map(tools.map((item) => [item.name, item]));

async function main(): Promise<void> {
  const model = createQwenModel().bindTools(tools, { tool_choice: "auto", parallel_tool_calls: true });
  const messages: any[] = [{ role: "user", content: "查询 learner_001 的进度、第 9 课详情，并计算每天 2 小时学习 7 天的总时长。" }];
  for (let round = 0; round < 5; round += 1) {
    const ai = await model.invoke(messages);
    messages.push(ai);
    const calls = ai.tool_calls ?? [];
    if (calls.length === 0) {
      console.log(ai.text);
      return;
    }
    const results = await Promise.all(
      calls.map(async (call) => {
        const selected = registry.get(call.name);
        if (!selected) throw new Error(`未注册工具：${call.name}`);
        return selected.invoke(call);
      }),
    );
    messages.push(...results);
  }
  throw new Error("超过最大工具轮数");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

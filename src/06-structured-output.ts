import "dotenv/config";
import { z } from "zod";
import { createQwenModel } from "./lib/model.js";

const StudyPlanSchema = z.object({
  learnerName: z.string().nullable(),
  level: z.enum(["入门", "基础", "进阶"]),
  dailyHours: z.number().positive().nullable(),
  goals: z.array(z.string()),
  nextSteps: z.array(
    z.object({
      topic: z.string(),
      priority: z.enum(["高", "中", "低"]),
      reason: z.string(),
    }),
  ),
});

type StudyPlan = z.infer<typeof StudyPlanSchema>;

function printPlan(plan: StudyPlan): void {
  console.log(`姓名：${plan.learnerName ?? "未提供"}`);
  console.log(`水平：${plan.level}`);
  console.log(`每天：${plan.dailyHours ?? "未提供"} 小时`);
  console.log(`目标：${plan.goals.join("、")}`);
  console.table(plan.nextSteps);
}

async function main(): Promise<void> {
  const structured = createQwenModel().withStructuredOutput(StudyPlanSchema, {
    name: "extract_study_plan",
    method: "jsonSchema",
    strict: true,
    includeRaw: true,
  });

  const result = await structured.invoke(
    "我叫小李，已经学会 TypeScript 基础，每天学 2 小时，目标是做个人知识库 Agent；目前不熟悉 Zod、工具调用和 RAG。",
  );
  printPlan(result.parsed);
  console.dir(result.raw.usage_metadata, { depth: null });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

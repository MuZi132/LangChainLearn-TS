import "dotenv/config";
import { z } from "zod";
import { createQwenModel } from "./lib/model.js";

const RouteSchema = z.object({
  intent: z.enum([
    "technical_question",
    "code_review",
    "study_plan",
    "project_design",
    "casual_chat",
    "other",
  ]),
  confidence: z.number(),
  reason: z.string(),
  normalizedRequest: z.string(),
});

type Route = z.infer<typeof RouteSchema>;

async function classify(input: string): Promise<Route> {
  const classifier = createQwenModel().withStructuredOutput(RouteSchema, {
    name: "classify_request",
    method: "jsonSchema",
    strict: true,
  });
  const result = await classifier.invoke([
    {
      role: "system",
      content: [
        "你只负责分类，不回答问题。",
        "technical_question=解释技术概念；code_review=检查或修改代码；",
        "study_plan=制定学习路线；project_design=设计系统或架构；",
        "casual_chat=闲聊；other=无法判断。只选最主要意图。",
      ].join("\n"),
    },
    { role: "user", content: input },
  ]);
  return { ...result, confidence: Math.max(0, Math.min(1, result.confidence)) };
}

async function handle(route: Route, input: string): Promise<string> {
  if (route.confidence < 0.65) return "请求不够明确，请补充希望获得的最终结果。";
  const prompts: Record<Route["intent"], string> = {
    technical_question: "你是 TypeScript 技术教师。",
    code_review: "你是严格的 TypeScript 代码审查员。",
    study_plan: "你是软件开发学习规划师。",
    project_design: "你是 AI 应用架构师。",
    casual_chat: "你是友好的学习伙伴。",
    other: "请要求用户补充具体目标。",
  };
  const response = await createQwenModel().invoke([
    { role: "system", content: `${prompts[route.intent]}请用中文回答。` },
    { role: "user", content: input },
  ]);
  return response.text;
}

async function main(): Promise<void> {
  const input = process.argv.slice(2).join(" ") || "请检查 function first<T>(items:T[]):T { return items[0]; }";
  const route = await classify(input);
  console.dir(route, { depth: null });
  console.log(await handle(route, input));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

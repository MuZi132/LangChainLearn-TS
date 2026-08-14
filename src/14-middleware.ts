import "dotenv/config";
import {
  createAgent,
  createMiddleware,
  modelCallLimitMiddleware,
  tool,
  toolCallLimitMiddleware,
} from "langchain";
import { z } from "zod";
import { createQwenModel } from "./lib/model.js";

const contextSchema = z.object({ userName: z.string(), plan: z.enum(["free", "pro"]) });

const loggingMiddleware = createMiddleware({
  name: "LoggingMiddleware",
  contextSchema,
  beforeModel: (state, runtime) => {
    console.log(`[beforeModel] user=${runtime.context.userName}, messages=${state.messages.length}`);
  },
  afterModel: (state, runtime) => {
    console.log(`[afterModel] user=${runtime.context.userName}, messages=${state.messages.length}`);
  },
  wrapToolCall: async (request, handler) => {
    const startedAt = performance.now();
    try {
      return await handler(request);
    } finally {
      console.log(`[tool] ${request.toolCall.name}: ${Math.round(performance.now() - startedAt)} ms`);
    }
  },
});

const getPlanBenefits = tool(
  (_input, runtime: any) => ({ plan: runtime.context.plan, benefits: runtime.context.plan === "pro" ? ["更高限额", "优先支持"] : ["基础功能"] }),
  { name: "get_plan_benefits", description: "查询当前套餐权益。", schema: z.object({}) },
);

async function main(): Promise<void> {
  const agent = createAgent({
    model: createQwenModel(),
    tools: [getPlanBenefits],
    contextSchema,
    middleware: [
      loggingMiddleware,
      modelCallLimitMiddleware({ runLimit: 6, exitBehavior: "error" }),
      toolCallLimitMiddleware({ runLimit: 8, exitBehavior: "error" }),
    ],
    systemPrompt: "回答套餐问题时使用工具。",
  });
  const result = await agent.invoke(
    { messages: [{ role: "user", content: "我的套餐有什么权益？" }] },
    { context: { userName: "小李", plan: "pro" } },
  );
  console.log(result.messages.at(-1)?.text);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

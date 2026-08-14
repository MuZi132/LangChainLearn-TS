import "dotenv/config";
import {
  createAgent,
  modelCallLimitMiddleware,
  piiRedactionMiddleware,
  toolCallLimitMiddleware,
} from "langchain";
import { createQwenModel } from "./lib/model.js";
import { calculator } from "./lib/calculator.js";

async function main(): Promise<void> {
  const agent = createAgent({
    model: createQwenModel(),
    tools: [calculator],
    middleware: [
      piiRedactionMiddleware({ piiType: "email", strategy: "redact", applyToInput: true }),
      modelCallLimitMiddleware({ runLimit: 5, exitBehavior: "error" }),
      toolCallLimitMiddleware({ runLimit: 6, exitBehavior: "error" }),
    ],
    systemPrompt: "数学计算必须使用工具；不要在回答中泄露被遮盖的个人信息。",
  });
  const result = await agent.invoke({
    messages: [{ role: "user", content: "我的邮箱是 user@example.com，请计算 19+23。" }],
  });
  console.log(result.messages.at(-1)?.text);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

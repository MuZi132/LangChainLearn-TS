import "dotenv/config";

import { ChatOpenAI } from "@langchain/openai";

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`缺少环境变量：${name}`);
  return value;
}

function createModel(): ChatOpenAI {
  return new ChatOpenAI({
    model: getRequiredEnv("QWEN_MODEL"),
    apiKey: getRequiredEnv("DASHSCOPE_API_KEY"),
    configuration: { baseURL: getRequiredEnv("DASHSCOPE_BASE_URL") },
    modelKwargs: { enable_thinking: false },
    streamUsage: false,
    maxRetries: 1,
    timeout: 120_000,
  });
}

function formatContent(content: unknown): string {
  return typeof content === "string"
    ? content
    : JSON.stringify(content, null, 2);
}

async function main(): Promise<void> {
  const model = createModel();
  const prompts = [
    "请用一句话解释 TypeScript 中的 unknown 类型。",
    "请用一句话解释 TypeScript 中的 never 类型。",
    "请用一句话解释 TypeScript 中的泛型约束。",
    "请用一句话解释 TypeScript 中的类型守卫。",
  ];

  const startedAt = performance.now();
  const responses = await model.batch(prompts, {
    maxConcurrency: 2,
  });
  const finishedAt = performance.now();

  responses.forEach((response, index) => {
    console.log(`\n问题 ${index + 1}：`);
    console.log(prompts[index] ?? "未知问题");
    console.log("回答：");
    console.log(formatContent(response.content));
  });

  const totalTokens = responses.reduce(
    (sum, response) => sum + (response.usage_metadata?.total_tokens ?? 0),
    0,
  );

  console.log(`\n总耗时：${Math.round(finishedAt - startedAt)} ms`);
  console.log(`总 Token：${totalTokens}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

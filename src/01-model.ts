import "dotenv/config";

import { ChatOpenAI } from "@langchain/openai";

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`缺少环境变量：${name}`);
  }
  return value;
}

function formatContent(content: unknown): string {
  return typeof content === "string"
    ? content
    : JSON.stringify(content, null, 2);
}

async function main(): Promise<void> {
  const model = new ChatOpenAI({
    model: getRequiredEnv("QWEN_MODEL"),
    apiKey: getRequiredEnv("DASHSCOPE_API_KEY"),
    configuration: {
      baseURL: getRequiredEnv("DASHSCOPE_BASE_URL"),
    },
    modelKwargs: {
      enable_thinking: false,
    },
    streamUsage: false,
    maxRetries: 0,
    timeout: 120_000,
  });

  console.log("开始调用 LangChain...");

  const response = await model.invoke("请只回复：LangChain 调用成功");

  console.log("\n模型回答：");
  console.log(formatContent(response.content));

  console.log("\nToken 使用情况：");
  console.dir(response.usage_metadata, { depth: null });
}

main().catch((error: unknown) => {
  console.error("\nLangChain 调用失败：");
  console.error(error);
  process.exitCode = 1;
});

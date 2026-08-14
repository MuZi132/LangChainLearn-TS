import "dotenv/config";

import { ChatOpenAI } from "@langchain/openai";
import {
  HumanMessage,
  SystemMessage,
  type AIMessageChunk,
  type BaseMessage,
} from "@langchain/core/messages";

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

async function main(): Promise<void> {
  const model = createModel();
  const messages: BaseMessage[] = [
    new SystemMessage(
      "你是一名 TypeScript 和 LangChain 教练，请使用中文回答。",
    ),
    new HumanMessage(
      "请分成 5 点解释 Promise 的工作原理，并给出 TypeScript 示例。",
    ),
  ];

  const startedAt = Date.now();
  let firstTextAt: number | undefined;
  let chunkCount = 0;
  let fullMessage: AIMessageChunk | undefined;

  const stream = await model.stream(messages);

  for await (const chunk of stream) {
    chunkCount += 1;
    fullMessage = fullMessage ? fullMessage.concat(chunk) : chunk;

    const text = chunk.text;
    if (!text) continue;
    if (firstTextAt === undefined) firstTextAt = Date.now();
    process.stdout.write(text);
  }

  process.stdout.write("\n");
  const finishedAt = Date.now();

  console.log(`Chunk 数量：${chunkCount}`);
  console.log(
    `首段文本等待时间：${
      firstTextAt === undefined ? "无" : `${firstTextAt - startedAt} ms`
    }`,
  );
  console.log(`完整请求耗时：${finishedAt - startedAt} ms`);
  console.log(`最终文本长度：${fullMessage?.text.length ?? 0}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

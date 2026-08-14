import "dotenv/config";

import { ChatOpenAI } from "@langchain/openai";
import {
  HumanMessage,
  SystemMessage,
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
    maxRetries: 0,
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
  const history: BaseMessage[] = [
    new SystemMessage(
      "你是一名 TypeScript 和 LangChain 教练，请使用中文回答。",
    ),
  ];

  history.push(
    new HumanMessage(
      "我叫小李，目前正在学习 TypeScript 和 LangChain。请简单鼓励我一下。",
    ),
  );

  const firstResponse = await model.invoke(history);
  history.push(firstResponse);
  console.log("第一轮回答：");
  console.log(formatContent(firstResponse.content));

  history.push(
    new HumanMessage("我叫什么名字？我目前正在学习哪些技术？"),
  );

  const secondResponse = await model.invoke(history);
  history.push(secondResponse);
  console.log("\n第二轮回答：");
  console.log(formatContent(secondResponse.content));

  console.log("\n完整消息历史：");
  history.forEach((message, index) => {
    console.log(`\n消息 ${index + 1}`);
    console.log(`类型：${message.getType()}`);
    console.log(`内容：${formatContent(message.content)}`);
  });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

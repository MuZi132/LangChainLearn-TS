import "dotenv/config";

import { ChatOpenAI } from "@langchain/openai";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  type AIMessageChunk,
  type BaseMessage,
} from "@langchain/core/messages";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

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

function printHistory(history: BaseMessage[]): void {
  console.log("\n========== 对话历史 ==========");
  history.forEach((message, index) => {
    console.log(`\n消息 ${index + 1}｜${message.getType()}`);
    console.log(formatContent(message.content));
  });
  console.log("\n==============================\n");
}

async function streamModelResponse(
  model: ChatOpenAI,
  history: BaseMessage[],
): Promise<string> {
  const stream = await model.stream(history);
  let fullMessage: AIMessageChunk | undefined;
  let renderedText = "";

  process.stdout.write("\nAI：");

  for await (const chunk of stream) {
    fullMessage = fullMessage ? fullMessage.concat(chunk) : chunk;
    const text = chunk.text;
    if (!text) continue;
    renderedText += text;
    process.stdout.write(text);
  }

  process.stdout.write("\n\n");
  return fullMessage?.text || renderedText;
}

async function main(): Promise<void> {
  const model = createModel();
  const rl = readline.createInterface({ input, output });
  const history: BaseMessage[] = [
    new SystemMessage(
      [
        "你是一名 TypeScript 和 LangChain 学习助手。",
        "请始终使用中文回答。",
        "用户询问代码问题时，优先提供 TypeScript 示例。",
      ].join("\n"),
    ),
  ];

  console.log("Qwen + LangChain 命令行聊天程序");
  console.log("命令：/history /clear /exit\n");

  try {
    while (true) {
      const rawInput = await rl.question("你：");
      const userInput = rawInput.trim();
      if (!userInput) continue;

      const command = userInput.toLowerCase();
      if (command === "/exit" || command === "/quit") break;
      if (command === "/history") {
        printHistory(history);
        continue;
      }
      if (command === "/clear") {
        history.splice(1);
        console.log("\n对话历史已清空。\n");
        continue;
      }

      history.push(new HumanMessage(userInput));

      try {
        const answer = await streamModelResponse(model, history);
        if (!answer.trim()) throw new Error("模型没有返回有效文本");
        history.push(new AIMessage(answer));
      } catch (error: unknown) {
        history.pop();
        console.error("\n模型调用失败：");
        console.error(error instanceof Error ? error.message : error);
      }
    }
  } finally {
    rl.close();
  }

  console.log("\n聊天已结束。");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

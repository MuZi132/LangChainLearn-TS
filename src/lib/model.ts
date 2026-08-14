import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { getRequiredEnv } from "./env.js";

export function createQwenModel(): ChatOpenAI {
  return new ChatOpenAI({
    model: process.env.QWEN_MODEL?.trim() || "qwen3.8-max",
    apiKey: getRequiredEnv("DASHSCOPE_API_KEY"),
    configuration: {
      baseURL: getRequiredEnv("DASHSCOPE_BASE_URL"),
    },
    modelKwargs: {
      enable_thinking: false,
      parallel_tool_calls: true,
    },
    temperature: 0,
    streamUsage: false,
    maxRetries: 1,
    timeout: 120_000,
  });
}

export function createQwenEmbeddings(): OpenAIEmbeddings {
  return new OpenAIEmbeddings({
    model: process.env.QWEN_EMBEDDING_MODEL?.trim() || "text-embedding-v4",
    apiKey: getRequiredEnv("DASHSCOPE_API_KEY"),
    configuration: {
      baseURL: getRequiredEnv("DASHSCOPE_BASE_URL"),
    },
    batchSize: 20,
    maxRetries: 2,
  });
}

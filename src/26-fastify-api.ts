import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { z } from "zod";
import { createQwenModel } from "./lib/model.js";

const bodySchema = z.object({ message: z.string().min(1), threadId: z.string().min(1).default("default") });
const agent = createAgent({
  model: createQwenModel(),
  tools: [],
  checkpointer: new MemorySaver(),
  systemPrompt: "你是中文 TypeScript 学习助手。",
});

async function main(): Promise<void> {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });
  app.get("/health", async () => ({ ok: true }));
  app.post("/chat", async (request, reply) => {
    const body = bodySchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() });
    const result = await agent.invoke(
      { messages: [{ role: "user", content: body.data.message }] },
      { configurable: { thread_id: body.data.threadId } },
    );
    return { answer: result.messages.at(-1)?.text ?? "", threadId: body.data.threadId };
  });
  await app.listen({ host: "0.0.0.0", port: Number(process.env.PORT ?? 3000) });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

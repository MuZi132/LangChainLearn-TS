import "dotenv/config";
import Fastify from "fastify";
import { createAgent } from "langchain";
import { z } from "zod";
import { createQwenModel } from "./lib/model.js";

const inputSchema = z.object({ message: z.string().min(1) });
const agent = createAgent({ model: createQwenModel(), tools: [], systemPrompt: "请使用中文回答。" });

async function main(): Promise<void> {
  const app = Fastify({ logger: true });
  app.post("/chat/stream", async (request, reply) => {
    const parsed = inputSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const stream = await agent.streamEvents(
      { messages: [{ role: "user", content: parsed.data.message }] },
      { version: "v3" },
    );
    for await (const message of stream.messages) {
      for await (const token of message.text) {
        reply.raw.write(`event: token\ndata: ${JSON.stringify({ text: token })}\n\n`);
      }
    }
    reply.raw.write("event: done\ndata: {}\n\n");
    reply.raw.end();
  });
  await app.listen({ host: "0.0.0.0", port: Number(process.env.PORT ?? 3001) });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

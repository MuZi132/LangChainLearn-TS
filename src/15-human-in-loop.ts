import "dotenv/config";
import { createAgent, humanInTheLoopMiddleware, tool } from "langchain";
import { Command, MemorySaver } from "@langchain/langgraph";
import { z } from "zod";
import { createQwenModel } from "./lib/model.js";

const notes = new Map([["note-001", "重要学习笔记"]]);
const deleteNote = tool(
  ({ noteId }) => ({ deleted: notes.delete(noteId), noteId }),
  { name: "delete_note", description: "永久删除指定笔记，属于敏感写操作。", schema: z.object({ noteId: z.string() }) },
);

async function main(): Promise<void> {
  const agent = createAgent({
    model: createQwenModel(),
    tools: [deleteNote],
    middleware: [
      humanInTheLoopMiddleware({
        interruptOn: {
          delete_note: { allowedDecisions: ["approve", "reject"] },
        },
        descriptionPrefix: "敏感操作等待审批",
      }),
    ],
    checkpointer: new MemorySaver(),
    systemPrompt: "删除笔记必须调用 delete_note，不得声称已删除而不执行工具。",
  });

  const config = { configurable: { thread_id: "lesson-15" } };
  const paused = await agent.invoke(
    { messages: [{ role: "user", content: "删除 note-001" }] },
    config,
  );
  console.dir((paused as any).__interrupt__, { depth: null });

  const resumed = await agent.invoke(
    new Command({ resume: { decisions: [{ type: "approve" }] } }),
    config,
  );
  console.log(resumed.messages.at(-1)?.text);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

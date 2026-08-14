import "dotenv/config";
import { Command, END, interrupt, MemorySaver, START, StateGraph, StateSchema } from "@langchain/langgraph";
import { z } from "zod";

const State = new StateSchema({
  action: z.string(),
  approved: z.boolean().default(false),
  result: z.string().default(""),
});

const review: typeof State.Node = (state) => {
  const decision = interrupt({ message: "是否批准敏感操作？", action: state.action });
  return new Command({ update: { approved: Boolean(decision) }, goto: Boolean(decision) ? "execute" : "reject" });
};
const execute: typeof State.Node = (state) => ({ result: `已执行：${state.action}` });
const reject: typeof State.Node = (state) => ({ result: `已拒绝：${state.action}` });

async function main(): Promise<void> {
  const graph = new StateGraph(State)
    .addNode("review", review, { ends: ["execute", "reject"] })
    .addNode("execute", execute)
    .addNode("reject", reject)
    .addEdge(START, "review")
    .addEdge("execute", END)
    .addEdge("reject", END)
    .compile({ checkpointer: new MemorySaver() });
  const config = { configurable: { thread_id: "lesson-24" } };
  const paused = await graph.invoke({ action: "删除旧索引" }, config);
  console.dir((paused as any).__interrupt__, { depth: null });
  const resumed = await graph.invoke(new Command({ resume: true }), config);
  console.log(resumed.result);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

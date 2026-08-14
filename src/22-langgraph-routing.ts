import "dotenv/config";
import { END, START, StateGraph, StateSchema, type ConditionalEdgeRouter } from "@langchain/langgraph";
import { z } from "zod";
import { createQwenModel } from "./lib/model.js";

const State = new StateSchema({
  query: z.string(),
  intent: z.enum(["technical", "casual", "unknown"]).default("unknown"),
  answer: z.string().default(""),
});

const classify: typeof State.Node = async (state) => {
  const schema = z.object({ intent: z.enum(["technical", "casual", "unknown"]) });
  const model = createQwenModel().withStructuredOutput(schema, { method: "jsonSchema", strict: true });
  return model.invoke(`分类：technical=技术问题，casual=闲聊，unknown=不明确。请求：${state.query}`);
};
const technical: typeof State.Node = async (state) => ({ answer: (await createQwenModel().invoke(`用中文解释技术问题：${state.query}`)).text });
const casual: typeof State.Node = async (state) => ({ answer: (await createQwenModel().invoke(`友好简洁地回应：${state.query}`)).text });
const clarify: typeof State.Node = () => ({ answer: "请补充你的具体目标。" });

const route: ConditionalEdgeRouter<{ InputSchema: typeof State; Nodes: "technical" | "casual" | "clarify" }> = (state) => {
  if (state.intent === "technical") return "technical";
  if (state.intent === "casual") return "casual";
  return "clarify";
};

async function main(): Promise<void> {
  const graph = new StateGraph(State)
    .addNode("classify", classify)
    .addNode("technical", technical)
    .addNode("casual", casual)
    .addNode("clarify", clarify)
    .addEdge(START, "classify")
    .addConditionalEdges("classify", route)
    .addEdge("technical", END)
    .addEdge("casual", END)
    .addEdge("clarify", END)
    .compile();
  console.log((await graph.invoke({ query: process.argv.slice(2).join(" ") || "Promise 是什么？" })).answer);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

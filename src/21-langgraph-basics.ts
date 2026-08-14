import "dotenv/config";
import { END, ReducedValue, START, StateGraph, StateSchema } from "@langchain/langgraph";
import { z } from "zod";

const State = new StateSchema({
  input: z.string(),
  normalized: z.string().default(""),
  result: z.string().default(""),
  steps: new ReducedValue(z.array(z.string()).default(() => []), {
    reducer: (left, right) => left.concat(right),
  }),
});

const normalize: typeof State.Node = (state) => ({
  normalized: state.input.trim().replace(/\s+/g, " "),
  steps: ["normalize"],
});
const answer: typeof State.Node = (state) => ({
  result: `已处理：${state.normalized}`,
  steps: ["answer"],
});

async function main(): Promise<void> {
  const graph = new StateGraph(State)
    .addNode("normalize", normalize)
    .addNode("answer", answer)
    .addEdge(START, "normalize")
    .addEdge("normalize", "answer")
    .addEdge("answer", END)
    .compile();
  console.dir(await graph.invoke({ input: "  学习   LangGraph  " }), { depth: null });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

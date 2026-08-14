import "dotenv/config";
import { END, START, StateGraph, StateSchema } from "@langchain/langgraph";
import { z } from "zod";
import { buildKnowledgeStore } from "./lib/knowledge.js";
import { createQwenModel } from "./lib/model.js";

const State = new StateSchema({
  query: z.string(),
  documents: z.array(z.object({ pageContent: z.string(), source: z.string() })).default(() => []),
  answer: z.string().default(""),
});

async function main(): Promise<void> {
  const { store } = await buildKnowledgeStore();
  const retrieve: typeof State.Node = async (state) => ({
    documents: (await store.similaritySearch(state.query, 4)).map((doc) => ({
      pageContent: doc.pageContent,
      source: String(doc.metadata.source),
    })),
  });
  const answer: typeof State.Node = async (state) => {
    const context = state.documents.map((doc, i) => `资料${i + 1}(${doc.source})：${doc.pageContent}`).join("\n\n");
    const response = await createQwenModel().invoke([
      { role: "system", content: "只根据资料回答，不知道就明确说明。" },
      { role: "user", content: `问题：${state.query}\n\n${context}` },
    ]);
    return { answer: response.text };
  };
  const graph = new StateGraph(State)
    .addNode("retrieve", retrieve)
    .addNode("answer", answer)
    .addEdge(START, "retrieve")
    .addEdge("retrieve", "answer")
    .addEdge("answer", END)
    .compile();
  console.log((await graph.invoke({ query: "LangGraph 的 interrupt 有什么用？" })).answer);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

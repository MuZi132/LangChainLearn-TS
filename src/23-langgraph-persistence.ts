import "dotenv/config";
import { AIMessage } from "@langchain/core/messages";
import { MemorySaver, MessagesValue, START, END, StateGraph, StateSchema } from "@langchain/langgraph";
import { createQwenModel } from "./lib/model.js";

const State = new StateSchema({ messages: MessagesValue });
const chat: typeof State.Node = async (state) => {
  const response = await createQwenModel().invoke(state.messages);
  return { messages: [response] };
};

async function main(): Promise<void> {
  const graph = new StateGraph(State)
    .addNode("chat", chat)
    .addEdge(START, "chat")
    .addEdge("chat", END)
    .compile({ checkpointer: new MemorySaver() });
  const config = { configurable: { thread_id: "lesson-23" } };
  await graph.invoke({ messages: [{ role: "user", content: "我叫小李。" }] }, config);
  const result = await graph.invoke({ messages: [{ role: "user", content: "我叫什么？" }] }, config);
  const last = result.messages.at(-1);
  if (last && AIMessage.isInstance(last)) console.log(last.text);
  console.dir(await graph.getState(config), { depth: 3 });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

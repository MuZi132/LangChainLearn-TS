import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { createQwenEmbeddings } from "./model.js";

export async function loadMarkdownKnowledge(
  directory = "data/knowledge",
): Promise<Document[]> {
  const names = (await readdir(directory)).filter((name) => name.endsWith(".md"));
  const docs = await Promise.all(
    names.map(async (name) => {
      const source = path.join(directory, name);
      const pageContent = await readFile(source, "utf8");
      return new Document({ pageContent, metadata: { source } });
    }),
  );
  return docs;
}

export async function buildKnowledgeStore() {
  const docs = await loadMarkdownKnowledge();
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 600,
    chunkOverlap: 100,
    separators: ["\n\n", "\n", "。", "！", "？", "；", "，", " ", ""],
  });
  const chunks = await splitter.splitDocuments(docs);
  const store = new MemoryVectorStore(createQwenEmbeddings());
  await store.addDocuments(chunks);
  return { store, chunks };
}

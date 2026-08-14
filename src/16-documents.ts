import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";
import { Document } from "@langchain/core/documents";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { PDFParse } from "pdf-parse";

async function loadPdfPages(filePath: string): Promise<Document[]> {
  const parser = new PDFParse({ data: new Uint8Array(readFileSync(filePath)) });
  try {
    const { pages } = await parser.getText();
    return pages.map((page) => new Document({
      pageContent: page.text,
      metadata: { source: filePath, page: page.num - 1 },
    }));
  } finally {
    await parser.destroy();
  }
}

async function main(): Promise<void> {
  const manual = new Document({
    pageContent: "LangChain 的 Document 由 pageContent、metadata 和可选 id 组成。",
    metadata: { source: "manual" },
  });
  const textDocs = await new TextLoader("data/knowledge/langchain-notes.md").load();
  const pdfDocs = existsSync("data/sample.pdf") ? await loadPdfPages("data/sample.pdf") : [];
  console.dir([manual, ...textDocs, ...pdfDocs].slice(0, 3), { depth: 3 });
  if (pdfDocs.length === 0) console.log("未发现 data/sample.pdf，已跳过 PDF 示例。\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

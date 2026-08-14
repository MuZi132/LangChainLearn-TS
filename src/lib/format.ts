export function formatContent(content: unknown): string {
  if (typeof content === "string") return content;
  return JSON.stringify(content, null, 2) ?? String(content);
}

export function lastText(messages: Array<{ content: unknown }>): string {
  const last = messages.at(-1);
  return last ? formatContent(last.content) : "";
}

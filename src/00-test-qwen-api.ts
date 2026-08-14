import "dotenv/config";

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`缺少环境变量：${name}`);
  }
  return value;
}

async function main(): Promise<void> {
  const apiKey = getRequiredEnv("DASHSCOPE_API_KEY");
  const baseURL = getRequiredEnv("DASHSCOPE_BASE_URL");
  const model = process.env.QWEN_MODEL?.trim() || "qwen3.8-max";

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "user", content: "你好，请只回复：接口调用成功" },
      ],
      enable_thinking: false,
      stream: false,
    }),
  });

  const responseText = await response.text();
  console.log(`HTTP 状态码：${response.status}`);
  console.log("原始响应：");
  console.log(responseText);

  if (!response.ok) {
    throw new Error(`请求失败，HTTP 状态码：${response.status}`);
  }

  const result = JSON.parse(responseText) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  console.log("\n模型正文：");
  console.log(
    result.choices?.[0]?.message?.content ??
      "响应中没有找到 choices[0].message.content",
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

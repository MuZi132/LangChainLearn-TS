import "dotenv/config";
import { createAgent, tool, type ToolRuntime } from "langchain";
import { z } from "zod";
import { createQwenModel } from "./lib/model.js";

const contextSchema = z.object({
  userId: z.string(),
  tenantId: z.string(),
  role: z.enum(["reader", "admin"]),
});
type Context = z.infer<typeof contextSchema>;

const getTenantProfile = tool(
  async ({ targetUserId }, runtime: ToolRuntime<unknown, Context>) => {
    if (runtime.context.role !== "admin" && targetUserId !== runtime.context.userId) {
      return { success: false, error: "无权读取其他用户资料" };
    }
    return {
      success: true,
      tenantId: runtime.context.tenantId,
      targetUserId,
      plan: "pro",
    };
  },
  {
    name: "get_tenant_profile",
    description: "在当前租户和权限范围内读取用户资料。",
    schema: z.object({ targetUserId: z.string() }),
  },
);

async function main(): Promise<void> {
  const agent = createAgent({
    model: createQwenModel(),
    tools: [getTenantProfile],
    contextSchema,
    systemPrompt: "必须尊重工具返回的权限结果，不得绕过租户边界。",
  });
  const result = await agent.invoke(
    { messages: [{ role: "user", content: "查询 user-002 的资料" }] },
    { context: { userId: "user-001", tenantId: "tenant-a", role: "reader" } },
  );
  console.log(result.messages.at(-1)?.text);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

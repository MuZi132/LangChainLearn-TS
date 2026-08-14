import { tool } from "langchain";
import { z } from "zod";

/**
 * 一个确定性的计算工具，便于单元测试。
 */
export const calculator = tool(
  ({ a, b }) => ({ sum: a + b }),
  {
    name: "add_numbers",
    description: "精确计算两个数字之和。",
    schema: z.object({
      a: z.number().describe("第一个数字"),
      b: z.number().describe("第二个数字"),
    }),
  },
);

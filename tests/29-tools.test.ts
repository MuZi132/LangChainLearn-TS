import { describe, expect, it } from "vitest";
import { calculator } from "../src/lib/calculator.js";

describe("calculator tool", () => {
  it("adds two numbers deterministically", async () => {
    const result = await calculator.invoke({ a: 19, b: 23 });
    expect(result).toEqual({ sum: 42 });
  });
});

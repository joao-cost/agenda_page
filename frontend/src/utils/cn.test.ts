import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("combina classes removendo duplicadas", () => {
    expect(cn("px-2", "py-3", "px-2")).toBe("py-3 px-2");
  });

  it("ignora valores falsy", () => {
    expect(cn("px-2", false && "py-3", undefined, "text-sm")).toBe("px-2 text-sm");
  });
});



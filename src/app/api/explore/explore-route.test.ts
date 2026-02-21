import { describe, it, expect } from "vitest";

describe("explore API route", () => {
  it("exports a POST handler", async () => {
    const mod = await import("./route");
    expect(typeof mod.POST).toBe("function");
  });

  it("POST handler is an async function", async () => {
    const mod = await import("./route");
    // AsyncFunction check
    expect(mod.POST.constructor.name).toBe("AsyncFunction");
  });
});

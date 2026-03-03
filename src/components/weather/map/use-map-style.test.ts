import { describe, it, expect } from "vitest";
import { useMapStyle } from "./use-map-style";

describe("useMapStyle", () => {
  it("exports useMapStyle as a function", () => {
    expect(typeof useMapStyle).toBe("function");
  });
});

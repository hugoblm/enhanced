import { describe, expect, it } from "vitest";
import { rawIdeaSchema } from "../session";

describe("rawIdeaSchema", () => {
  it("accepts a valid idea at the 20-char boundary", () => {
    const result = rawIdeaSchema.safeParse({
      rawIdea: "A tool for PM valid.",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rawIdea).toBe("A tool for PM valid.");
    }
  });

  it("accepts a long idea well within the max", () => {
    const result = rawIdeaSchema.safeParse({
      rawIdea: "x".repeat(2000),
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty string with the min-length message", () => {
    const result = rawIdeaSchema.safeParse({ rawIdea: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/20 caractères/);
    }
  });

  it("rejects whitespace-only input (trim collapses it to empty)", () => {
    const result = rawIdeaSchema.safeParse({ rawIdea: "                    " });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/20 caractères/);
    }
  });

  it("rejects an idea shorter than 20 chars", () => {
    const result = rawIdeaSchema.safeParse({ rawIdea: "Fix the onboarding" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/20 caractères/);
    }
  });

  it("trims surrounding whitespace before validating min length", () => {
    // "A valid idea text yes" is 21 chars — clearly passes the 20-char min after trim
    const result = rawIdeaSchema.safeParse({
      rawIdea: "   A valid idea text yes   ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rawIdea).toBe("A valid idea text yes");
    }
  });

  it("rejects an idea above the 5000-char max", () => {
    const result = rawIdeaSchema.safeParse({
      rawIdea: "x".repeat(5001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/5 000 caractères/);
    }
  });

  it("rejects non-string input", () => {
    const result = rawIdeaSchema.safeParse({ rawIdea: 12345 });
    expect(result.success).toBe(false);
  });

  it("rejects null input", () => {
    const result = rawIdeaSchema.safeParse({ rawIdea: null });
    expect(result.success).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { splitSentences } from "./splitSentences";
import { profiles } from "../data/profiles";

describe("splitSentences", () => {
  it("splits at sentence-ending punctuation followed by whitespace", () => {
    expect(splitSentences("One. Two! Three? Four.")).toEqual([
      "One.",
      "Two!",
      "Three?",
      "Four.",
    ]);
  });

  it("keeps punctuation that is not followed by whitespace inside a sentence", () => {
    expect(
      splitSentences(
        "Dose 4× standard. IL‑4/IL‑13 blockade (eg, dupilumab) is 2.5× better.",
      ),
    ).toEqual([
      "Dose 4× standard.",
      "IL‑4/IL‑13 blockade (eg, dupilumab) is 2.5× better.",
    ]);
  });

  it("drops stray whitespace and empty fragments", () => {
    expect(splitSentences("  One.   Two.  ")).toEqual(["One.", "Two."]);
    expect(splitSentences("")).toEqual([]);
  });

  // Guards the deck copy against a mid-sentence "X. Y" that would split a
  // rationale in the wrong place (see src/data/profiles.ts). Some of this
  // deck's rationales are a single sentence, so only whole-and-verbatim is
  // asserted, not a minimum count.
  it("splits every deck rationale into whole, verbatim sentences", () => {
    for (const profile of profiles) {
      const parts = splitSentences(profile.explanation);
      expect(parts.length).toBeGreaterThanOrEqual(1);
      expect(parts.join(" ")).toBe(
        profile.explanation.replace(/\s+/g, " ").trim(),
      );
      for (const sentence of parts) expect(sentence).toMatch(/[.!?]$/);
    }
  });
});

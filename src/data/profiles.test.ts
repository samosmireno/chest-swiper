import { describe, expect, it } from "vitest";
import { profiles } from "./profiles";
import type { PatientProfile } from "../types";

// "ED = emergency department; EOS = eosinophil." → ["ED", "EOS"]
function footnoteKeys(footnote: string): string[] {
  return footnote
    .replace(/\.$/, "")
    .split("; ")
    .map((entry) => entry.split(" = ")[0]);
}

function mentions(text: string, abbreviation: string): boolean {
  return new RegExp(`\\b${abbreviation}\\b`).test(text);
}

function cardText(profile: PatientProfile): string {
  return [...profile.bullets, profile.leftOption, profile.rightOption].join(
    " ",
  );
}

// The client's copy review of the deck applied these rules case by case
// ("ICS doesn't appear on this slide", "move ICS before LABA,
// alphabetically", "delete space before Elevated"); see src/data/profiles.ts.
describe("deck copy", () => {
  it("keys only abbreviations printed on the card, in alphabetical order", () => {
    for (const profile of profiles) {
      const keys = footnoteKeys(profile.footnote);
      for (const key of keys) {
        expect(mentions(cardText(profile), key), `${profile.id} ${key}`).toBe(
          true,
        );
      }
      const sorted = [...keys].sort((a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase()),
      );
      expect(keys, profile.id).toEqual(sorted);
    }
  });

  it("keys rationale-only abbreviations under the rationale", () => {
    for (const profile of profiles) {
      if (!profile.explanationFootnote) continue;
      for (const key of footnoteKeys(profile.explanationFootnote)) {
        expect(mentions(profile.explanation, key), `${profile.id} ${key}`).toBe(
          true,
        );
        expect(mentions(cardText(profile), key), `${profile.id} ${key}`).toBe(
          false,
        );
      }
    }
  });

  it("has no stray or doubled whitespace", () => {
    for (const profile of profiles) {
      const texts = [
        profile.name,
        profile.ageSex,
        ...profile.bullets,
        profile.footnote,
        profile.leftOption,
        profile.rightOption,
        profile.explanation,
        profile.explanationFootnote ?? "",
      ];
      for (const text of texts) {
        expect(text, profile.id).toBe(text.trim());
        expect(text, profile.id).not.toMatch(/\s{2}/);
      }
    }
  });
});

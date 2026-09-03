/* Splits prose into sentences at terminal punctuation followed by whitespace.
   The deck's rationales (src/data/profiles.ts) are plain declarative
   sentences — no "e.g."/"vs." abbreviations — so a punctuation-plus-space
   boundary is exact for them; the Figma rationale overlay (node
   I51:1458;42:1226) sets each sentence as its own paragraph. */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

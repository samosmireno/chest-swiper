// Map the ?case= query param to a case id for deep-link preselection.
// Accepts "1" / "2" (or "case2") → "case1" / "case2". Anything else → null.
export function caseIdFromParam(search: string): string | null {
  const raw = new URLSearchParams(search).get('case')
  if (!raw) return null
  const m = raw.match(/(\d+)$/)
  return m ? `case${m[1]}` : null
}

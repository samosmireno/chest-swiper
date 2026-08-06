// Case ids are "case1"/"case2". The display label and the webform column
// numbering (case1_*, c1q*, …) both come from this number — derive it from the
// id, never the array position, since a session now holds a single case at
// index 0 regardless of whether it is Case 1 or Case 2.
export function caseNumber(caseId: string): number {
  return Number(caseId.match(/(\d+)$/)?.[1] ?? 0)
}

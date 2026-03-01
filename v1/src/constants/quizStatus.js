// Normalized progress states used by both UI rendering and progress math.
// Keeping this centralized avoids mismatched string literals across files.
export const QUIZ_STATUS = {
  UNATTEMPTED: 'UNATTEMPTED',
  PARTIAL: 'PARTIAL',
  MASTERED: 'MASTERED'
};

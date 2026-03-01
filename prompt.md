You are updating my quiz data file for a React quiz engine.

Task:
Modify my existing questions JSON so it matches my notes and tests every aspect of understanding.

Inputs:
1) Read notes from:
`/Users/mouad/Desktop/Random/quiz generator/notes.md`

2) Read current questions JSON from:
`/Users/mouad/Desktop/Random/quiz generator/src/data/questions.js`
(Use only the array assigned to `export const questions = [...]`)


Output requirements:
- Return only one valid JavaScript export:
  export const questions = [ ... ];
- Keep this exact schema in questions.js:


Quality rules:
- Cover all major concepts in notes with balanced depth.
- Test: definition, comparison, application, debugging, edge cases, and common misconceptions.
- Include code-reading questions when notes contain code.
- Use plausible distractors (not obviously wrong).
- Exactly one correct option in `options`.
- `requiresWhy` must be `true` for every question.
- Exactly one correct option in `whyOptions`.
- Every option in `options` and `whyOptions` must include a `feedback` sentence.
- Each `feedback` sentence must be informative:
  - if correct: confirm and add a useful concept/detail
  - if incorrect: deny and explain why it is wrong or incomplete
- Hints should guide thinking without revealing answer directly.
- Question wording must be clear and non-duplicative.
- IDs must be sequential: q1, q2, q3...
- Default to 10 questions unless notes are too small (minimum 5).
- Keep language aligned with the notes, but improve clarity and precision.
- Do not add any text outside the JS export.

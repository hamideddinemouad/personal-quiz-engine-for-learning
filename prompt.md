# Notes to Quiz JSON Prompt (Strict Why + 4 Choices)

Copy this entire prompt into your AI tool, then replace the `Raw notes` section.

```text
You are converting raw study notes into quiz JSON for a strict validator.

Task:
- Convert the notes below into one JSON object with "subject" and "questions".

Hard output rules (must follow):
- output must be JSON only (no comments or extra text).
- output in code fences.
- Do not include comments or explanations.
- Use double quotes for all keys and string values.
- Ensure the result can be parsed with JSON.parse (no trailing commas).
- The top-level value must be one JSON object with:
  - "subject": non-empty string
  - "questions": non-empty array of quiz questions
- IDs must be unique in order: q1, q2, q3, ...

Question schema (exact field names):
{
  "subject": "string",
  "questions": [
    {
      "id": "q1",
      "question": "string",
      "hint": "string (optional)",
      "requiresWhy": true,
      "options": [
        { "text": "string", "isCorrect": true, "feedback": "string" },
        { "text": "string", "isCorrect": false, "feedback": "string" },
        { "text": "string", "isCorrect": false, "feedback": "string" },
        { "text": "string", "isCorrect": false, "feedback": "string" }
      ],
      "whyQuestion": "string",
      "whyOptions": [
        { "text": "string", "isCorrect": true, "feedback": "string" },
        { "text": "string", "isCorrect": false, "feedback": "string" },
        { "text": "string", "isCorrect": false, "feedback": "string" },
        { "text": "string", "isCorrect": false, "feedback": "string" }
      ]
    }
  ]
}

Non-negotiable validation constraints:
- Top-level must be an object.
- "subject" must be a non-empty string.
- "questions" must be a non-empty array.
- IDs in "questions" must be unique in order: q1, q2, q3, ...
- Every question must have a non-empty "question" string.
- Every question must set "requiresWhy": true.
- Every question must include non-empty "whyQuestion".
- Every question must include non-empty "whyOptions".
- "options" must contain exactly 4 items.
- "whyOptions" must contain exactly 4 items.
- Each "options" item must have non-empty "text", boolean "isCorrect", and non-empty "feedback".
- Each "whyOptions" item must have non-empty "text", boolean "isCorrect", and non-empty "feedback".
- "options" must contain exactly one correct answer.
- "whyOptions" must contain exactly one correct answer.
- Never output empty arrays for "options" or "whyOptions".
- Include "hint" only when genuinely useful.

Feedback quality constraints (important):
- Feedback must be compact for UI: one sentence, about 8-20 words.
- Feedback must be informative: explain reasoning, not just "Correct" or "Wrong".
- Correct-option feedback should explain why that choice is valid.
- Wrong-option feedback should explain the misconception and hint the right principle.
- Keep tone direct, technical, and concise.

Content quality constraints:
- Keep wording clear and concise.
- Use plausible distractors tied to common confusion from the notes.
- Make options and whyOptions equally plausible: avoid obvious giveaways like one choice being much longer, more specific, or more polished than the others.
- Do not output placeholders like "TBD", "...", or "<...>".

Before finalizing, silently self-check:
1. Output shape is { subject, questions } with non-empty values.
2. Every question has whyQuestion + 4 whyOptions.
3. Every options/whyOptions array has exactly 4 items.
4. Exactly one isCorrect=true in each options and each whyOptions array.
5. JSON is valid and parseable.

JSON structure example:
{
  "subject": "SQL Advanced Fundamentals",
  "questions": [
    {
      "id": "q1",
      "question": "What is the correct logical order of SQL query execution?",
      "hint": "Execution order differs from written syntax.",
      "requiresWhy": true,
      "options": [
        {
          "text": "FROM -> JOIN -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY",
          "isCorrect": true,
          "feedback": "Correct: SQL builds and filters row sets before projection and final sorting."
        },
        {
          "text": "SELECT -> FROM -> WHERE -> GROUP BY -> HAVING -> ORDER BY",
          "isCorrect": false,
          "feedback": "That is written syntax order, but execution starts from source row construction."
        },
        {
          "text": "FROM -> WHERE -> SELECT -> ORDER BY -> GROUP BY -> HAVING",
          "isCorrect": false,
          "feedback": "Grouping and HAVING must occur before projection and after row filtering."
        },
        {
          "text": "WHERE -> FROM -> GROUP BY -> SELECT -> HAVING -> ORDER BY",
          "isCorrect": false,
          "feedback": "WHERE cannot run first because rows do not exist before FROM/JOIN."
        }
      ],
      "whyQuestion": "Why does SQL execute FROM/JOIN before SELECT?",
      "whyOptions": [
        {
          "text": "Because SQL must construct the working row set before choosing output columns.",
          "isCorrect": true,
          "feedback": "Exactly: projection requires a formed dataset, so source resolution happens first."
        },
        {
          "text": "Because SELECT is only for aliases and never controls returned columns.",
          "isCorrect": false,
          "feedback": "Incorrect: SELECT directly controls projection, but only after row-set creation."
        },
        {
          "text": "Because ORDER BY always decides which rows are available to SELECT.",
          "isCorrect": false,
          "feedback": "ORDER BY only sorts final output and does not create eligible rows."
        },
        {
          "text": "Because HAVING defines base tables before joins are evaluated.",
          "isCorrect": false,
          "feedback": "HAVING filters groups later; it does not participate in table resolution."
        }
      ]
    }
  ]
}

Raw notes:
<your notes here>
```

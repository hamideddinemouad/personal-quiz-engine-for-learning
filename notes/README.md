# Notes JSON Output

These files are a previous backup.
If you want to add other backups, put them in a directory called `old-backups`.

Store one quiz JSON file per source note in this directory.

## Naming

Use kebab-case file names based on the note title, for example:

- `notes/sql-joins-basics.json`
- `notes/indexing-and-query-plans.json`

## File format

Each file must be valid JSON with this top-level shape:

- non-empty array of quiz questions
- IDs ordered within the file: `q1`, `q2`, `q3`, ...
- each question follows the strict `requiresWhy` schema used by the app
